-- ============================================================
--  ZIGZAM — Fil d'actualités : exclure les actus refusées
--   Le fil public (get_actus) ne renvoie QUE les actus publiées :
--   ni les refusées, ni celles en attente n'apparaissent pour les
--   autres utilisateurs (élèves, admins, superadmin).
--   Seul l'auteur voit ses propres actus non publiées, via
--   get_my_actus (inchangée) → badge « Refusée ❌ ».
--  Idempotent.
-- ============================================================

create or replace function public.get_actus()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image, 'date', a.date,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = 'publie';   -- exclut explicitement 'refuse' et 'en_attente'
  return v;
end; $$;

grant execute on function public.get_actus() to anon, authenticated;
