/*
  # Disable Email Confirmation for Testing

  This migration disables email confirmation requirement to allow
  seamless user registration and authentication for testing purposes.
  
  Note: This is a configuration change at the application level,
  not a database schema change.
*/

-- This is informational - Email confirmation is managed through Supabase Auth settings
-- The settings must be configured in the Supabase Dashboard under Authentication > Providers > Email
-- Settings needed:
-- - Disable "Confirm email" option
-- - Enable "Enable email confirmations"  to OFF
-- This allows users to sign up and sign in immediately without email verification