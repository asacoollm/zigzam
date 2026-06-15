-- ============================================================
--  ZIGZAM — Récompense « vraie pause » + Signalements de bug
--   #3 : login() crédite +2 🍩 si l'utilisateur ne s'est pas connecté
--        depuis au moins 18h (calcul basé sur users.derniere_activite).
--   #8 : table bug_reports + RPC (créer / lister / mettre à jour).
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  #3 — login() avec récompense de pause (18h)
--  Le type de retour change (ajout de pause_recompense) → DROP obligatoire.
-- ------------------------------------------------------------
drop function if exists public.login(text, text);
create or replace function public.login(p_pseudo text, p_password text)
returns table (
  id uuid,
  pseudo text,
  numero char(4),
  role text,
  donuts integer,
  gemmes integer,
  avatar jsonb,
  premiere_connexion boolean,
  tutoriel_vu boolean,
  pause_recompense boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_last timestamptz;
  v_award boolean := false;
begin
  -- Vérifie les identifiants et récupère la dernière activité connue.
  select u.id, u.derniere_activite
    into v_id, v_last
  from public.users u
  where u.pseudo = p_pseudo
    and u.mot_de_passe = crypt(p_password, u.mot_de_passe);

  -- Identifiants invalides → aucune ligne renvoyée.
  if v_id is null then
    return;
  end if;

  -- Récompense « vraie pause » : +2 🍩 si pas connecté depuis >= 18h.
  -- (derniere_activite null = tout 1er passage → pas de récompense.)
  -- On remet derniere_activite à maintenant pour éviter tout double crédit.
  if v_last is not null and v_last < now() - interval '18 hours' then
    v_award := true;
    update public.users
      set donuts = donuts + 2,
          derniere_activite = now()
      where id = v_id;
    perform public._log_tx(v_id, 'gain', 2, 'donut', 'Récompense pause de 18h 💤');
  end if;

  return query
  select u.id, u.pseudo, u.numero, u.role, u.donuts, u.gemmes, u.avatar,
         u.premiere_connexion, u.tutoriel_vu, v_award
  from public.users u
  where u.id = v_id;
end;
$$;
grant execute on function public.login(text, text) to anon, authenticated;

-- ------------------------------------------------------------
--  #8 — Signalements de bug (bug_reports)
-- ------------------------------------------------------------
create table if not exists public.bug_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete set null,
  message    text not null,
  statut     text not null default 'nouveau',   -- 'nouveau' | 'en_cours' | 'resolu'
  note_admin text,
  date       timestamptz not null default now()
);
alter table public.bug_reports enable row level security; -- accès via RPC uniquement
create index if not exists idx_bug_reports_date on public.bug_reports (date desc);

-- Crée un signalement (depuis n'importe quelle page).
create or replace function public.create_bug_report(p_user uuid, p_message text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_message is null or length(btrim(p_message)) = 0 then
    return jsonb_build_object('error', 'empty');
  end if;
  insert into public.bug_reports(user_id, message)
  values (p_user, left(btrim(p_message), 2000))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

-- Liste de tous les signalements (admin / superadmin), avec l'auteur.
create or replace function public.admin_list_bug_reports(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not exists (select 1 from public.users where id = p_admin and role in ('admin', 'superadmin')) then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'message', b.message,
    'statut', b.statut,
    'note_admin', b.note_admin,
    'date', b.date,
    'auteur', case when u.id is null then null else jsonb_build_object(
      'id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role, 'numero', u.numero
    ) end
  ) order by b.date desc), '[]'::jsonb)
  into v
  from public.bug_reports b
  left join public.users u on u.id = b.user_id;
  return v;
end; $$;

-- Met à jour le statut et/ou la note interne d'un signalement (admin only).
create or replace function public.admin_update_bug_report(
  p_admin uuid, p_report uuid, p_statut text, p_note text
)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.users where id = p_admin and role in ('admin', 'superadmin')) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  update public.bug_reports
    set statut = coalesce(nullif(btrim(p_statut), ''), statut),
        note_admin = p_note
    where id = p_report;
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.create_bug_report(uuid, text) to anon, authenticated;
grant execute on function public.admin_list_bug_reports(uuid) to anon, authenticated;
grant execute on function public.admin_update_bug_report(uuid, uuid, text, text) to anon, authenticated;
