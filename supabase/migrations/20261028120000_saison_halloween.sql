-- ============================================================
--  ZIGZAM — Saison 3 : « Halloween 🎃 »
--   Ajoute la saison au catalogue `saisons` (INACTIVE par défaut : elle se
--   déclenche depuis /admin → Saisons). Pas de skins pour l'instant :
--   `saison_skins` reste vide pour ce slug, ils arriveront plus tard.
--   Aucune nouvelle table ni RPC : toute l'infrastructure des saisons
--   (20260624120000_saisons.sql) est déjà paramétrée par slug.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  La saison. Comme pour Jurassic/Disney, le `on conflict` ne réécrit PAS
--  actif / dates : si le superadmin les a déjà réglés en base, un
--  nouveau `db:push` ne doit pas les écraser.
-- ------------------------------------------------------------
insert into public.saisons (slug, nom, actif, date_debut, date_fin, theme)
values (
  'halloween', 'Halloween 🎃', false, '2026-10-28T00:00:00Z', '2026-11-28T23:59:59Z',
  jsonb_build_object(
    'numero', 3,
    'couleurs', jsonb_build_object(
      'fondSombre', '#1a0b2e', 'fondViolet', '#2b1750', 'fondProfond', '#120821',
      'accent', '#ff7a18', 'accentClair', '#ffb066',
      'slime', '#7bff4f', 'creme', '#fff4e0'),
    'emoji', '🎃'
  )
)
on conflict (slug) do update
  set nom = excluded.nom,
      theme = excluded.theme;
