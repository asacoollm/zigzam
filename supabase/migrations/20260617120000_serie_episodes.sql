-- ============================================================
--  ZIGZAM — Série Zigzam 🎬 : visibilité des épisodes
--   Table d'overrides de publication par épisode (la valeur par défaut
--   reste dans le fichier de données `publie`). Le superadmin peut
--   publier / dépublier un épisode pour tout le monde.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  Table : override de publication (1 ligne par épisode modifié)
-- ------------------------------------------------------------
create table if not exists public.serie_episodes (
  episode_id text primary key,
  publie     boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.serie_episodes enable row level security; -- accès via RPC uniquement

-- ------------------------------------------------------------
--  Lecture publique : map { episode_id: publie } des overrides
-- ------------------------------------------------------------
create or replace function public.get_serie_visibility()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(episode_id, publie), '{}'::jsonb)
  from public.serie_episodes;
$$;

-- ------------------------------------------------------------
--  Superadmin : publier / dépublier un épisode
-- ------------------------------------------------------------
create or replace function public.admin_set_serie_publie(p_admin uuid, p_episode text, p_publie boolean)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return 'forbidden';
  end if;
  insert into public.serie_episodes (episode_id, publie, updated_at)
    values (p_episode, p_publie, now())
  on conflict (episode_id) do update
    set publie = excluded.publie, updated_at = now();
  return 'ok';
end; $$;

grant execute on function public.get_serie_visibility() to anon, authenticated;
grant execute on function public.admin_set_serie_publie(uuid, text, boolean) to anon, authenticated;
