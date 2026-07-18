-- ============================================================
--  ZIGZAM — Saison 2 : « Zigzamland Paris ✨ » 🏰
--   Ajoute la saison au catalogue `saisons` (INACTIVE par défaut : elle se
--   déclenche depuis /admin → Saisons) et enregistre ses skins exclusifs.
--   Aucune nouvelle table ni RPC : toute l'infrastructure des saisons
--   (20260624120000_saisons.sql) est déjà paramétrée par slug.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  La saison. Comme pour Jurassic, le `on conflict` ne réécrit PAS
--  actif / dates : si le superadmin les a déjà réglés en base, un
--  nouveau `db:push` ne doit pas les écraser.
-- ------------------------------------------------------------
insert into public.saisons (slug, nom, actif, date_debut, date_fin, theme)
values (
  'disney', 'Zigzamland Paris ✨', false, null, null,
  jsonb_build_object(
    'numero', 2,
    'couleurs', jsonb_build_object(
      'fondSombre', '#0A0A2E', 'fondNuit', '#1A1A4E', 'fondProfond', '#0D0D3B',
      'accent', '#ffd76a', 'accentClair', '#fff3c4',
      'nuage', '#ffc2e2', 'etoile', '#ffe9a8'),
    'emoji', '🏰'
  )
)
on conflict (slug) do update
  set nom = excluded.nom,
      theme = excluded.theme;

-- ------------------------------------------------------------
--  Catalogue des skins exclusifs (source de vérité des stats d'achat).
--   Doit rester synchro avec les items marqués `saison: 'disney'`
--   dans src/lib/avatar.js.
--  Re-seed complet à chaque push.
-- ------------------------------------------------------------
delete from public.saison_skins where saison_slug = 'disney';
insert into public.saison_skins (saison_slug, category, item_id, label, prix) values
  -- 🎩 Chapeaux
  ('disney','hat','dnoeud','Nœud Papillon Picsou',8),
  ('disney','hat','driri','Casquette Riri',9),
  ('disney','hat','dminnie','Bandana Minnie',10),
  ('disney','hat','ddonald','Casque de Donald',10),
  ('disney','hat','dpicsou','Chapeau Picsou',11),
  ('disney','hat','dtigrou','Bonnet Tigrou',11),
  ('disney','hat','dclochette','Chignon Clochette',11),
  ('disney','hat','dears','Oreilles Mickey',12),
  ('disney','hat','dcendrillon','Couronne Cendrillon',12),
  ('disney','hat','dgenie','Turban Génie',12),
  ('disney','hat','dsorcier','Chapeau Sorcier',13),
  ('disney','hat','dstitch','Bob Stitch',13),
  ('disney','hat','dlionking','Couronne Roi Lion',14),
  -- 💇 Cheveux
  ('disney','hair','dmulan','Coupe Mulan',9),
  ('disney','hair','dbelle','Frange Belle',9),
  ('disney','hair','dvaiana','Cheveux Vaiana',10),
  ('disney','hair','dtiana','Chignon Tiana',10),
  ('disney','hair','delsa','Tresse Elsa',11),
  ('disney','hair','dariel','Cheveux Ariel',11),
  ('disney','hair','dmirabel','Afro Encanto',11),
  ('disney','hair','draiponce','Tresses Raiponce',12),
  ('disney','hair','dcruella','Perruque Cruella',12),
  -- 👄 Visages
  ('disney','face','ddalmatien','Taches Dalmatien',8),
  ('disney','face','dgepetto','Moustache Gepetto',8),
  ('disney','face','dblushminnie','Blush Minnie',8),
  ('disney','face','dbambi','Yeux Bambi',9),
  ('disney','face','dcruellamaq','Maquillage Cruella',9),
  ('disney','face','dcheshire','Sourire Cheshire',10),
  -- 🎨 Couleurs
  ('disney','color','drougedonald','Rouge Donald',10),
  ('disney','color','droseaurore','Rose Aurore',10),
  ('disney','color','dvertpeter','Vert Peter Pan',10),
  ('disney','color','drouxariel','Roux Ariel',11),
  ('disney','color','dbleugenie','Bleu Génie',12),
  ('disney','color','dmauveursula','Mauve Ursula',12),
  ('disney','color','ddalmatiencolor','Noir & Blanc Dalmatien',13),
  ('disney','color','dorpicsou','Or Picsou',14),
  ('disney','color','dfantasia','Bleu Nuit Fantasia',14),
  ('disney','color','darcenciel','Arc-en-ciel Magique',15),
  -- 🐾 Animaux
  ('disney','animal','dheimlich','Heimlich',12),
  ('disney','animal','dpascal','Pascal',12),
  ('disney','animal','dflounder','Flounder',12),
  ('disney','animal','dflik','Flik',12),
  ('disney','animal','dcochon','Petit Cochon',12),
  ('disney','animal','dbambipet','Bambi',13),
  ('disney','animal','dmeeko','Meeko',13),
  ('disney','animal','driripet','Riri',13),
  ('disney','animal','dkakamora','Kakamora',13),
  ('disney','animal','djiminy','Jiminy Cricket',13),
  ('disney','animal','dpluto','Pluto',14),
  ('disney','animal','dsimba','Simba Bébé',14),
  ('disney','animal','dtristesse','Tristesse',14),
  ('disney','animal','dstitchpet','Stitch',15),
  ('disney','animal','ddumbo','Dumbo',15),
  ('disney','animal','dtigroupet','Tigrou',15),
  ('disney','animal','dbaloo','Baloo',15),
  ('disney','animal','ddalmatiens','Trois Dalmatiens',15),
  ('disney','animal','dgeniemini','Génie Miniature',15),
  ('disney','animal','dclochettepet','Fée Clochette',15),
  -- ⚽ Sport
  ('disney','sport','dbalai','Balai Sorcier',12),
  ('disney','sport','dtrident','Trident Ariel',14),
  ('disney','sport','dexcalibur','Épée Excalibur',15),
  -- ✨ Skins complets (remplacent tout le bonhomme)
  ('disney','full','fclochette','Clochette Complète',23),
  ('disney','full','fdonald','Donald Complet',23),
  ('disney','full','fstitch','Stitch Complet',24),
  ('disney','full','fmickey','Mickey Complet',25),
  ('disney','full','fgenie','Génie Complet',25);

-- Les skins de saison rejoignent le catalogue payant général : ils deviennent
-- achetables via `buy_accessory` et peuvent tomber dans les boîtes mystères.
-- (`buy_accessory` est générique sur la catégorie — la nouvelle catégorie
--  `full` ne demande donc aucune modification SQL.)
insert into public.accessoires_catalogue (category, item_id, price)
select category, item_id, prix from public.saison_skins where saison_slug = 'disney'
on conflict (category, item_id) do update set price = excluded.price;
