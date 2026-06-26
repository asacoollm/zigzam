-- ============================================================
--  ZIGZAM — Appels audio/vidéo (WebRTC + signalisation Realtime)
--   • tables appels / appel_participants
--   • RPC appel_create / appel_join / appel_refuse / appel_end / appel_get
--  La signalisation WebRTC (offer/answer/ice) passe par les canaux
--  Realtime « broadcast » côté client — rien à stocker en base.
--  Idempotent. Accès via RPC SECURITY DEFINER uniquement.
-- ============================================================

create table if not exists public.appels (
  id              uuid primary key default gen_random_uuid(),
  discussion_id   uuid not null references public.discussions(id) on delete cascade,
  initiateur_id   uuid not null references public.users(id) on delete cascade,
  type            text not null default 'audio',       -- 'audio' | 'video'
  statut          text not null default 'en_attente',  -- 'en_attente' | 'actif' | 'termine' | 'manque'
  date_debut      timestamptz not null default now(),
  date_fin        timestamptz,
  duree_secondes  integer
);

create table if not exists public.appel_participants (
  appel_id    uuid not null references public.appels(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  rejoint_le  timestamptz,
  quitte_le   timestamptz,
  primary key (appel_id, user_id)
);

alter table public.appels             enable row level security;
alter table public.appel_participants enable row level security;

create index if not exists idx_appels_discussion on public.appels(discussion_id, date_debut desc);

-- ------------------------------------------------------------
--  Helper interne : état complet d'un appel (JSON).
-- ------------------------------------------------------------
create or replace function public._appel_json(p_appel uuid)
returns jsonb language sql security definer set search_path = public as $$
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
$$;

-- ------------------------------------------------------------
--  Crée un appel : participants = tous les membres de la discussion.
--  L'initiateur est marqué comme « rejoint » d'emblée.
-- ------------------------------------------------------------
create or replace function public.appel_create(p_discussion uuid, p_initiateur uuid, p_type text)
returns jsonb language plpgsql security definer set search_path = public as $$
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
end; $$;

-- ------------------------------------------------------------
--  Rejoindre un appel (l'utilisateur a accepté).
-- ------------------------------------------------------------
create or replace function public.appel_join(p_appel uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.appel_participants
  set rejoint_le = coalesce(rejoint_le, now()), quitte_le = null
  where appel_id = p_appel and user_id = p_user;

  update public.appels set statut = 'actif'
  where id = p_appel and statut in ('en_attente', 'actif');

  return public._appel_json(p_appel);
end; $$;

-- ------------------------------------------------------------
--  Refuser un appel. Si plus personne ne peut répondre et que personne
--  n'a accepté → appel « manqué » + message « Appel manqué 📵 ».
--  Renvoie { ok, message? , discussion_id }.
-- ------------------------------------------------------------
create or replace function public.appel_refuse(p_appel uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
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
end; $$;

-- ------------------------------------------------------------
--  Quitter / raccrocher. Quand il ne reste plus qu'une personne (ou zéro)
--  en ligne, l'appel se termine : statut 'termine', durée, message
--  « Appel terminé ⏱ durée : X ». Le message n'est inséré qu'une seule fois.
--  Renvoie { ended, message?, discussion_id }.
-- ------------------------------------------------------------
create or replace function public.appel_end(p_appel uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
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
end; $$;

-- ------------------------------------------------------------
--  État d'un appel.
-- ------------------------------------------------------------
create or replace function public.appel_get(p_appel uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public._appel_json(p_appel);
end; $$;

grant execute on function public.appel_create(uuid, uuid, text) to anon, authenticated;
grant execute on function public.appel_join(uuid, uuid) to anon, authenticated;
grant execute on function public.appel_refuse(uuid, uuid) to anon, authenticated;
grant execute on function public.appel_end(uuid, uuid) to anon, authenticated;
grant execute on function public.appel_get(uuid) to anon, authenticated;
