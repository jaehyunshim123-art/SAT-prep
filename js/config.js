// Supabase project settings for SatWizz cloud accounts.
// Copy both values from Supabase → Project Settings → API.
// The anon key is meant to be public; the row-level security policies in
// supabase/schema.sql are what keep each user's data private.
// Leave them empty to run SatWizz in guest-only mode (progress stays in localStorage).
//
// vapidPublicKey turns on "Lock In" push notifications. Generate a key pair
// with `npx web-push generate-vapid-keys`, put the PUBLIC key here and both
// keys in the lock-in Edge Function's secrets (see README). Never put the
// private key in this file.
window.SatWizz = window.SatWizz || {};
window.SatWizz.config = {
  supabaseUrl: "https://vlmzjlxdxswzhguvthvi.supabase.co",
  // Supabase's publishable key (the newer name for the anon key): safe to ship in the page.
  supabaseAnonKey: "sb_publishable_vRxb7v-Qi5e0qyG19nXscQ_XdBWPD0q",
  vapidPublicKey: "",
};
