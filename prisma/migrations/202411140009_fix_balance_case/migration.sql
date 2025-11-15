create or replace function public.handle_user_profile_insert()
returns trigger
language plpgsql
as $$
begin
  new."referralCode" := coalesce(new."referralCode", public.generate_referral_code());
  insert into "UserWalletBalance" ("authUserId", "balanceFre")
  values (
    new."authUserId",
    coalesce((select "balanceFre" from "UserWalletBalance" where "authUserId" = new."authUserId"), 0)
  )
  on conflict ("authUserId") do nothing;
  return new;
end;
$$;
