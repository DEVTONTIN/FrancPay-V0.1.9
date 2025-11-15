-- Helper functions to read JWT claims injected by Supabase Auth
create or replace function auth_company_id() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::jsonb->>'company_id','')::uuid;
  $$;

create or replace function auth_company_role() returns text
  language sql stable as $$
    select current_setting('request.jwt.claims', true)::jsonb->>'role';
  $$;

create or replace function auth_user_id() returns uuid
  language sql stable as $$
    select auth.uid();
  $$;

-- Enable and force RLS on all business tables
alter table "Company" enable row level security;
alter table "Company" force row level security;
alter table "CompanyUser" enable row level security;
alter table "CompanyUser" force row level security;
alter table "Wallet" enable row level security;
alter table "Wallet" force row level security;
alter table "Client" enable row level security;
alter table "Client" force row level security;
alter table "PaymentRequest" enable row level security;
alter table "PaymentRequest" force row level security;
alter table "PaymentSettlement" enable row level security;
alter table "PaymentSettlement" force row level security;
alter table "PaymentStatusEvent" enable row level security;
alter table "PaymentStatusEvent" force row level security;
alter table "WebhookSecret" enable row level security;
alter table "WebhookSecret" force row level security;
alter table "WalletConnection" enable row level security;
alter table "WalletConnection" force row level security;
alter table "WalletSession" enable row level security;
alter table "WalletSession" force row level security;
alter table "AuditLog" enable row level security;
alter table "AuditLog" force row level security;

-- Company policies
drop policy if exists "company_read" on "Company";
create policy "company_read" on "Company"
  for select using (id = auth_company_id());

drop policy if exists "company_manage" on "Company";
create policy "company_manage" on "Company"
  for update using (
    id = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
  );

-- CompanyUser policies
drop policy if exists "company_user_read" on "CompanyUser";
create policy "company_user_read" on "CompanyUser"
  for select using ("companyId" = auth_company_id());

drop policy if exists "company_user_manage" on "CompanyUser";
create policy "company_user_manage" on "CompanyUser"
  for all using (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
  ) with check (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
  );

-- Wallet policies
drop policy if exists "wallet_read" on "Wallet";
create policy "wallet_read" on "Wallet"
  for select using ("companyId" = auth_company_id());

drop policy if exists "wallet_manage" on "Wallet";
create policy "wallet_manage" on "Wallet"
  for all using (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER')
  ) with check (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER')
  );

-- Client policies
drop policy if exists "client_read" on "Client";
create policy "client_read" on "Client"
  for select using ("companyId" = auth_company_id());

drop policy if exists "client_manage" on "Client";
create policy "client_manage" on "Client"
  for all using (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER','OPERATOR')
  ) with check (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER','OPERATOR')
  );

-- PaymentRequest policies
drop policy if exists "payment_request_read" on "PaymentRequest";
create policy "payment_request_read" on "PaymentRequest"
  for select using ("companyId" = auth_company_id());

drop policy if exists "payment_request_manage" on "PaymentRequest";
create policy "payment_request_manage" on "PaymentRequest"
  for all using (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER','OPERATOR')
  ) with check (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER','OPERATOR')
  );

-- PaymentSettlement policies (read-only for company users; service role handles inserts/updates)
drop policy if exists "payment_settlement_read" on "PaymentSettlement";
create policy "payment_settlement_read" on "PaymentSettlement"
  for select using (
    exists (
      select 1 from "PaymentRequest" pr
      where pr.id = "PaymentSettlement"."paymentRequestId"
        and pr."companyId" = auth_company_id()
    )
  );

-- PaymentStatusEvent read policy
drop policy if exists "payment_status_event_read" on "PaymentStatusEvent";
create policy "payment_status_event_read" on "PaymentStatusEvent"
  for select using (
    exists (
      select 1 from "PaymentRequest" pr
      where pr.id = "PaymentStatusEvent"."paymentRequestId"
        and pr."companyId" = auth_company_id()
    )
  );

-- WebhookSecret policies (admins only)
drop policy if exists "webhook_read" on "WebhookSecret";
create policy "webhook_read" on "WebhookSecret"
  for select using ("companyId" = auth_company_id());

drop policy if exists "webhook_manage" on "WebhookSecret";
create policy "webhook_manage" on "WebhookSecret"
  for all using (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
  ) with check (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
  );

-- WalletConnection policies
drop policy if exists "wallet_connection_read" on "WalletConnection";
create policy "wallet_connection_read" on "WalletConnection"
  for select using ("companyId" = auth_company_id());

drop policy if exists "wallet_connection_manage" on "WalletConnection";
create policy "wallet_connection_manage" on "WalletConnection"
  for all using (
    "companyId" = auth_company_id()
    and (
      "userId" = auth_user_id()
      or auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
    )
  ) with check (
    "companyId" = auth_company_id()
    and (
      "userId" = auth_user_id()
      or auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
    )
  );

-- WalletSession policies
drop policy if exists "wallet_session_read" on "WalletSession";
create policy "wallet_session_read" on "WalletSession"
  for select using (
    exists (
      select 1 from "WalletConnection" wc
      where wc.id = "walletConnectionId"
        and wc."companyId" = auth_company_id()
    )
  );

drop policy if exists "wallet_session_manage" on "WalletSession";
create policy "wallet_session_manage" on "WalletSession"
  for all using (
    exists (
      select 1 from "WalletConnection" wc
      where wc.id = "walletConnectionId"
        and wc."companyId" = auth_company_id()
        and (
          wc."userId" = auth_user_id()
          or auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
        )
    )
  ) with check (
    exists (
      select 1 from "WalletConnection" wc
      where wc.id = "walletConnectionId"
        and wc."companyId" = auth_company_id()
        and (
          wc."userId" = auth_user_id()
          or auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN')
        )
    )
  );

-- AuditLog read-only for elevated roles
drop policy if exists "audit_log_read" on "AuditLog";
create policy "audit_log_read" on "AuditLog"
  for select using (
    "companyId" = auth_company_id()
    and auth_company_role() in ('SUPER_ADMIN','COMPANY_ADMIN','MANAGER')
  );

-- Staking products & positions (utilisateur space)
alter table "StakeProduct" enable row level security;
alter table "StakeProduct" force row level security;
drop policy if exists "stake_product_read" on "StakeProduct";
create policy "stake_product_read" on "StakeProduct"
  for select using (true);

alter table "UserStakePosition" enable row level security;
alter table "UserStakePosition" force row level security;
drop policy if exists "stake_position_read" on "UserStakePosition";
create policy "stake_position_read" on "UserStakePosition"
  for select using ("authUserId" = auth.uid());

alter table "UserStakeLedger" enable row level security;
alter table "UserStakeLedger" force row level security;
drop policy if exists "stake_ledger_read" on "UserStakeLedger";
create policy "stake_ledger_read" on "UserStakeLedger"
  for select using ("authUserId" = auth.uid());
