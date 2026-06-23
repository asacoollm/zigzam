import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Zigzam utilise une auth « maison » (RPC public.login), JAMAIS Supabase Auth.
// On désactive donc toute la machinerie GoTrue de session : sans ça, le client
// lit/écrit un token de session dans le localStorage à chaque chargement, ce qui
// peut faire échouer la toute 1re requête sur certains appareils (navigation
// privée iOS/Safari, stockage restreint, token corrompu) → « Oups, une erreur… ».
// Aucune session à persister = la connexion normale marche partout, localStorage
// vide ou non.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})