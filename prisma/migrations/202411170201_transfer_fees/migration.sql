create or replace function public.rpc_transfer_between_users(
  p_handle text,
  p_amount numeric,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid;
  v_receiver uuid;
  v_normalized_handle text;
  v_sender_handle text;
  v_sender_balance numeric(18,2);
  v_fee constant numeric(18,2) := 1.00;
begin
  v_sender := auth.uid();
  if v_sender is null then
    raise exception 'unauthenticated';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  v_normalized_handle := lower(regexp_replace(coalesce(p_handle,''), '^@', ''));
  select "authUserId" into v_receiver from "UserProfile"
    where lower("username") = v_normalized_handle
    limit 1;

  if v_receiver is null then
    raise exception 'unknown_contact';
  end if;
  if v_receiver = v_sender then
    raise exception 'cannot transfer to yourself';
  end if;

  select coalesce("username",'FrancPay user') into v_sender_handle
    from "UserProfile" where "authUserId" = v_sender;

  select "balanceFre"
    into v_sender_balance
  from "UserWalletBalance"
  where "authUserId" = v_sender
  for update;

  if coalesce(v_sender_balance, 0) < p_amount + v_fee then
    raise exception 'insufficient_funds';
  end if;

  perform public.record_user_transaction(
    v_sender,
    'transfer',
    coalesce(p_handle, 'FrancPay user'),
    -p_amount,
    v_fee,
    jsonb_build_object('note', p_note)
  );

  perform public.record_user_transaction(
    v_receiver,
    'transfer',
    v_sender_handle,
    p_amount,
    0,
    jsonb_build_object('note', p_note, 'source', 'contact')
  );
end;
$$;

create or replace function public.rpc_user_stake_create(
  p_product_code text,
  p_amount_fre numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_product "StakeProduct"%rowtype;
  v_position_id uuid;
  v_locked_until timestamptz;
  v_balance numeric;
  v_existing numeric;
  v_fee constant numeric(18,2) := 1.00;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  if p_amount_fre is null or p_amount_fre <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  select *
    into v_product
  from "StakeProduct"
  where lower("code") = lower(p_product_code)
    and "isActive" = true
  limit 1;

  if not found then
    raise exception 'unknown_product';
  end if;

  if p_amount_fre < v_product."minAmountFre" then
    raise exception 'amount_below_minimum';
  end if;

  if v_product."maxAmountFre" is not null and p_amount_fre > v_product."maxAmountFre" then
    raise exception 'amount_above_maximum';
  end if;

  select sum("principalFre")
    into v_existing
  from "UserStakePosition"
  where "authUserId" = v_user
    and "productId" = v_product."id"
    and "status" = 'ACTIVE';

  if v_product."maxAmountFre" is not null and coalesce(v_existing,0) + p_amount_fre > v_product."maxAmountFre" then
    raise exception 'position_limit_reached';
  end if;

  if v_product."isLocked" then
    v_locked_until := now() + make_interval(days => v_product."lockPeriodDays");
  else
    v_locked_until := null;
  end if;

  select "balanceFre"
    into v_balance
  from "UserWalletBalance"
  where "authUserId" = v_user
  limit 1;

  if coalesce(v_balance, 0) < p_amount_fre + v_fee then
    raise exception 'insufficient_funds';
  end if;

  insert into "UserStakePosition" (
    "authUserId",
    "productId",
    "principalFre",
    "rewardAccruedFre",
    "status",
    "lockedUntil",
    "createdAt",
    "updatedAt",
    "lastRewardAt",
    "nextRewardAt",
    "productSnapshot"
  ) values (
    v_user,
    v_product."id",
    p_amount_fre,
    0,
    'ACTIVE',
    v_locked_until,
    now(),
    now(),
    null,
    public.next_daily_stake_payout(now()),
    jsonb_build_object(
      'code', v_product."code",
      'title', v_product."title",
      'apyPercent', v_product."apyPercent",
      'lockPeriodDays', v_product."lockPeriodDays",
      'minAmountFre', v_product."minAmountFre",
      'maxAmountFre', v_product."maxAmountFre"
    )
  )
  returning "id"
  into v_position_id;

  insert into "UserStakeLedger" ("positionId","authUserId","entryType","amountFre","context")
  values (
    v_position_id,
    v_user,
    'STAKE',
    p_amount_fre,
    jsonb_build_object('productCode', v_product."code")
  );

  perform public.record_user_transaction(
    v_user,
    'staking_lock',
    v_product."title",
    -p_amount_fre,
    v_fee,
    jsonb_build_object('positionId', v_position_id, 'productCode', v_product."code")
  );

  return v_position_id;
end;
$$;
