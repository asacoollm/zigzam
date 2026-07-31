-- ============================================================
--  ZIGZAM — Fix : un message qu'on vient d'envoyer soi-même ne doit
--  jamais déclencher la pastille « non lu » dans la liste des
--  discussions. `get_discussions` comparait la date du DERNIER
--  message (quel que soit l'auteur) à `lu_le` : si on envoyait un
--  message après avoir ouvert la conversation (donc après le dernier
--  `mark_read`), il se retrouvait après `lu_le` → faux positif.
--  `get_badges` faisait déjà `m.auteur_id <> p_user` correctement ;
--  on applique la même logique ici (non_lu = existe un message d'un
--  AUTRE participant plus récent que la dernière lecture).
--  Idempotent.
-- ============================================================

create or replace function public.get_discussions(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(t) order by t.derniere_date desc nulls last), '[]'::jsonb)
  into v from (
    select d.id, d.titre, d.type, d.createur_id,
      (d.createur_id = p_user) as est_createur,
      (select count(*) from public.participants where discussion_id = d.id) as nb_participants,
      (select array_agg(uu.pseudo) from public.participants pp
         join public.users uu on uu.id = pp.user_id where pp.discussion_id = d.id) as pseudos,
      lm.contenu as dernier_message,
      lm.date as derniere_date,
      exists (
        select 1 from public.messages m
        where m.discussion_id = d.id
          and m.auteur_id <> p_user
          and m.date > coalesce(pt.lu_le, pt.rejoint_le)
      ) as non_lu
    from public.participants pt
    join public.discussions d on d.id = pt.discussion_id
    left join lateral (
      select contenu, date from public.messages
      where discussion_id = d.id order by date desc limit 1
    ) lm on true
    where pt.user_id = p_user
  ) t;
  return v;
end; $$;
