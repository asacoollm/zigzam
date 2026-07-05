-- NOTE : la ligne `drop extension if exists "pg_net";` générée par
-- `supabase db pull` a été retirée — c'est un artefact du diff (pg_net est
-- une extension managée Supabase, jamais censée être supprimée). Le reste
-- capture la fonctionnalité « appels » (tables + RPC) appliquée directement
-- en prod (migration distante orpheline 20260627120000), désormais versionnée.

  create table "public"."appel_participants" (
    "appel_id" uuid not null,
    "user_id" uuid not null,
    "rejoint_le" timestamp with time zone,
    "quitte_le" timestamp with time zone
      );


alter table "public"."appel_participants" enable row level security;


  create table "public"."appels" (
    "id" uuid not null default gen_random_uuid(),
    "discussion_id" uuid not null,
    "initiateur_id" uuid not null,
    "type" text not null default 'audio'::text,
    "statut" text not null default 'en_attente'::text,
    "date_debut" timestamp with time zone not null default now(),
    "date_fin" timestamp with time zone,
    "duree_secondes" integer
      );


alter table "public"."appels" enable row level security;

CREATE UNIQUE INDEX appel_participants_pkey ON public.appel_participants USING btree (appel_id, user_id);

CREATE UNIQUE INDEX appels_pkey ON public.appels USING btree (id);

CREATE INDEX idx_appels_discussion ON public.appels USING btree (discussion_id, date_debut DESC);

alter table "public"."appel_participants" add constraint "appel_participants_pkey" PRIMARY KEY using index "appel_participants_pkey";

alter table "public"."appels" add constraint "appels_pkey" PRIMARY KEY using index "appels_pkey";

alter table "public"."appel_participants" add constraint "appel_participants_appel_id_fkey" FOREIGN KEY (appel_id) REFERENCES public.appels(id) ON DELETE CASCADE not valid;

alter table "public"."appel_participants" validate constraint "appel_participants_appel_id_fkey";

alter table "public"."appel_participants" add constraint "appel_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."appel_participants" validate constraint "appel_participants_user_id_fkey";

alter table "public"."appels" add constraint "appels_discussion_id_fkey" FOREIGN KEY (discussion_id) REFERENCES public.discussions(id) ON DELETE CASCADE not valid;

alter table "public"."appels" validate constraint "appels_discussion_id_fkey";

alter table "public"."appels" add constraint "appels_initiateur_id_fkey" FOREIGN KEY (initiateur_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."appels" validate constraint "appels_initiateur_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public._appel_json(p_appel uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'id', a.id,
    'discussion_id', a.discussion_id,
    'type', a.type,
    'statut', a.statut,
    'initiateur_id', a.initiateur_id,
    'date_debut', a.date_debut,
    'date_fin', a.date_fin,
    'duree_secondes', a.duree_secondes,
    'initiateur', (
      select jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role)
      from public.users u where u.id = a.initiateur_id
    ),
    'participants', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', ap.user_id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
        'rejoint_le', ap.rejoint_le, 'quitte_le', ap.quitte_le
      ) order by u.pseudo), '[]'::jsonb)
      from public.appel_participants ap join public.users u on u.id = ap.user_id
      where ap.appel_id = a.id
    )
  )
  from public.appels a where a.id = p_appel;
$function$
;

