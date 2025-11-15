create or replace function public.rpc_user_wallet_payment(
  p_wallet_address text,
  p_amount_fre numeric,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_balance numeric;
  v_fee constant numeric(18,2) := 1.00;
  v_address text;
  v_payload jsonb;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  v_address := nullif(trim(coalesce(p_wallet_address, '')), '');
  if v_address is null then
    raise exception 'wallet_address_required';
  end if;

  if p_amount_fre is null or p_amount_fre <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  select "balanceFre"
    into v_balance
  from "UserWalletBalance"
  where "authUserId" = v_user
  for update;

  if not found then
    raise exception 'wallet_not_initialized';
  end if;

  if coalesce(v_balance, 0) < p_amount_fre + v_fee then
    raise exception 'insufficient_funds';
  end if;

  v_payload :=
    coalesce(p_metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'note', p_note,
      'walletAddress', v_address
    );

  perform public.record_user_transaction(
    v_user,
    'wallet',
    v_address,
    -p_amount_fre,
    v_fee,
    v_payload
  );

  perform public.record_application_fee(
    v_fee,
    'wallet',
    v_address,
    jsonb_build_object('note', p_note)
  );
end;
$$;

create or replace function public.rpc_user_merchant_payment(
  p_reference text,
  p_amount_fre numeric,
  p_tag text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_balance numeric;
  v_fee constant numeric(18,2) := 1.00;
  v_reference text;
  v_payload jsonb;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  v_reference := nullif(trim(coalesce(p_reference, '')), '');
  if v_reference is null then
    raise exception 'reference_required';
  end if;

  if p_amount_fre is null or p_amount_fre <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  select "balanceFre"
    into v_balance
  from "UserWalletBalance"
  where "authUserId" = v_user
  for update;

  if not found then
    raise exception 'wallet_not_initialized';
  end if;

  if coalesce(v_balance, 0) < p_amount_fre + v_fee then
    raise exception 'insufficient_funds';
  end if;

  v_payload :=
    coalesce(p_metadata, '{}'::jsonb) ||
    jsonb_build_object(
      'merchantReference', v_reference,
      'tag', nullif(trim(coalesce(p_tag, '')), '')
    );

  perform public.record_user_transaction(
    v_user,
    'merchant',
    v_reference,
    -p_amount_fre,
    v_fee,
    v_payload
  );

  perform public.record_application_fee(
    v_fee,
    'merchant',
    v_reference,
    jsonb_build_object(
      'tag', nullif(trim(coalesce(p_tag, '')), '')
    )
  );
end;
$$;
