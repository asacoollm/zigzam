-- ============================================================
--  ZIGZAM — Floor is Lava : mode VS ⚔️ (1 contre 1, humain ou bot)
--   Plateau divisé en cases BLEUES et ROSES (moitié/moitié, réparties
--   aléatoirement, dérivées du seed côté client — même patron que le
--   multijoueur #6 : la base ne stocke que l'état partagé). Chaque
--   joueur active les cases de sa propre couleur ; manche chronométrée
--   à 60 s. Le score le plus haut à la fin gagne +2 🍩 (+1 chacun en
--   cas d'égalité).
--  Idempotent.
-- ============================================================

create table if not exists public.flava_vs_sessions (
  id             uuid primary key default gen_random_uuid(),
  statut         text not null default 'attente',   -- 'attente' | 'active' | 'termine'
  seed           bigint not null,
  taille         int not null default 8,
  contre_bot     boolean not null default false,
  bot_niveau     int,
  duree_s        int not null default 60,
  cases_activees int[] not null default '{}',        -- indices r*taille+c déjà activés
  resultat       jsonb,
  started_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.flava_vs_players (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.flava_vs_sessions(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  pseudo     text,
  avatar     jsonb,
  role       text,
  equipe     text not null check (equipe in ('bleu', 'rose')),
  is_bot     boolean not null default false,
  r          int not null default 0,
  c          int not null default 0,
  score      int not null default 0,
  joined_at  timestamptz not null default now()
);

alter table public.flava_vs_sessions enable row level security; -- accès via RPC uniquement
alter table public.flava_vs_players  enable row level security; -- accès via RPC uniquement
create index if not exists idx_flava_vs_players_session on public.flava_vs_players (session_id);
create index if not exists idx_flava_vs_sessions_statut on public.flava_vs_sessions (statut);

-- ------------------------------------------------------------
--  Sérialise une session VS + ses joueurs.
-- ------------------------------------------------------------
create or replace function public._flava_vs_session_json(p_session uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; s public.flava_vs_sessions;
begin
  select * into s from public.flava_vs_sessions where id = p_session;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;

  select jsonb_build_object(
    'session', jsonb_build_object(
      'id', s.id, 'statut', s.statut, 'seed', s.seed, 'taille', s.taille,
      'contre_bot', s.contre_bot, 'bot_niveau', s.bot_niveau, 'duree_s', s.duree_s,
      'cases_activees', to_jsonb(s.cases_activees), 'resultat', s.resultat,
      'started_at', case when s.started_at is null then null
                          else (extract(epoch from s.started_at) * 1000)::bigint end
    ),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'pseudo', p.pseudo, 'avatar', p.avatar, 'role', p.role,
        'equipe', p.equipe, 'is_bot', p.is_bot, 'r', p.r, 'c', p.c, 'score', p.score
      ) order by p.joined_at)
      from public.flava_vs_players p where p.session_id = s.id
    ), '[]'::jsonb)
  ) into v;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Termine la manche si le temps est écoulé (idempotent — ne fait
--  rien si déjà 'termine' ou pas encore active). Verse la récompense.
-- ------------------------------------------------------------
create or replace function public._flava_vs_finish(p_session uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  s public.flava_vs_sessions;
  v_bleu int; v_rose int; v_bleu_uid uuid; v_rose_uid uuid;
begin
  select * into s from public.flava_vs_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'active' or s.started_at is null then return; end if;
  if now() < s.started_at + (s.duree_s || ' seconds')::interval then return; end if;

  select score, user_id into v_bleu, v_bleu_uid from public.flava_vs_players
    where session_id = p_session and equipe = 'bleu' limit 1;
  select score, user_id into v_rose, v_rose_uid from public.flava_vs_players
    where session_id = p_session and equipe = 'rose' limit 1;
  v_bleu := coalesce(v_bleu, 0);
  v_rose := coalesce(v_rose, 0);

  update public.flava_vs_sessions set statut = 'termine', updated_at = now(),
    resultat = jsonb_build_object(
      'score_bleu', v_bleu, 'score_rose', v_rose,
      'gagnant', case when v_bleu > v_rose then 'bleu' when v_rose > v_bleu then 'rose' else 'egalite' end)
    where id = p_session;

  if v_bleu_uid is not null then
    if v_bleu > v_rose then
      update public.users set donuts = donuts + 2 where id = v_bleu_uid;
      perform public._log_tx(v_bleu_uid, 'gain', 2, 'donut', 'Floor is Lava VS — victoire ⚔️');
    elsif v_bleu = v_rose then
      update public.users set donuts = donuts + 1 where id = v_bleu_uid;
      perform public._log_tx(v_bleu_uid, 'gain', 1, 'donut', 'Floor is Lava VS — égalité ⚔️');
    end if;
  end if;
  if v_rose_uid is not null then
    if v_rose > v_bleu then
      update public.users set donuts = donuts + 2 where id = v_rose_uid;
      perform public._log_tx(v_rose_uid, 'gain', 2, 'donut', 'Floor is Lava VS — victoire ⚔️');
    elsif v_rose = v_bleu then
      update public.users set donuts = donuts + 1 where id = v_rose_uid;
      perform public._log_tx(v_rose_uid, 'gain', 1, 'donut', 'Floor is Lava VS — égalité ⚔️');
    end if;
  end if;
end; $$;

-- ------------------------------------------------------------
--  Contre un joueur humain : rejoint une partie en attente créée par
--  quelqu'un d'autre (démarre aussitôt), sinon en crée une et patiente.
--  Reprend la session en cours si l'appelant en a déjà une (idempotent).
-- ------------------------------------------------------------
create or replace function public.flava_vs_join_or_create(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_vs_sessions; v_u public.users;
begin
  select * into v_u from public.users where id = p_user;
  if v_u.id is null then return jsonb_build_object('error', 'no_user'); end if;

  -- Reprend une session déjà en cours pour cet utilisateur (anti-doublon).
  select fs.* into s from public.flava_vs_sessions fs
    join public.flava_vs_players fp on fp.session_id = fs.id and fp.user_id = p_user
    where fs.statut in ('attente', 'active')
    order by fs.created_at desc limit 1;
  if s.id is not null then
    return public._flava_vs_session_json(s.id);
  end if;

  -- Ménage : parties en attente abandonnées depuis plus de 5 min.
  delete from public.flava_vs_sessions
    where statut = 'attente' and created_at < now() - interval '5 minutes';

  -- Une partie humaine attend déjà quelqu'un → on la rejoint et on démarre.
  select fs.* into s from public.flava_vs_sessions fs
    where fs.statut = 'attente' and fs.contre_bot = false
    order by fs.created_at asc limit 1 for update;

  if s.id is not null then
    insert into public.flava_vs_players(session_id, user_id, pseudo, avatar, role, equipe, r, c)
      values (s.id, p_user, v_u.pseudo, v_u.avatar, v_u.role, 'rose', s.taille - 2, s.taille - 2);
    update public.flava_vs_sessions set statut = 'active', started_at = now(), updated_at = now()
      where id = s.id;
    return public._flava_vs_session_json(s.id);
  end if;

  -- Personne n'attend : on crée la partie (équipe bleue) et on patiente.
  insert into public.flava_vs_sessions(seed, taille, contre_bot)
    values ((floor(random() * 2000000000))::bigint, 8, false)
    returning * into s;
  insert into public.flava_vs_players(session_id, user_id, pseudo, avatar, role, equipe, r, c)
    values (s.id, p_user, v_u.pseudo, v_u.avatar, v_u.role, 'bleu', 1, 1);

  return public._flava_vs_session_json(s.id);
end; $$;

-- ------------------------------------------------------------
--  Contre un bot : crée + démarre aussitôt une session solo-vs-bot.
--  p_niveau : 1 (lent, bête) à 9 (rapide, optimal).
-- ------------------------------------------------------------
create or replace function public.flava_vs_create_bot(p_user uuid, p_niveau int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_vs_sessions; v_u public.users; v_niveau int;
begin
  select * into v_u from public.users where id = p_user;
  if v_u.id is null then return jsonb_build_object('error', 'no_user'); end if;
  v_niveau := greatest(1, least(9, coalesce(p_niveau, 5)));

  insert into public.flava_vs_sessions(seed, taille, contre_bot, bot_niveau, statut, started_at)
    values ((floor(random() * 2000000000))::bigint, 8, true, v_niveau, 'active', now())
    returning * into s;

  insert into public.flava_vs_players(session_id, user_id, pseudo, avatar, role, equipe, r, c)
    values (s.id, p_user, v_u.pseudo, v_u.avatar, v_u.role, 'bleu', 1, 1);
  insert into public.flava_vs_players(session_id, user_id, pseudo, avatar, role, equipe, is_bot, r, c)
    values (
      s.id, null, '🤖 Bot niveau ' || v_niveau, jsonb_build_object('color', 'rouge'), null,
      'rose', true, s.taille - 2, s.taille - 2
    );

  return public._flava_vs_session_json(s.id);
end; $$;

-- ------------------------------------------------------------
--  État courant (vérifie/termine la manche si le temps est écoulé).
-- ------------------------------------------------------------
create or replace function public.flava_vs_state(p_session uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public._flava_vs_finish(p_session);
  return public._flava_vs_session_json(p_session);
end; $$;

-- ------------------------------------------------------------
--  Déplacement (joueur humain / bot).
-- ------------------------------------------------------------
create or replace function public.flava_vs_move(p_session uuid, p_user uuid, p_r int, p_c int)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.flava_vs_players set r = p_r, c = p_c
    where session_id = p_session and user_id = p_user;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.flava_vs_bot_move(p_session uuid, p_r int, p_c int)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.flava_vs_players set r = p_r, c = p_c
    where session_id = p_session and is_bot = true;
  return jsonb_build_object('ok', true);
end; $$;

-- ------------------------------------------------------------
--  Active une case de sa propre couleur (+1 point). Sans effet si déjà
--  activée par l'un ou l'autre. Vérifie aussi la fin du chrono.
-- ------------------------------------------------------------
create or replace function public.flava_vs_activate(p_session uuid, p_user uuid, p_cell int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_vs_sessions;
begin
  perform public._flava_vs_finish(p_session);
  select * into s from public.flava_vs_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'active' then return public._flava_vs_session_json(p_session); end if;

  if not (p_cell = any(s.cases_activees)) then
    update public.flava_vs_sessions
      set cases_activees = array_append(cases_activees, p_cell), updated_at = now()
      where id = p_session;
    update public.flava_vs_players set score = score + 1
      where session_id = p_session and user_id = p_user;
  end if;

  return public._flava_vs_session_json(p_session);
end; $$;

create or replace function public.flava_vs_bot_activate(p_session uuid, p_cell int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.flava_vs_sessions;
begin
  perform public._flava_vs_finish(p_session);
  select * into s from public.flava_vs_sessions where id = p_session for update;
  if s.id is null or s.statut <> 'active' then return public._flava_vs_session_json(p_session); end if;

  if not (p_cell = any(s.cases_activees)) then
    update public.flava_vs_sessions
      set cases_activees = array_append(cases_activees, p_cell), updated_at = now()
      where id = p_session;
    update public.flava_vs_players set score = score + 1
      where session_id = p_session and is_bot = true;
  end if;

  return public._flava_vs_session_json(p_session);
end; $$;

-- ------------------------------------------------------------
--  Quitte la partie. En attente → supprimée. Active → forfait, la
--  personne humaine restante gagne directement (+2 🍩).
-- ------------------------------------------------------------
create or replace function public.flava_vs_leave(p_session uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s public.flava_vs_sessions; v_other uuid; v_other_equipe text;
begin
  select * into s from public.flava_vs_sessions where id = p_session for update;
  if s.id is null then return; end if;

  if s.statut = 'active' then
    select user_id, equipe into v_other, v_other_equipe from public.flava_vs_players
      where session_id = p_session and user_id <> p_user and user_id is not null limit 1;
    if v_other is not null then
      update public.users set donuts = donuts + 2 where id = v_other;
      perform public._log_tx(v_other, 'gain', 2, 'donut', 'Floor is Lava VS — victoire (adversaire parti) ⚔️');
    end if;
    update public.flava_vs_sessions set statut = 'termine', updated_at = now(),
      resultat = jsonb_build_object('abandon', true, 'gagnant', coalesce(v_other_equipe, 'aucun'))
      where id = p_session;
  elsif s.statut = 'attente' then
    delete from public.flava_vs_sessions where id = p_session;
  end if;
end; $$;

grant execute on function public.flava_vs_join_or_create(uuid) to anon, authenticated;
grant execute on function public.flava_vs_create_bot(uuid, int) to anon, authenticated;
grant execute on function public.flava_vs_state(uuid, uuid) to anon, authenticated;
grant execute on function public.flava_vs_move(uuid, uuid, int, int) to anon, authenticated;
grant execute on function public.flava_vs_bot_move(uuid, int, int) to anon, authenticated;
grant execute on function public.flava_vs_activate(uuid, uuid, int) to anon, authenticated;
grant execute on function public.flava_vs_bot_activate(uuid, int) to anon, authenticated;
grant execute on function public.flava_vs_leave(uuid, uuid) to anon, authenticated;
