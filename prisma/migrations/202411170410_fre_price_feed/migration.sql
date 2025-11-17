create table if not exists "FrePriceSnapshot" (
  "id" uuid primary key default gen_random_uuid(),
  "source" text not null default 'gecko_terminal',
  "priceUsd" numeric(18,8) not null,
  "priceEur" numeric(18,8) not null,
  "priceTon" numeric(18,12) not null,
  "tonPriceUsd" numeric(18,8) not null,
  "usdToEurRate" numeric(18,8) not null,
  "rawPayload" jsonb,
  "fetchedAt" timestamptz not null default now()
);

create index if not exists "FrePriceSnapshot_fetchedAt_idx" on "FrePriceSnapshot" ("fetchedAt" desc);
