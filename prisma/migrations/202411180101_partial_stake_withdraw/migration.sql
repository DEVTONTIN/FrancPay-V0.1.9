create or replace function public.rpc_user_stake_withdraw(
  p_position_id uuid,
  p_amount_fre numeric default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_position "UserStakePosition"%rowtype;
  v_product "StakeProduct"%rowtype;
  v_amount numeric(18,2);
  v_remaining numeric(18,2);
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  select *
    into v_position
  from "UserStakePosition"
  where "id" = p_position_id
    and "authUserId" = v_user
  for update;

  if not found then
    raise exception 'unknown_position';
  end if;

  if v_position."status" <> 'ACTIVE' then
    raise exception 'position_not_active';
  end if;

  select *
    into v_product
  from "StakeProduct"
  where "id" = v_position."productId";

  if not found then
    raise exception 'unknown_product';
  end if;

  if v_product."isLocked" and v_position."lockedUntil" > now() then
    raise exception 'position_locked_until %', v_position."lockedUntil";
  end if;

  v_amount := coalesce(p_amount_fre, v_position."principalFre");
  v_amount := round(v_amount, 2);

  if v_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  if v_amount > v_position."principalFre" then
    raise exception 'amount_exceeds_principal';
  end if;

  v_remaining := round(v_position."principalFre" - v_amount, 2);

  if v_remaining <= 0 then
    update "UserStakePosition"
      set "principalFre" = 0,
          "status" = 'REDEEMED',
          "redeemedAt" = now(),
          "nextRewardAt" = null,
          "updatedAt" = now()
      where "id" = v_position."id";
  else
    update "UserStakePosition"
      set "principalFre" = v_remaining,
          "updatedAt" = now()
      where "id" = v_position."id";
  end if;

  insert into "UserStakeLedger" ("positionId","authUserId","entryType","amountFre","context")
  values (
    v_position."id",
    v_user,
    'UNSTAKE',
    v_amount,
    jsonb_build_object(
      'productCode', v_product."code",
      'partial', (v_remaining > 0),
      'principalRemaining', greatest(v_remaining, 0)
    )
  );

  perform public.record_user_transaction(
    v_user,
    'staking_withdraw',
    v_product."title",
    v_amount,
    0,
    jsonb_build_object(
      'positionId', v_position."id",
      'productCode', v_product."code",
      'partial', (v_remaining > 0),
      'principalRemaining', greatest(v_remaining, 0),
      'transactionType', 'staking_withdraw'
    )
  );

  return v_position."id";
end;
$$;

create or replace function public.rpc_user_stake_redeem(
  p_position_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.rpc_user_stake_withdraw(p_position_id, null);
end;
$$;
