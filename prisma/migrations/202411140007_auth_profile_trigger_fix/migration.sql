create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_profile_type text;
  v_referred_code text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email,''), '@', 1), 'francpay_user');
  v_username := lower(regexp_replace(v_username, '[^a-z0-9_]+', '_', 'g'));
  if v_username = '' then
    v_username := 'francpay_user';
  end if;
  while exists (select 1 from "UserProfile" where "username" = v_username) loop
    v_username := substr(v_username, 1, greatest(1, 20)) || '_' || substr(md5(gen_random_uuid()::text), 1, 4);
  end loop;

  v_profile_type := case
    when lower(coalesce(new.raw_user_meta_data->>'profile_type', 'utilisateur')) = 'professional' then 'PROFESSIONAL'
    else 'UTILISATEUR'
  end;

  v_referred_code := new.raw_user_meta_data->>'referral_code';

  insert into "UserProfile" ("authUserId","username","email","profileType","referralCode","referredByCode")
  values (new.id, v_username, new.email, v_profile_type, null, nullif(v_referred_code,''))
  on conflict ("authUserId") do nothing;

  return new;
end;
$$;
