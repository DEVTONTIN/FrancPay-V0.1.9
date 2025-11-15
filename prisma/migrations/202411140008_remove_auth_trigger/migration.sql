drop trigger if exists trg_auth_user_created on auth.users;
drop function if exists public.handle_auth_user_created();

-- Optional: ensure existing profiles keep referral codes generated previously. Nothing else needed.
