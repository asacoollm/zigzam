-- ============================================================
--  ZIGZAM — get_my_actus : exclure les actus refusées
--   L'auteur voit ses actus publiées + en attente dans le fil,
--   mais PLUS ses actus refusées (visibles seulement dans /admin).
--  Idempotent.
-- ============================================================

create or replace function public.get_my_actus(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image,
    'date', a.date, 'statut', a.statut,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.auteur_id = p_user and a.statut <> 'refuse';
  return v;
end; $$;

grant execute on function public.get_my_actus(uuid) to anon, authenticated;