CREATE OR REPLACE FUNCTION public.appel_create(p_discussion uuid, p_initiateur uuid, p_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  insert into public.appels(discussion_id, initiateur_id, type, statut)
  values (p_discussion, p_initiateur, coalesce(nullif(p_type, ''), 'audio'), 'en_attente')
  returning id into v_id;

  insert into public.appel_participants(appel_id, user_id, rejoint_le)
  select v_id, pp.user_id, case when pp.user_id = p_initiateur then now() else null end
  from public.participants pp
  where pp.discussion_id = p_discussion
  on conflict do nothing;

  return public._appel_json(v_id);
end; $function$
;

CREATE OR REPLACE FUNCTION public.appel_end(p_appel uuid, p_user uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_active int; v_disc uuid; v_init uuid; v_start timestamptz; v_dur int; v_txt text; v_n int; v_msg jsonb;
begin
  update public.appel_participants set quitte_le = now()
  where appel_id = p_appel and user_id = p_user and quitte_le is null;

  select count(*) into v_active
  from public.appel_participants
  where appel_id = p_appel and rejoint_le is not null and quitte_le is null;

  if v_active > 1 then
    return jsonb_build_object('ended', false);
  end if;

  select discussion_id, initiateur_id, date_debut into v_disc, v_init, v_start
  from public.appels where id = p_appel;

  v_dur := greatest(0, extract(epoch from (now() - v_start))::int);

  update public.appels
  set statut = 'termine', date_fin = now(), duree_secondes = v_dur
  where id = p_appel and statut <> 'termine';
  get diagnostics v_n = row_count;

  -- Déjà clôturé par quelqu'un d'autre → pas de second message.
  if v_n = 0 then
    return jsonb_build_object('ended', true, 'discussion_id', v_disc);
  end if;

  if v_dur < 60 then
    v_txt := 'Appel terminé ⏱ durée : ' || v_dur || ' s';
  else
    v_txt := 'Appel terminé ⏱ durée : ' || (v_dur / 60) || ' min';
  end if;

  insert into public.messages(discussion_id, auteur_id, contenu, type)
  values (v_disc, v_init, v_txt, 'texte')
  returning jsonb_build_object('id', id, 'contenu', contenu, 'date', date,
    'discussion_id', discussion_id, 'type', type) into v_msg;
  select v_msg || jsonb_build_object('auteur',
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
  into v_msg from public.users u where u.id = v_init;

  return jsonb_build_object('ended', true, 'message', v_msg, 'discussion_id', v_disc);
end; $function$
;

CREATE OR REPLACE FUNCTION public.appel_get(p_appel uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return public._appel_json(p_appel);
end; $function$
;

CREATE OR REPLACE FUNCTION public.appel_join(p_appel uuid, p_user uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.appel_participants
  set rejoint_le = coalesce(rejoint_le, now()), quitte_le = null
  where appel_id = p_appel and user_id = p_user;

  update public.appels set statut = 'actif'
  where id = p_appel and statut in ('en_attente', 'actif');

  return public._appel_json(p_appel);
end; $function$
;

CREATE OR REPLACE FUNCTION public.appel_refuse(p_appel uuid, p_user uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_init uuid; v_disc uuid; v_n int; v_msg jsonb;
begin
  update public.appel_participants set quitte_le = now()
  where appel_id = p_appel and user_id = p_user and rejoint_le is null;

  select initiateur_id, discussion_id into v_init, v_disc from public.appels where id = p_appel;

  -- Personne n'a accepté (hors initiateur) et plus aucun invité en attente ?
  if not exists (
        select 1 from public.appel_participants ap
        where ap.appel_id = p_appel and ap.user_id <> v_init and ap.rejoint_le is not null
      )
     and not exists (
        select 1 from public.appel_participants ap
        where ap.appel_id = p_appel and ap.user_id <> v_init
          and ap.rejoint_le is null and ap.quitte_le is null
      )
  then
    update public.appels set statut = 'manque' where id = p_appel and statut = 'en_attente';
    get diagnostics v_n = row_count;
    if v_n > 0 then
      insert into public.messages(discussion_id, auteur_id, contenu, type)
      values (v_disc, v_init, 'Appel manqué 📵', 'texte')
      returning jsonb_build_object('id', id, 'contenu', contenu, 'date', date,
        'discussion_id', discussion_id, 'type', type) into v_msg;
      select v_msg || jsonb_build_object('auteur',
        jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
      into v_msg from public.users u where u.id = v_init;
      return jsonb_build_object('ok', true, 'message', v_msg, 'discussion_id', v_disc);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'discussion_id', v_disc);
end; $function$
;

grant delete on table "public"."accessoires_catalogue" to "anon";

grant insert on table "public"."accessoires_catalogue" to "anon";

grant select on table "public"."accessoires_catalogue" to "anon";

grant update on table "public"."accessoires_catalogue" to "anon";

grant delete on table "public"."accessoires_catalogue" to "authenticated";

grant insert on table "public"."accessoires_catalogue" to "authenticated";

grant select on table "public"."accessoires_catalogue" to "authenticated";

grant update on table "public"."accessoires_catalogue" to "authenticated";

grant delete on table "public"."accessoires_catalogue" to "service_role";

grant insert on table "public"."accessoires_catalogue" to "service_role";

grant select on table "public"."accessoires_catalogue" to "service_role";

grant update on table "public"."accessoires_catalogue" to "service_role";

grant delete on table "public"."actualites" to "anon";

grant insert on table "public"."actualites" to "anon";

grant select on table "public"."actualites" to "anon";

grant update on table "public"."actualites" to "anon";

grant delete on table "public"."actualites" to "authenticated";

grant insert on table "public"."actualites" to "authenticated";

grant select on table "public"."actualites" to "authenticated";

grant update on table "public"."actualites" to "authenticated";

grant delete on table "public"."actualites" to "service_role";

grant insert on table "public"."actualites" to "service_role";

grant select on table "public"."actualites" to "service_role";

grant update on table "public"."actualites" to "service_role";

grant delete on table "public"."appel_participants" to "anon";

grant insert on table "public"."appel_participants" to "anon";

grant references on table "public"."appel_participants" to "anon";

grant select on table "public"."appel_participants" to "anon";

grant trigger on table "public"."appel_participants" to "anon";

grant truncate on table "public"."appel_participants" to "anon";

grant update on table "public"."appel_participants" to "anon";

grant delete on table "public"."appel_participants" to "authenticated";

grant insert on table "public"."appel_participants" to "authenticated";

grant references on table "public"."appel_participants" to "authenticated";

grant select on table "public"."appel_participants" to "authenticated";

grant trigger on table "public"."appel_participants" to "authenticated";

grant truncate on table "public"."appel_participants" to "authenticated";

grant update on table "public"."appel_participants" to "authenticated";

grant delete on table "public"."appel_participants" to "service_role";

grant insert on table "public"."appel_participants" to "service_role";

grant references on table "public"."appel_participants" to "service_role";

grant select on table "public"."appel_participants" to "service_role";

grant trigger on table "public"."appel_participants" to "service_role";

grant truncate on table "public"."appel_participants" to "service_role";

grant update on table "public"."appel_participants" to "service_role";

grant delete on table "public"."appels" to "anon";

grant insert on table "public"."appels" to "anon";

grant references on table "public"."appels" to "anon";

grant select on table "public"."appels" to "anon";

grant trigger on table "public"."appels" to "anon";

grant truncate on table "public"."appels" to "anon";

grant update on table "public"."appels" to "anon";

grant delete on table "public"."appels" to "authenticated";

grant insert on table "public"."appels" to "authenticated";

grant references on table "public"."appels" to "authenticated";

grant select on table "public"."appels" to "authenticated";

grant trigger on table "public"."appels" to "authenticated";

grant truncate on table "public"."appels" to "authenticated";

grant update on table "public"."appels" to "authenticated";

grant delete on table "public"."appels" to "service_role";

grant insert on table "public"."appels" to "service_role";

grant references on table "public"."appels" to "service_role";

grant select on table "public"."appels" to "service_role";

grant trigger on table "public"."appels" to "service_role";

grant truncate on table "public"."appels" to "service_role";

grant update on table "public"."appels" to "service_role";

grant delete on table "public"."boites_mysteres" to "anon";

grant insert on table "public"."boites_mysteres" to "anon";

grant select on table "public"."boites_mysteres" to "anon";

grant update on table "public"."boites_mysteres" to "anon";

grant delete on table "public"."boites_mysteres" to "authenticated";

grant insert on table "public"."boites_mysteres" to "authenticated";

grant select on table "public"."boites_mysteres" to "authenticated";

grant update on table "public"."boites_mysteres" to "authenticated";

grant delete on table "public"."boites_mysteres" to "service_role";

grant insert on table "public"."boites_mysteres" to "service_role";

grant select on table "public"."boites_mysteres" to "service_role";

grant update on table "public"."boites_mysteres" to "service_role";

grant delete on table "public"."boites_templates" to "anon";

grant insert on table "public"."boites_templates" to "anon";

grant select on table "public"."boites_templates" to "anon";

grant update on table "public"."boites_templates" to "anon";

grant delete on table "public"."boites_templates" to "authenticated";

grant insert on table "public"."boites_templates" to "authenticated";

grant select on table "public"."boites_templates" to "authenticated";

grant update on table "public"."boites_templates" to "authenticated";

grant delete on table "public"."boites_templates" to "service_role";

grant insert on table "public"."boites_templates" to "service_role";

grant select on table "public"."boites_templates" to "service_role";

grant update on table "public"."boites_templates" to "service_role";

grant delete on table "public"."bug_reports" to "anon";

grant insert on table "public"."bug_reports" to "anon";

grant select on table "public"."bug_reports" to "anon";

grant update on table "public"."bug_reports" to "anon";

grant delete on table "public"."bug_reports" to "authenticated";

grant insert on table "public"."bug_reports" to "authenticated";

grant select on table "public"."bug_reports" to "authenticated";

grant update on table "public"."bug_reports" to "authenticated";

grant delete on table "public"."bug_reports" to "service_role";

grant insert on table "public"."bug_reports" to "service_role";

grant select on table "public"."bug_reports" to "service_role";

grant update on table "public"."bug_reports" to "service_role";

grant delete on table "public"."codes_invitation" to "anon";

grant insert on table "public"."codes_invitation" to "anon";

grant select on table "public"."codes_invitation" to "anon";

grant update on table "public"."codes_invitation" to "anon";

grant delete on table "public"."codes_invitation" to "authenticated";

grant insert on table "public"."codes_invitation" to "authenticated";

grant select on table "public"."codes_invitation" to "authenticated";

grant update on table "public"."codes_invitation" to "authenticated";

grant delete on table "public"."codes_invitation" to "service_role";

grant insert on table "public"."codes_invitation" to "service_role";

grant select on table "public"."codes_invitation" to "service_role";

grant update on table "public"."codes_invitation" to "service_role";

grant delete on table "public"."commentaires" to "anon";

grant insert on table "public"."commentaires" to "anon";

grant select on table "public"."commentaires" to "anon";

grant update on table "public"."commentaires" to "anon";

grant delete on table "public"."commentaires" to "authenticated";

grant insert on table "public"."commentaires" to "authenticated";

grant select on table "public"."commentaires" to "authenticated";

grant update on table "public"."commentaires" to "authenticated";

grant delete on table "public"."commentaires" to "service_role";

grant insert on table "public"."commentaires" to "service_role";

grant select on table "public"."commentaires" to "service_role";

grant update on table "public"."commentaires" to "service_role";

grant delete on table "public"."contacts" to "anon";

grant insert on table "public"."contacts" to "anon";

grant select on table "public"."contacts" to "anon";

grant update on table "public"."contacts" to "anon";

grant delete on table "public"."contacts" to "authenticated";

grant insert on table "public"."contacts" to "authenticated";

grant select on table "public"."contacts" to "authenticated";

grant update on table "public"."contacts" to "authenticated";

grant delete on table "public"."contacts" to "service_role";

grant insert on table "public"."contacts" to "service_role";

grant select on table "public"."contacts" to "service_role";

grant update on table "public"."contacts" to "service_role";

grant delete on table "public"."controle_parental" to "anon";

grant insert on table "public"."controle_parental" to "anon";

grant select on table "public"."controle_parental" to "anon";

grant update on table "public"."controle_parental" to "anon";

grant delete on table "public"."controle_parental" to "authenticated";

grant insert on table "public"."controle_parental" to "authenticated";

grant select on table "public"."controle_parental" to "authenticated";

grant update on table "public"."controle_parental" to "authenticated";

grant delete on table "public"."controle_parental" to "service_role";

grant insert on table "public"."controle_parental" to "service_role";

grant select on table "public"."controle_parental" to "service_role";

grant update on table "public"."controle_parental" to "service_role";

grant delete on table "public"."discussions" to "anon";

grant insert on table "public"."discussions" to "anon";

grant select on table "public"."discussions" to "anon";

grant update on table "public"."discussions" to "anon";

grant delete on table "public"."discussions" to "authenticated";

grant insert on table "public"."discussions" to "authenticated";

grant select on table "public"."discussions" to "authenticated";

grant update on table "public"."discussions" to "authenticated";

grant delete on table "public"."discussions" to "service_role";

grant insert on table "public"."discussions" to "service_role";

grant select on table "public"."discussions" to "service_role";

grant update on table "public"."discussions" to "service_role";

grant delete on table "public"."flava_players" to "anon";

grant insert on table "public"."flava_players" to "anon";

grant select on table "public"."flava_players" to "anon";

grant update on table "public"."flava_players" to "anon";

grant delete on table "public"."flava_players" to "authenticated";

grant insert on table "public"."flava_players" to "authenticated";

grant select on table "public"."flava_players" to "authenticated";

grant update on table "public"."flava_players" to "authenticated";

grant delete on table "public"."flava_players" to "service_role";

grant insert on table "public"."flava_players" to "service_role";

grant select on table "public"."flava_players" to "service_role";

grant update on table "public"."flava_players" to "service_role";

grant delete on table "public"."flava_sessions" to "anon";

grant insert on table "public"."flava_sessions" to "anon";

grant select on table "public"."flava_sessions" to "anon";

grant update on table "public"."flava_sessions" to "anon";

grant delete on table "public"."flava_sessions" to "authenticated";

grant insert on table "public"."flava_sessions" to "authenticated";

grant select on table "public"."flava_sessions" to "authenticated";

grant update on table "public"."flava_sessions" to "authenticated";

grant delete on table "public"."flava_sessions" to "service_role";

grant insert on table "public"."flava_sessions" to "service_role";

grant select on table "public"."flava_sessions" to "service_role";

grant update on table "public"."flava_sessions" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."participants" to "anon";

grant insert on table "public"."participants" to "anon";

grant select on table "public"."participants" to "anon";

grant update on table "public"."participants" to "anon";

grant delete on table "public"."participants" to "authenticated";

grant insert on table "public"."participants" to "authenticated";

grant select on table "public"."participants" to "authenticated";

grant update on table "public"."participants" to "authenticated";

grant delete on table "public"."participants" to "service_role";

grant insert on table "public"."participants" to "service_role";

grant select on table "public"."participants" to "service_role";

grant update on table "public"."participants" to "service_role";

grant delete on table "public"."saison_skins" to "anon";

grant insert on table "public"."saison_skins" to "anon";

grant select on table "public"."saison_skins" to "anon";

grant update on table "public"."saison_skins" to "anon";

grant delete on table "public"."saison_skins" to "authenticated";

grant insert on table "public"."saison_skins" to "authenticated";

grant select on table "public"."saison_skins" to "authenticated";

grant update on table "public"."saison_skins" to "authenticated";

grant delete on table "public"."saison_skins" to "service_role";

grant insert on table "public"."saison_skins" to "service_role";

grant select on table "public"."saison_skins" to "service_role";

grant update on table "public"."saison_skins" to "service_role";

grant delete on table "public"."saisons" to "anon";

grant insert on table "public"."saisons" to "anon";

grant select on table "public"."saisons" to "anon";

grant update on table "public"."saisons" to "anon";

grant delete on table "public"."saisons" to "authenticated";

grant insert on table "public"."saisons" to "authenticated";

grant select on table "public"."saisons" to "authenticated";

grant update on table "public"."saisons" to "authenticated";

grant delete on table "public"."saisons" to "service_role";

grant insert on table "public"."saisons" to "service_role";

grant select on table "public"."saisons" to "service_role";

grant update on table "public"."saisons" to "service_role";

grant delete on table "public"."serie_episodes" to "anon";

grant insert on table "public"."serie_episodes" to "anon";

grant select on table "public"."serie_episodes" to "anon";

grant update on table "public"."serie_episodes" to "anon";

grant delete on table "public"."serie_episodes" to "authenticated";

grant insert on table "public"."serie_episodes" to "authenticated";

grant select on table "public"."serie_episodes" to "authenticated";

grant update on table "public"."serie_episodes" to "authenticated";

grant delete on table "public"."serie_episodes" to "service_role";

grant insert on table "public"."serie_episodes" to "service_role";

grant select on table "public"."serie_episodes" to "service_role";

grant update on table "public"."serie_episodes" to "service_role";

grant delete on table "public"."serie_propositions" to "anon";

grant insert on table "public"."serie_propositions" to "anon";

grant select on table "public"."serie_propositions" to "anon";

grant update on table "public"."serie_propositions" to "anon";

grant delete on table "public"."serie_propositions" to "authenticated";

grant insert on table "public"."serie_propositions" to "authenticated";

grant select on table "public"."serie_propositions" to "authenticated";

grant update on table "public"."serie_propositions" to "authenticated";

grant delete on table "public"."serie_propositions" to "service_role";

grant insert on table "public"."serie_propositions" to "service_role";

grant select on table "public"."serie_propositions" to "service_role";

grant update on table "public"."serie_propositions" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vocal_ecoutes" to "anon";

grant insert on table "public"."vocal_ecoutes" to "anon";

grant select on table "public"."vocal_ecoutes" to "anon";

grant update on table "public"."vocal_ecoutes" to "anon";

grant delete on table "public"."vocal_ecoutes" to "authenticated";

grant insert on table "public"."vocal_ecoutes" to "authenticated";

grant select on table "public"."vocal_ecoutes" to "authenticated";

grant update on table "public"."vocal_ecoutes" to "authenticated";

grant delete on table "public"."vocal_ecoutes" to "service_role";

grant insert on table "public"."vocal_ecoutes" to "service_role";

grant select on table "public"."vocal_ecoutes" to "service_role";

grant update on table "public"."vocal_ecoutes" to "service_role";

grant delete on table "public"."vues_actualites" to "anon";

grant insert on table "public"."vues_actualites" to "anon";

grant select on table "public"."vues_actualites" to "anon";

grant update on table "public"."vues_actualites" to "anon";

grant delete on table "public"."vues_actualites" to "authenticated";

grant insert on table "public"."vues_actualites" to "authenticated";

grant select on table "public"."vues_actualites" to "authenticated";

grant update on table "public"."vues_actualites" to "authenticated";

grant delete on table "public"."vues_actualites" to "service_role";

grant insert on table "public"."vues_actualites" to "service_role";

grant select on table "public"."vues_actualites" to "service_role";

grant update on table "public"."vues_actualites" to "service_role";


