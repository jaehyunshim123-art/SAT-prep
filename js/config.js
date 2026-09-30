// Supabase project settings for SatWizz cloud accounts.
// Copy both values from Supabase → Project Settings → API.
// The anon key is meant to be public; the row-level security policies in
// supabase/schema.sql are what keep each user's data private.
// Leave them empty to run SatWizz in guest-only mode (progress stays in localStorage).
window.SatWizz = window.SatWizz || {};
window.SatWizz.config = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};
