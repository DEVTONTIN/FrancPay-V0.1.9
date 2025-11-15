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

  perform public.record_user_transaction(
    v_sender,
    'transfer',
    coalesce(p_handle, 'FrancPay user'),
    -p_amount,
    0,
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
