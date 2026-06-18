-- ============================================================
--  ZIGZAM — Superadmin : réinitialiser le mot de passe / le numéro
--   d'un membre. Deux RPC SECURITY DEFINER qui vérifient que
--   l'appelant est superadmin.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  reset_password : nouveau mot de passe temporaire.
--   Repasse premiere_connexion à true → l'utilisateur devra le
--   changer à sa prochaine connexion (onboarding).
-- ------------------------------------------------------------
create or replace function public.reset_password(p_admin uuid, p_target uuid, p_new text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if p_new is null or length(btrim(p_new)) = 0 then
    return jsonb_build_object('error', 'empty');
  end if;
  if not exists (select 1 from public.users where id = p_target) then
    return jsonb_build_object('error', 'introuvable');
  end if;
  update public.users
    set mot_de_passe = crypt(p_new, gen_salt('bf')),
        premiere_connexion = true
    where id = p_target;
  return jsonb_build_object('ok', true);
end; $$;

-- ------------------------------------------------------------
--  reset_numero : nouveau numéro à 4 chiffres, unique.
-- ------------------------------------------------------------
create or replace function public.reset_numero(p_admin uuid, p_target uuid, p_numero text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_holder text;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if p_numero !~ '^[0-9]{4}$' then
    return jsonb_build_object('error', 'numero_invalide');
  end if;
  if not exists (select 1 from public.users where id = p_target) then
    return jsonb_build_object('error', 'introuvable');
  end if;
  -- Numéro déjà utilisé par quelqu'un d'autre ?
  select pseudo into v_holder
    from public.users
    where numero = p_numero and id <> p_target
    limit 1;
  if v_holder is not null then
    return jsonb_build_object('error', 'numero_pris', 'pseudo', v_holder);
  end if;
  update public.users set numero = p_numero where id = p_target;
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.reset_password(uuid, uuid, text) to anon, authenticated;
grant execute on function public.reset_numero(uuid, uuid, text) to anon, authenticated;
