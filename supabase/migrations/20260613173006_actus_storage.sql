-- ============================================================
--  ZIGZAM — Actualités : bucket Storage "actualites" (photos)
--  + RPC get_my_actus (mes actus, tous statuts, pour le badge auteur).
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. Bucket Storage public "actualites"
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('actualites', 'actualites', true)
on conflict (id) do update set public = true;

-- Lecture publique + upload depuis le client (clé anon).
drop policy if exists "actualites_read" on storage.objects;
create policy "actualites_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'actualites');

drop policy if exists "actualites_insert" on storage.objects;
create policy "actualites_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'actualites');

-- ------------------------------------------------------------
--  2. Mes actualités (tous statuts) — pour afficher « en attente » à l'auteur
-- ------------------------------------------------------------
create or replace function public.get_my_actus(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image,
    'date', a.date, 'statut', a.statut,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.auteur_id = p_user;
  return v;
end; $$;

grant execute on function public.get_my_actus(uuid) to anon, authenticated;
