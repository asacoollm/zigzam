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
--   • Corrige les RPC introduites dans CETTE session (médias + salon
--     vocal) avec le pattern sûr `not exists (... and role =
--     'superadmin')`, qui renvoie toujours vrai/faux, jamais NULL.
--   • Les RPC plus anciennes (saisons, utilisateurs, etc.) utilisent le
--     même pattern fautif mais sont HORS PÉRIMÈTRE de ce correctif —
--     signalé séparément à l'utilisateur, à traiter dans une tâche dédiée.
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

create or replace function public.admin_salon_vocal_etat(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role = 'superadmin') then
    return jsonb_build_object('error', 'forbidden');
  end if;
  return public._salon_vocal_json();
end; $$;

create or replace function public.admin_salon_vocal_set_actif(p_admin uuid, p_actif boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role = 'superadmin') then
    return jsonb_build_object('error', 'forbidden');
  end if;

  update public.salon_vocal_etat
  set actif = p_actif, modifie_le = now(), modifie_par = p_admin
  where id = 1;

  if not p_actif then
    delete from public.salon_vocal_participants;
  end if;

  return jsonb_build_object('ok', true, 'etat', public._salon_vocal_json());
end; $$;

create or replace function public.admin_salon_vocal_couper_micro(p_admin uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role = 'superadmin') then
    return jsonb_build_object('error', 'forbidden');
  end if;

  update public.salon_vocal_participants set micro_coupe = true where user_id = p_user;

  return jsonb_build_object('ok', true, 'etat', public._salon_vocal_json());
end; $$;

create or replace function public.admin_salon_vocal_exclure(p_admin uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role = 'superadmin') then
    return jsonb_build_object('error', 'forbidden');
  end if;

  delete from public.salon_vocal_participants where user_id = p_user;

  return jsonb_build_object('ok', true, 'etat', public._salon_vocal_json());
end; $$;

create or replace function public.admin_salon_vocal_vider(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role = 'superadmin') then
    return jsonb_build_object('error', 'forbidden');
  end if;

  delete from public.salon_vocal_participants;

  return jsonb_build_object('ok', true, 'etat', public._salon_vocal_json());
end; $$;

-- salon_vocal_rejoindre utilisait déjà `not exists (... premiere_connexion =
-- false)`, pattern déjà sûr (NOT EXISTS ne renvoie jamais NULL) : rien à
-- corriger là.
