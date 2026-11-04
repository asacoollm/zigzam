-- ============================================================
--  ZIGZAM — Photos & vidéos dans Discuter + Actualités — ÉTAPE 1
--   • Base de données + bucket + interrupteur global. AUCUN envoi
--     réel encore (pas de bouton, pas d'upload) : cette étape ne
--     fait qu'ajouter les colonnes, la table des signalements, le
--     bucket et l'interrupteur, DÉSACTIVÉ par défaut.
--   • Bucket "medias" configuré EXACTEMENT comme "vocaux" (public,
--     upload ouvert anon+authenticated) : pas d'URL signée, pas de
--     policy de "list" dédiée. La protection vient des noms de
--     fichiers en UUID v4 (128 bits d'aléa, non devinable) — même
--     niveau de confiance que le reste de l'appli (voir note dans
--     HANDOFF.md). On NE TOUCHE PAS aux buckets "vocaux" et
--     "actualites" existants.
--   • RLS partout, RPC SECURITY DEFINER avec search_path figé,
--     idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. Colonnes médias sur messages / actualites.
-- ------------------------------------------------------------
alter table public.messages add column if not exists media_url text;
-- type existe déjà ('texte' | 'vocal') ; 'photo' | 'video' s'ajoutent
-- sans contrainte DB (comme pour 'vocal'), vérifiés côté RPC.

alter table public.actualites add column if not exists type text not null default 'texte';
alter table public.actualites add column if not exists video_url text;
-- Les actus déjà publiées avec une image sont rétroactivement marquées
-- 'photo' pour que le futur rendu basé sur `type` reste cohérent.
update public.actualites set type = 'photo' where image is not null and type = 'texte';

-- ------------------------------------------------------------
--  2. Interrupteur global "médias actifs" — même pattern que
--     farces_reglages. DÉSACTIVÉ par défaut.
-- ------------------------------------------------------------
create table if not exists public.medias_reglages (
  id     boolean primary key default true,
  actif  boolean not null default false,
  constraint medias_reglages_singleton check (id)
);
insert into public.medias_reglages (id, actif) values (true, false)
  on conflict (id) do nothing;

-- ------------------------------------------------------------
--  3. Signalements de médias (vide pour l'instant — le bouton
--     "Signaler" et ses RPC arrivent dans une étape suivante).
--     Visibles par le superadmin uniquement.
-- ------------------------------------------------------------
create table if not exists public.media_signalements (
  id           uuid primary key default gen_random_uuid(),
  source       text not null check (source in ('message', 'actu')),
  source_id    uuid not null,
  signale_par  uuid not null references public.users(id) on delete cascade,
  raison       text,
  cree_le      timestamptz not null default now(),
  traite       boolean not null default false,
  traite_le    timestamptz,
  traite_par   uuid references public.users(id) on delete set null
);
create index if not exists idx_media_signalements_traite on public.media_signalements(traite, cree_le desc);

alter table public.medias_reglages     enable row level security;
alter table public.media_signalements  enable row level security;
-- Aucune policy : accès exclusivement via les RPC SECURITY DEFINER.
revoke all on public.medias_reglages    from anon, authenticated;
revoke all on public.media_signalements from anon, authenticated;

-- ------------------------------------------------------------
--  4. Bucket Storage "medias" (lecture publique + upload client),
--     configuré à l'identique du bucket "vocaux".
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('medias', 'medias', true)
on conflict (id) do update set public = true;

drop policy if exists "medias_read" on storage.objects;
create policy "medias_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'medias');

drop policy if exists "medias_insert" on storage.objects;
create policy "medias_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'medias');

-- ------------------------------------------------------------
--  5. Public : lecture seule de l'interrupteur global (pour
--     masquer l'UI élève tant que c'est désactivé).
-- ------------------------------------------------------------
create or replace function public.get_medias_actif()
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select actif from public.medias_reglages where id = true), false);
$$;

-- ------------------------------------------------------------
--  6. Superadmin : bascule l'interrupteur global.
-- ------------------------------------------------------------
create or replace function public.admin_set_medias_actif(p_admin uuid, p_actif boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  update public.medias_reglages set actif = p_actif where id = true;

  return jsonb_build_object('ok', true, 'actif', p_actif);
end; $$;

grant execute on function public.get_medias_actif() to anon, authenticated;
grant execute on function public.admin_set_medias_actif(uuid, boolean) to anon, authenticated;
