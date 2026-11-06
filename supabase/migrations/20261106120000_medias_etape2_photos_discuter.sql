-- ============================================================
--  ZIGZAM — Photos dans Discuter — ÉTAPE 2
--   • RPC d'envoi d'un message photo, avec vérifications serveur :
--     interrupteur global actif, utilisateur existant, limite de
--     10 photos par jour et par élève.
--   • get_messages étendu pour exposer media_url (colonne ajoutée
--     par l'étape 1 mais jamais encore renvoyée par la RPC).
--   • Pattern NULL-safe partout : `not exists (select 1 ...)` et
--     `coalesce(..., false)`, jamais de comparaison directe sur une
--     valeur qui peut être NULL (voir 20261104140000_fix_admin_role_
--     check_null.sql pour le piège évité).
--   • On NE TOUCHE PAS aux buckets "vocaux"/"actualites", aux
--     messages existants, ni à l'interrupteur medias_reglages (il
--     reste géré uniquement par admin_set_medias_actif, toujours
--     désactivé par défaut).
--   • Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. Envoi d'un message photo (média déjà uploadé côté client
--     dans le bucket "medias", recadré/compressé, URL publique
--     passée ici).
-- ------------------------------------------------------------
create or replace function public.send_photo_message(p_discussion uuid, p_auteur uuid, p_media_url text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v jsonb;
  v_count_jour int;
begin
  if p_media_url is null or btrim(p_media_url) = '' then
    return jsonb_build_object('error', 'media_manquant');
  end if;

  -- Interrupteur global : `coalesce` évite tout NULL si la ligne singleton
  -- venait à manquer (jamais le cas en pratique, mais pas de comparaison
  -- directe sur une valeur potentiellement NULL).
  if not coalesce((select actif from public.medias_reglages where id = true), false) then
    return jsonb_build_object('error', 'inactif');
  end if;

  -- `not exists` ne renvoie jamais NULL : contrairement à une comparaison
  -- directe sur un uuid inexistant, un p_auteur invalide est bien rejeté.
  if not exists (select 1 from public.users where id = p_auteur) then
    return jsonb_build_object('error', 'utilisateur_introuvable');
  end if;

  select count(*) into v_count_jour
  from public.messages
  where auteur_id = p_auteur and type = 'photo' and date::date = current_date;

  if v_count_jour >= 10 then
    return jsonb_build_object('error', 'limite_quotidienne');
  end if;

  insert into public.messages(discussion_id, auteur_id, contenu, type, media_url)
  values (p_discussion, p_auteur, '', 'photo', p_media_url)
  returning jsonb_build_object(
    'id', id, 'contenu', contenu, 'date', date, 'discussion_id', discussion_id,
    'type', type, 'media_url', media_url
  ) into v;

  select v || jsonb_build_object('auteur',
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
  into v from public.users u where u.id = p_auteur;

  return v;
end; $$;

grant execute on function public.send_photo_message(uuid, uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
--  2. get_messages : on expose désormais media_url (déjà présent
--     sur la table depuis l'étape 1, jamais renvoyé jusqu'ici).
-- ------------------------------------------------------------
create or replace function public.get_messages(p_discussion uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'contenu', m.contenu, 'date', m.date,
    'type', m.type, 'audio_url', m.audio_url, 'media_url', m.media_url,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role)
  ) order by m.date), '[]'::jsonb)
  into v
  from public.messages m join public.users u on u.id = m.auteur_id
  where m.discussion_id = p_discussion;
  return v;
end; $$;
