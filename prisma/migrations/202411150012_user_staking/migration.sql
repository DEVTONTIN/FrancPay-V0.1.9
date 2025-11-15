create type "StakePositionStatus" as enum ('ACTIVE', 'REDEEMED', 'CANCELLED');
create type "StakeLedgerType" as enum ('STAKE', 'UNSTAKE', 'REWARD');

create table "StakeProduct" (
  "id" uuid primary key default gen_random_uuid(),
  "code" text not null unique,
  "title" text not null,
  "description" text,
  "apyPercent" numeric(6,3) not null,
  "lockPeriodDays" integer not null default 0,
  "minAmountFre" numeric(18,2) not null default 0,
  "maxAmountFre" numeric(18,2),
  "isLocked" boolean not null default false,
  "isActive" boolean not null default true,
  "metadata" jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

insert into "StakeProduct" ("code","title","description","apyPercent","lockPeriodDays","minAmountFre","maxAmountFre","isLocked","metadata")
values
  (
    'COMMUNITY_LOCK',
    'Staking communautaire',
    'Rendement 10% APY, fonds immobilises 12 mois',
    10.0,
    365,
    10000,
    1000000,
    true,
    jsonb_build_object('payoutHour',8,'label','Communautaire 1 an')
  ),
  (
    'CLASSIC_FLEX',
    'Staking classic',
    'Rendement 5% APY, retraits libres',
    5.0,
    0,
    0,
    null,
    false,
    jsonb_build_object('payoutHour',8,'label','Classic 5%')
  )
on conflict ("code") do update
  set "title" = excluded."title",
      "description" = excluded."description",
      "apyPercent" = excluded."apyPercent",
      "lockPeriodDays" = excluded."lockPeriodDays",
      "minAmountFre" = excluded."minAmountFre",
      "maxAmountFre" = excluded."maxAmountFre",
      "isLocked" = excluded."isLocked",
      "isActive" = true,
      "metadata" = coalesce("StakeProduct"."metadata",'{}'::jsonb) || excluded."metadata",
      "updatedAt" = now();

create table "UserStakePosition" (
  "id" uuid primary key default gen_random_uuid(),
  "authUserId" uuid not null references "UserProfile"("authUserId") on delete cascade,
  "productId" uuid not null references "StakeProduct"("id") on delete restrict,
  "principalFre" numeric(18,2) not null,
  "rewardAccruedFre" numeric(18,2) not null default 0,
  "status" "StakePositionStatus" not null default 'ACTIVE',
  "lockedUntil" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "lastRewardAt" timestamptz,
  "nextRewardAt" timestamptz,
  "redeemedAt" timestamptz,
  "productSnapshot" jsonb not null default '{}'::jsonb
);

create index "UserStakePosition_authUser_idx" on "UserStakePosition" ("authUserId");
create index "UserStakePosition_product_idx" on "UserStakePosition" ("productId");
create index "UserStakePosition_status_idx" on "UserStakePosition" ("status");

create table "UserStakeLedger" (
  "id" uuid primary key default gen_random_uuid(),
  "positionId" uuid not null references "UserStakePosition"("id") on delete cascade,
  "authUserId" uuid not null,
  "entryType" "StakeLedgerType" not null,
  "amountFre" numeric(18,2) not null,
  "note" text,
  "context" jsonb,
  "createdAt" timestamptz not null default now(),
  constraint "UserStakeLedger_auth_fk" foreign key ("authUserId") references "UserProfile"("authUserId") on delete cascade
);

create index "UserStakeLedger_position_idx" on "UserStakeLedger" ("positionId");
create index "UserStakeLedger_auth_idx" on "UserStakeLedger" ("authUserId");

create or replace function public.next_daily_stake_payout(p_from timestamptz default now())
returns timestamptz
language sql
immutable
as $$
  select case
    when date_trunc('day', p_from) + interval '8 hours' > p_from
      then date_trunc('day', p_from) + interval '8 hours'
    else date_trunc('day', p_from) + interval '32 hours'
  end
$$;

create or replace function public.process_stake_position_rewards(
  p_position_id uuid,
  p_run_at timestamptz default now()
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_position "UserStakePosition"%rowtype;
  v_product "StakeProduct"%rowtype;
  v_next timestamptz;
  v_credit numeric(18,2);
  v_counter integer := 0;
begin
  if p_position_id is null then
    return 0;
  end if;

  select *
    into v_position
  from "UserStakePosition"
  where "id" = p_position_id
    and "status" = 'ACTIVE'
  for update skip locked;

  if not found then
    return 0;
  end if;

  select *
    into v_product
  from "StakeProduct"
  where "id" = v_position."productId";

  if not found then
    return 0;
  end if;

  v_next := coalesce(v_position."nextRewardAt", public.next_daily_stake_payout(v_position."createdAt"));

  while v_next <= coalesce(p_run_at, now()) loop
    v_credit := round((v_position."principalFre" * v_product."apyPercent" / 100) / 365::numeric, 2);
    exit when v_credit <= 0;

    update "UserStakePosition"
      set "rewardAccruedFre" = coalesce("rewardAccruedFre", 0) + v_credit,
          "lastRewardAt" = v_next,
          "nextRewardAt" = v_next + interval '1 day',
          "updatedAt" = now()
      where "id" = v_position."id";

    insert into "UserStakeLedger" ("positionId","authUserId","entryType","amountFre","context")
    values (
      v_position."id",
      v_position."authUserId",
      'REWARD',
      v_credit,
      jsonb_build_object(
        'productCode', v_product."code",
        'payoutAt', v_next
      )
    );

    perform public.record_user_transaction(
      v_position."authUserId",
      'staking_reward',
      v_product."title",
      v_credit,
      0,
      jsonb_build_object(
        'positionId', v_position."id",
        'productCode', v_product."code",
        'payoutAt', v_next
      )
    );

    v_next := v_next + interval '1 day';
    v_counter := v_counter + 1;
  end loop;

  return v_counter;
end;
$$;

create or replace function public.process_daily_stake_rewards(p_run_at timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_position_id uuid;
begin
  for v_position_id in
    select "id"
    from "UserStakePosition"
    where "status" = 'ACTIVE'
      and coalesce("nextRewardAt", public.next_daily_stake_payout("createdAt")) <= coalesce(p_run_at, now())
  loop
    v_total := v_total + public.process_stake_position_rewards(v_position_id, p_run_at);
  end loop;

  return v_total;
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
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated';
  end if;
  if p_product_code is null or trim(p_product_code) = '' then
    raise exception 'product_required';
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

  if p_amount_fre is null or p_amount_fre <= 0 then
    raise exception 'amount_required';
  end if;
  if p_amount_fre < coalesce(v_product."minAmountFre", 0) then
    raise exception 'amount_below_minimum';
  end if;

  if v_product."maxAmountFre" is not null then
    select coalesce(sum("principalFre"), 0)
      into v_existing
    from "UserStakePosition"
    where "authUserId" = v_user
      and "productId" = v_product."id"
      and "status" = 'ACTIVE';

    if v_existing + p_amount_fre > v_product."maxAmountFre" then
      raise exception 'amount_exceeds_max';
    end if;
  end if;

  select "balanceFre"
    into v_balance
  from "UserWalletBalance"
  where "authUserId" = v_user
  limit 1;

  if coalesce(v_balance, 0) < p_amount_fre then
    raise exception 'insufficient_funds';
  end if;

  v_locked_until := case
    when v_product."lockPeriodDays" > 0 then now() + (v_product."lockPeriodDays" || ' days')::interval
    else null
  end;

  insert into "UserStakePosition" (
    "authUserId",
    "productId",
    "principalFre",
    "lockedUntil",
    "nextRewardAt",
    "productSnapshot"
  )
  values (
    v_user,
    v_product."id",
    p_amount_fre,
    v_locked_until,
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
    0,
    jsonb_build_object('positionId', v_position_id, 'productCode', v_product."code")
  );

  return v_position_id;
end;
$$;

create or replace function public.rpc_user_stake_redeem(
  p_position_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_position "UserStakePosition"%rowtype;
  v_product "StakeProduct"%rowtype;
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

  perform public.process_stake_position_rewards(v_position."id", now());

  update "UserStakePosition"
    set "status" = 'REDEEMED',
        "redeemedAt" = now(),
        "nextRewardAt" = null,
        "updatedAt" = now()
    where "id" = v_position."id";

  insert into "UserStakeLedger" ("positionId","authUserId","entryType","amountFre","context")
  values (
    v_position."id",
    v_user,
    'UNSTAKE',
    v_position."principalFre",
    jsonb_build_object('productCode', v_product."code")
  );

  perform public.record_user_transaction(
    v_user,
    'staking_unlock',
    v_product."title",
    v_position."principalFre",
    0,
    jsonb_build_object('positionId', v_position."id", 'productCode', v_product."code")
  );

  return v_position."id";
end;
$$;

do $block$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
  end if;
end
$block$;

do $block$
declare
  v_job_id int;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for v_job_id in select jobid from cron.job where jobname = 'stake_rewards_daily' loop
      perform cron.unschedule(v_job_id);
    end loop;
    perform cron.schedule(
      'stake_rewards_daily',
      '0 8 * * *',
      $$select public.process_daily_stake_rewards(now());$$
    );
  end if;
end
$block$;
