-- Donor Koi schema. Safe to run repeatedly.

create extension if not exists pgcrypto;

create table if not exists donors (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null,
  phone           text not null,
  password_hash   text not null,
  blood_group     text not null check (blood_group in ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  donation_type   text not null check (donation_type in ('blood','plasma')),
  last_donated    date,
  division        text not null,
  city            text not null,
  address_text    text not null,
  lat             double precision,
  lng             double precision,
  location_source text not null default 'none' check (location_source in ('gps','geocode','fallback','none')),
  available       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  varified        BOOLEAN NOT NULL DEFAULT false,
  otp             INTEGER,
  otp_expires_at  timestamptz
);

alter table donors add column if not exists varified boolean not null default false;
alter table donors add column if not exists otp integer;
alter table donors add column if not exists otp_expires_at timestamptz;
update donors set varified = true where varified = false and otp is null;

create unique index if not exists donors_email_key on donors (lower(email));
create index if not exists donors_match_idx on donors (blood_group, donation_type, city);
create index if not exists donors_coords_idx on donors (lat, lng) where lat is not null and lng is not null;

create table if not exists sessions (
  token_hash text primary key,
  donor_id   uuid not null references donors(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_donor_idx on sessions (donor_id);

create table if not exists blood_requests (
  id              uuid primary key default gen_random_uuid(),
  public_id       text not null unique,
  requester_name  text not null,
  requester_phone text not null,
  requester_email text,
  address_text    text not null,
  division        text not null,
  city            text not null,
  lat             double precision,
  lng             double precision,
  blood_group     text not null,
  need_type       text not null check (need_type in ('blood','plasma')),
  situation       text not null check (situation in ('immediate','later')),
  needed_at       timestamptz,
  status          text not null default 'searched',
  matched_count   integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists requests_created_idx on blood_requests (created_at desc);
create index if not exists requests_city_idx on blood_requests (city);
create index if not exists requests_expiry_idx on blood_requests (needed_at)
  where situation = 'later' and needed_at is not null;

create table if not exists request_notifications (
  id         bigserial primary key,
  request_id uuid not null references blood_requests(id) on delete cascade,
  donor_id   uuid not null references donors(id) on delete cascade,
  channel    text not null default 'email',
  status     text not null,
  detail     text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_donor_idx on request_notifications (donor_id, created_at desc);

create table if not exists email_outbox (
  id          bigserial primary key,
  to_email    text not null,
  subject     text not null,
  body        text not null,
  provider    text not null,
  provider_id text,
  status      text not null,
  error       text,
  created_at  timestamptz not null default now()
);

create table if not exists emergency_posts (
  id           uuid primary key default gen_random_uuid(),
  public_id    text not null unique,
  name         text not null,
  phone        text not null,
  blood_group  text not null check (blood_group in ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  need_type    text not null check (need_type in ('blood','plasma')),
  division     text not null,
  city         text not null,
  address_text text not null,
  needed_at    timestamptz,
  note         text,
  status       text not null default 'open' check (status in ('open','fulfilled')),
  close_token  text,
  created_at   timestamptz not null default now()
);

-- Existing deployments created before close tokens were added.
alter table emergency_posts add column if not exists close_token text;

create index if not exists emergency_created_idx on emergency_posts (created_at desc);
create index if not exists emergency_needed_idx on emergency_posts (needed_at)
  where needed_at is not null;
create unique index if not exists emergency_close_token_key on emergency_posts (close_token) where close_token is not null;

create table if not exists contact_feedback (
  id         bigserial primary key,
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_feedback_created_idx on contact_feedback (created_at desc);
