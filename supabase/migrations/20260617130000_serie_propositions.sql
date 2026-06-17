-- ============================================================
--  ZIGZAM — Série Zigzam 🎬 : propositions d'épisodes
--   Les élèves proposent une idée d'épisode (titre + description).
--   Le superadmin les consulte dans /admin, peut les marquer comme
--   lues, ou les refuser poliment (un message automatique est alors
--   envoyé à l'auteur dans Discuter, de la part d'Asacool).
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  Table : propositions d'épisodes
-- ------------------------------------------------------------
create table if not exists public.serie_propositions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  titre       text not null,
  description text not null,
  statut      text not null default 'nouveau',   -- 'nouveau' | 'lu' | 'refuse'
  date        timestamptz not null default now()
);
alter table public.serie_propositions enable row level security; -- accès via RPC uniquement
create index if not exists idx_serie_propositions_date on public.serie_propositions (date desc);

-- ------------------------------------------------------------
--  Créer une proposition (depuis la page /serie)
-- ------------------------------------------------------------
create or replace function public.create_serie_proposition(
  p_user uuid, p_titre text, p_description text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_titre is null or length(btrim(p_titre)) = 0
     or p_description is null or length(btrim(p_description)) = 0 then
    return jsonb_build_object('error', 'empty');
  end if;
  insert into public.serie_propositions(user_id, titre, description)
  values (p_user, left(btrim(p_titre), 120), left(btrim(p_description), 2000))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

-- ------------------------------------------------------------
--  Lister toutes les propositions (admin / superadmin), avec l'auteur
-- ------------------------------------------------------------
create or replace function public.admin_list_serie_propositions(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not exists (select 1 from public.users where id = p_admin and role in ('admin', 'superadmin')) then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'titre', p.titre,
    'description', p.description,
    'statut', p.statut,
    'date', p.date,
    'auteur', case when u.id is null then null else jsonb_build_object(
      'id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role, 'numero', u.numero
    ) end
  ) order by p.date desc), '[]'::jsonb)
  into v
  from public.serie_propositions p
  left join public.users u on u.id = p.user_id;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Marquer une proposition comme lue (admin only)
-- ------------------------------------------------------------
create or replace function public.admin_mark_serie_proposition_lu(p_admin uuid, p_prop uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role in ('admin', 'superadmin')) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  update public.serie_propositions set statut = 'lu' where id = p_prop;
  return jsonb_build_object('ok', true);
end; $$;

-- ------------------------------------------------------------
--  Refuser poliment une proposition (admin only) :
--   marque la proposition « refuse » et envoie un message automatique
--   à l'auteur dans Discuter, de la part d'Asacool.
-- ------------------------------------------------------------
create or replace function public.admin_refuse_serie_proposition(p_admin uuid, p_prop uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_asacool uuid; v_disc uuid;
begin
  if not exists (select 1 from public.users where id = p_admin and role in ('admin', 'superadmin')) then
    return jsonb_build_object('error', 'forbidden');
  end if;

  update public.serie_propositions set statut = 'refuse'
    where id = p_prop
    returning user_id into v_author;

  -- Message poli à l'auteur, s'il existe encore.
  if v_author is not null then
    select id into v_asacool
    from public.users
    where numero = '6767' or pseudo = 'Asacool'
    order by (pseudo = 'Asacool') desc
    limit 1;

    if v_asacool is not null and v_asacool <> v_author then
      insert into public.discussions(titre, type, createur_id)
      values (null, 'prive', v_asacool) returning id into v_disc;
      insert into public.participants(discussion_id, user_id)
      values (v_disc, v_asacool), (v_disc, v_author)
      on conflict do nothing;
      insert into public.messages(discussion_id, auteur_id, contenu)
      values (
        v_disc, v_asacool,
        'Merci pour ton idée ! On ne va pas pouvoir la faire pour l''instant, mais continue à proposer 🎬'
      );
    end if;
  end if;

  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.create_serie_proposition(uuid, text, text) to anon, authenticated;
grant execute on function public.admin_list_serie_propositions(uuid) to anon, authenticated;
grant execute on function public.admin_mark_serie_proposition_lu(uuid, uuid) to anon, authenticated;
grant execute on function public.admin_refuse_serie_proposition(uuid, uuid) to anon, authenticated;
