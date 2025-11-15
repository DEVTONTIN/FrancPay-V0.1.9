create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_profile_type text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'francpay_user');
  v_profile_type := case when coalesce(new.raw_user_meta_data->>'profile_type','UTILISATEUR') = 'professional'
    then 'PROFESSIONAL'
    else 'UTILISATEUR'
  end;

  insert into "UserProfile" ("authUserId","username","email","profileType","referralCode","referredByCode")
  values (new.id, v_username, new.email, v_profile_type, null, null)
  on conflict ("authUserId") do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();
