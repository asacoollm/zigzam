-- ============================================================
--  ZIGZAM — Vidéos dans Discuter — ÉTAPE 3
--   • RPC d'envoi d'un message vidéo, avec vérifications serveur :
--     interrupteur global actif, utilisateur existant (pattern NULL-
--     safe identique à send_photo_message), limite de 10 médias par
--     jour ET PAR ÉLÈVE (photos + vidéos comptées ensemble — corrige
--     au passage send_photo_message qui ne comptait que les photos),
--     durée et taille dans des bornes raisonnables.
--   • Taille : on NE FAIT PAS confiance à une valeur annoncée par le
--     client (facilement falsifiable dans un appel RPC direct) — on
--     relit la taille réelle enregistrée par Storage pour le fichier
--     effectivement uploadé (storage.objects.metadata->>'size'),
--     même pattern que cleanup_vocaux() pour extraire le chemin
--     depuis l'URL publique.
--   • Durée : lue côté navigateur via les métadonnées de la vidéo
--     choisie, annoncée par le client. Aucun moyen de la revérifier
--     côté serveur sans extension dédiée (hors périmètre) — bornée
--     largement (30 s + marge) comme garde-fou, pas comme preuve.
--   • Réutilise la colonne messages.media_url existante (comme pour
--     les photos) avec type = 'video' : aucune nouvelle colonne.
--   • get_messages n'a PAS besoin d'être retouchée : elle expose déjà
--     type + media_url génériquement depuis l'étape 2.
--   • On NE TOUCHE PAS aux buckets "vocaux"/"actualites", aux
--     messages existants, ni à l'interrupteur medias_reglages.
--   • Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. send_photo_message : limite quotidienne désormais combinée
--     (photos + vidéos), seul changement par rapport à l'étape 2.
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

  if not coalesce((select actif from public.medias_reglages where id = true), false) then
    return jsonb_build_object('error', 'inactif');
  end if;

  if not exists (select 1 from public.users where id = p_auteur) then
    return jsonb_build_object('error', 'utilisateur_introuvable');
  end if;

  -- Limite quotidienne : photos ET vidéos comptées ensemble (étape 3).
  select count(*) into v_count_jour
  from public.messages
  where auteur_id = p_auteur and type in ('photo', 'video') and date::date = current_date;

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

-- ------------------------------------------------------------
--  2. Envoi d'un message vidéo (fichier déjà uploadé côté client
--     dans le bucket "medias", sans conversion).
-- ------------------------------------------------------------
create or replace function public.send_video_message(p_discussion uuid, p_auteur uuid, p_media_url text, p_duree_s numeric)
returns jsonb language plpgsql security definer set search_path = public, storage as $$
declare
  v jsonb;
  v_count_jour int;
  v_path text;
  v_taille_reelle bigint;
begin
  if p_media_url is null or btrim(p_media_url) = '' then
    return jsonb_build_object('error', 'media_manquant');
  end if;

  if not coalesce((select actif from public.medias_reglages where id = true), false) then
    return jsonb_build_object('error', 'inactif');
  end if;

  if not exists (select 1 from public.users where id = p_auteur) then
    return jsonb_build_object('error', 'utilisateur_introuvable');
  end if;

  -- Durée annoncée par le client — borne large (30 s + 1 s de marge
  -- d'arrondi), pas une preuve cryptographique.
  if p_duree_s is null or p_duree_s <= 0 or p_duree_s > 31 then
    return jsonb_build_object('error', 'duree_invalide');
  end if;

  -- Taille réelle du fichier effectivement stocké (jamais la valeur annoncée).
  v_path := split_part(p_media_url, '/medias/', 2);
  if v_path = '' then
    return jsonb_build_object('error', 'media_introuvable');
  end if;

  select (metadata->>'size')::bigint into v_taille_reelle
  from storage.objects where bucket_id = 'medias' and name = v_path;

  if v_taille_reelle is null or v_taille_reelle > 15 * 1024 * 1024 then
    return jsonb_build_object('error', 'taille_invalide');
  end if;

  select count(*) into v_count_jour
  from public.messages
  where auteur_id = p_auteur and type in ('photo', 'video') and date::date = current_date;

  if v_count_jour >= 10 then
    return jsonb_build_object('error', 'limite_quotidienne');
  end if;

  insert into public.messages(discussion_id, auteur_id, contenu, type, media_url)
  values (p_discussion, p_auteur, '', 'video', p_media_url)
  returning jsonb_build_object(
    'id', id, 'contenu', contenu, 'date', date, 'discussion_id', discussion_id,
    'type', type, 'media_url', media_url
  ) into v;

  select v || jsonb_build_object('auteur',
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
  into v from public.users u where u.id = p_auteur;

  return v;
end; $$;

grant execute on function public.send_video_message(uuid, uuid, text, numeric) to anon, authenticated;
