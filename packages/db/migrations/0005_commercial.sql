-- Phase 2: billing, custom domains, analytics, commissions settings,
-- consents, support and administration. Additive only; no existing column
-- changes meaning, so Phase 1 data keeps working.

ALTER TABLE sites ADD COLUMN settings jsonb NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN restricted_at timestamptz;
ALTER TABLE users ADD COLUMN restriction_reason text;

-- Provider customer per account. Tax IDs are sent to the provider, not stored.
CREATE TABLE billing_customers (
 user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
 provider text NOT NULL,
 provider_customer_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (provider, provider_customer_id)
);

-- One row per purchase. Plan, cycle and price are snapshotted so later price
-- changes never rewrite history. Status transitions: see docs/BILLING.md.
CREATE TABLE subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid REFERENCES users ON DELETE SET NULL,
 provider text NOT NULL,
 provider_subscription_id text,
 plan text NOT NULL CHECK (plan IN ('artist','studio')),
 cycle text NOT NULL CHECK (cycle IN ('monthly','yearly')),
 method text NOT NULL CHECK (method IN ('card','pix')),
 amount integer NOT NULL CHECK (amount > 0),
 currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','past_due','canceling','canceled','expired')),
 period_end timestamptz,
 grace_until timestamptz,
 cancel_requested_at timestamptz,
 provider_ended boolean NOT NULL DEFAULT false,
 starts_at date NOT NULL DEFAULT current_date,
 replaces uuid REFERENCES subscriptions ON DELETE SET NULL,
 synced_at timestamptz,
 sync_error text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (provider, provider_subscription_id)
);
CREATE INDEX subscriptions_user ON subscriptions(user_id, created_at DESC);
CREATE INDEX subscriptions_open ON subscriptions(status) WHERE status IN ('pending','active','past_due','canceling');

CREATE TABLE payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 subscription_id uuid NOT NULL REFERENCES subscriptions ON DELETE CASCADE,
 provider_payment_id text NOT NULL,
 status text NOT NULL CHECK (status IN ('pending','overdue','confirmed','refunded','failed','deleted')),
 amount integer NOT NULL,
 currency text NOT NULL,
 due_date date NOT NULL,
 paid_at timestamptz,
 period_end timestamptz,
 invoice_url text,
 method text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (subscription_id, provider_payment_id)
);

-- Durable, idempotent provider event log. Payloads are evidence only; state
-- is always re-read from the provider before it is applied.
CREATE TABLE provider_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 provider text NOT NULL,
 event_id text NOT NULL,
 type text NOT NULL,
 object_id text,
 payload jsonb NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz,
 attempts integer NOT NULL DEFAULT 0,
 last_error text,
 UNIQUE (provider, event_id)
);
CREATE INDEX provider_events_pending ON provider_events(received_at) WHERE processed_at IS NULL;

-- Custom domains. A hostname belongs to at most one site, and only verified
-- domains ever route traffic.
CREATE TABLE domains (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,
 hostname text NOT NULL UNIQUE CHECK (hostname = lower(hostname)),
 token text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
 is_primary boolean NOT NULL DEFAULT false,
 dns_ok boolean NOT NULL DEFAULT false,
 tls_ok boolean NOT NULL DEFAULT false,
 last_error text,
 checked_at timestamptz,
 verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX domains_site ON domains(site_id);
CREATE UNIQUE INDEX domains_one_primary ON domains(site_id) WHERE is_primary;

-- Aggregated, cookie-free analytics. No IP addresses or visitor identifiers.
CREATE TABLE analytics_daily (
 site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,
 day date NOT NULL,
 kind text NOT NULL CHECK (kind IN ('view','click')),
 path text NOT NULL,
 referrer text NOT NULL DEFAULT '',
 country text NOT NULL DEFAULT '',
 count integer NOT NULL DEFAULT 0,
 PRIMARY KEY (site_id, day, kind, path, referrer, country)
);
CREATE INDEX analytics_age ON analytics_daily(day);

CREATE TABLE consents (
 user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 document text NOT NULL,
 version text NOT NULL,
 accepted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, document, version)
);

CREATE TABLE admins (user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE admin_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 admin_id uuid REFERENCES users ON DELETE SET NULL,
 action text NOT NULL,
 target text,
 detail jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_time ON admin_audit(created_at DESC);

CREATE TABLE support_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid REFERENCES users ON DELETE SET NULL,
 email text NOT NULL,
 topic text NOT NULL CHECK (topic IN ('billing','domain','account','bug','copyright','other')),
 message text NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_open ON support_requests(created_at) WHERE status = 'open';
CREATE INDEX events_user ON events(user_id, created_at DESC);
