-- ============================================================
--  ZIGZAM — Messages vocaux dans Discuter
--   • colonnes messages.type / messages.audio_url
--   • bucket Storage "vocaux"
--   • table vocal_ecoutes (qui a écouté quoi)
--   • RPC send_vocal_message / mark_vocal_ecoute / cleanup_vocaux
--   • get_messages renvoie désormais type + audio_url
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. Colonnes sur messages
-- ------------------------------------------------------------
alter table public.messages add column if not exists type text not null default 'texte'; -- 'texte' | 'vocal'
alter table public.messages add column if not exists audio_url text;

-- contenu obligatoire pour un texte, mais vide pour un vocal : on relâche la
-- contrainte NOT NULL pour autoriser les vocaux (contenu = '').
alter table public.messages alter column contenu drop not null;

-- ------------------------------------------------------------
--  2. Bucket Storage "vocaux" (lecture publique + upload client)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vocaux', 'vocaux', true)
on conflict (id) do update set public = true;

drop policy if exists "vocaux_read" on storage.objects;
create policy "vocaux_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vocaux');

drop policy if exists "vocaux_insert" on storage.objects;
create policy "vocaux_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'vocaux');

-- ------------------------------------------------------------
--  3. Suivi des écoutes
-- ------------------------------------------------------------
create table if not exists public.vocal_ecoutes (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  ecoute_le  timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.vocal_ecoutes enable row level security;

-- ------------------------------------------------------------
--  4. Envoi d'un message vocal
-- ------------------------------------------------------------
create or replace function public.send_vocal_message(p_discussion uuid, p_auteur uuid, p_audio_url text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  insert into public.messages(discussion_id, auteur_id, contenu, type, audio_url)
  values (p_discussion, p_auteur, '', 'vocal', p_audio_url)
  returning jsonb_build_object(
    'id', id, 'contenu', contenu, 'date', date, 'discussion_id', discussion_id,
    'type', type, 'audio_url', audio_url
  ) into v;
  select v || jsonb_build_object('auteur',
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
  into v from public.users u where u.id = p_auteur;
  return v;
end; $$;

grant execute on function public.send_vocal_message(uuid, uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
--  5. get_messages : on expose type + audio_url + role auteur
-- ------------------------------------------------------------
create or replace function public.get_messages(p_discussion uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'contenu', m.contenu, 'date', m.date,
    'type', m.type, 'audio_url', m.audio_url,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role)
  ) order by m.date), '[]'::jsonb)
  into v
  from public.messages m join public.users u on u.id = m.auteur_id
  where m.discussion_id = p_discussion;
  return v;
end; $$;

-- ------------------------------------------------------------
--  6. Marquer un vocal comme écouté
-- ------------------------------------------------------------
create or replace function public.mark_vocal_ecoute(p_message uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.vocal_ecoutes(message_id, user_id)
  values (p_message, p_user)
  on conflict (message_id, user_id) do nothing;
end; $$;

grant execute on function public.mark_vocal_ecoute(uuid, uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  7. Nettoyage : supprime du Storage les vocaux écoutés par TOUS
--     les destinataires depuis plus de 24h. Renvoie le nb supprimé.
-- ------------------------------------------------------------
create or replace function public.cleanup_vocaux()
returns integer language plpgsql security definer set search_path = public, storage as $$
declare r record; v_count int := 0; v_path text;
begin
  for r in
    select m.id, m.audio_url, m.discussion_id, m.auteur_id
    from public.messages m
    where m.type = 'vocal' and m.audio_url is not null
  loop
    -- Il faut au moins un destinataire (hors auteur), et que tous aient écouté.
    if (select count(*) from public.participants p
          where p.discussion_id = r.discussion_id and p.user_id <> r.auteur_id) > 0
       and not exists (
         select 1 from public.participants p
         where p.discussion_id = r.discussion_id and p.user_id <> r.auteur_id
           and not exists (
             select 1 from public.vocal_ecoutes ve
             where ve.message_id = r.id and ve.user_id = p.user_id
           )
       )
       and (select max(ecoute_le) from public.vocal_ecoutes where message_id = r.id)
             < now() - interval '24 hours'
    then
      v_path := split_part(r.audio_url, '/vocaux/', 2);
      if v_path <> '' then
        delete from storage.objects where bucket_id = 'vocaux' and name = v_path;
      end if;
      update public.messages set audio_url = null where id = r.id;
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end; $$;

grant execute on function public.cleanup_vocaux() to anon, authenticated;
