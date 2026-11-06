-- ============================================================
--  ZIGZAM — Correctif sécurité : vérif superadmin cassée par NULL
--   • Pattern fautif : `if (select role from users where id = p_admin)
--     <> 'superadmin' then return forbidden; end if;`
--     Si p_admin ne correspond à AUCUNE ligne (uuid inventé/inexistant),
--     la sous-requête renvoie NULL. En SQL, `NULL <> 'superadmin'` vaut
--     NULL (ni vrai ni faux) ; dans un `if`, NULL est traité comme FAUX
--     → la vérification est contournée et l'action privilégiée s'exécute.
--   • Trouvé en testant `admin_set_medias_actif` avec un uuid bidon
--     (00000000-0000-0000-0000-000000000000) : le switch s'est activé
--     sans compte superadmin valide. Remis à `false` immédiatement.
--   • Corrige la RPC médias avec le pattern sûr `not exists (... and
--     role = 'superadmin')`, qui renvoie toujours vrai/faux, jamais NULL.
--   • Les RPC plus anciennes (saisons, utilisateurs, etc.) utilisent le
--     même pattern fautif mais sont HORS PÉRIMÈTRE de ce correctif —
--     signalé séparément à l'utilisateur, à traiter dans une tâche dédiée.
--   • Le correctif équivalent pour les RPC du salon vocal vit désormais
--     dans sa propre migration, sur la branche `chat-vocal`
--     (20261104150000_fix_salon_vocal_role_check_null.sql) — ce fichier
--     ne portait initialement les deux à la fois, scindé pour que
--     `medias-messages` puisse fusionner dans `main` sans code salon
--     vocal.
-- ============================================================

create or replace function public.admin_set_medias_actif(p_admin uuid, p_actif boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role = 'superadmin') then
    return jsonb_build_object('error', 'forbidden');
  end if;

  update public.medias_reglages set actif = p_actif where id = true;

  return jsonb_build_object('ok', true, 'actif', p_actif);
end; $$;
