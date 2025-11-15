create table if not exists "OnchainDeposit" (
  "id" uuid primary key default gen_random_uuid(),
  "txHash" text not null unique,
  "walletAddress" text not null,
  "memoTag" text,
  "authUserId" uuid references "UserProfile"("authUserId") on delete set null,
  "amountTon" numeric not null,
  "amountFre" numeric not null,
  "status" text not null default 'PENDING',
  "detectedAt" timestamptz not null default now(),
  "creditedAt" timestamptz,
  "updatedAt" timestamptz not null default now(),
  "metadata" jsonb not null default '{}'::jsonb
);

create index if not exists "OnchainDeposit_status_idx" on "OnchainDeposit" ("status");
create index if not exists "OnchainDeposit_memoTag_idx" on "OnchainDeposit" (lower("memoTag"));
create index if not exists "OnchainDeposit_authUser_idx" on "OnchainDeposit" ("authUserId");

create or replace function public.rpc_register_onchain_deposit(
  p_tx_hash text,
  p_wallet_address text,
  p_amount_ton numeric,
  p_amount_fre numeric,
  p_memo_tag text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit_id uuid;
  v_existing_status text;
  v_existing_user uuid;
  v_target_user uuid;
begin
  if coalesce(p_tx_hash, '') = '' then
    raise exception 'tx hash required';
  end if;
  if coalesce(p_wallet_address, '') = '' then
    raise exception 'wallet address required';
  end if;
  if p_amount_ton is null or p_amount_ton <= 0 then
    raise exception 'ton amount must be positive';
  end if;
  if p_amount_fre is null or p_amount_fre <= 0 then
    raise exception 'fre amount must be positive';
  end if;

  select "authUserId"
    into v_target_user
  from "UserProfile"
  where upper(coalesce("referralCode", '')) = upper(coalesce(p_memo_tag, ''))
  limit 1;

  if v_target_user is null and p_memo_tag ilike 'FRP-%' then
    select "authUserId"
      into v_target_user
    from "UserProfile"
    where replace(upper("authUserId"::text), '-', '') like upper(replace(p_memo_tag, 'FRP-', '') || '%')
    limit 1;
  end if;

  insert into "OnchainDeposit" ("txHash","walletAddress","memoTag","authUserId","amountTon","amountFre","metadata")
  values (p_tx_hash, p_wallet_address, p_memo_tag, v_target_user, p_amount_ton, p_amount_fre, coalesce(p_metadata,'{}'::jsonb))
  on conflict ("txHash") do update
    set "walletAddress" = excluded."walletAddress",
        "memoTag" = coalesce(excluded."memoTag","OnchainDeposit"."memoTag"),
        "amountTon" = excluded."amountTon",
        "amountFre" = excluded."amountFre",
        "metadata" = coalesce("OnchainDeposit"."metadata",'{}'::jsonb) || coalesce(excluded."metadata",'{}'::jsonb),
        "updatedAt" = now()
  returning "id","status","authUserId"
  into v_deposit_id, v_existing_status, v_existing_user;

  if v_target_user is not null and v_existing_user is distinct from v_target_user then
    update "OnchainDeposit"
      set "authUserId" = v_target_user,
          "updatedAt" = now()
      where "id" = v_deposit_id;
  else
    v_target_user := coalesce(v_existing_user, v_target_user);
  end if;

  if v_target_user is not null and v_existing_status <> 'CREDITED' then
    perform public.record_user_transaction(
      v_target_user,
      'deposit',
      coalesce(p_wallet_address, 'TON Wallet'),
      p_amount_fre,
      0,
      jsonb_build_object(
        'txHash', p_tx_hash,
        'wallet', p_wallet_address,
        'memo', p_memo_tag
      )
    );

    update "OnchainDeposit"
      set "status" = 'CREDITED',
          "creditedAt" = now(),
          "updatedAt" = now()
      where "id" = v_deposit_id;
  end if;

  return v_target_user;
end;
$$;
