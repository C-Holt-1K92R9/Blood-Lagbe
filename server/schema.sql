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
  locked_until    timestamptz,
  recovery_until  timestamptz,
  show_on_honor_wall boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  varified        BOOLEAN NOT NULL DEFAULT false,
  otp             INTEGER,
  otp_expires_at  timestamptz
);

alter table donors add column if not exists varified boolean not null default false;
alter table donors add column if not exists otp integer;
alter table donors add column if not exists otp_expires_at timestamptz;
alter table donors add column if not exists locked_until timestamptz;
alter table donors add column if not exists recovery_until timestamptz;
alter table donors add column if not exists show_on_honor_wall boolean not null default false;
update donors set varified = true where varified = false and otp is null;

create unique index if not exists donors_email_key on donors (lower(email));
create index if not exists donors_match_idx on donors (blood_group, donation_type, city);
create index if not exists donors_coords_idx on donors (lat, lng) where lat is not null and lng is not null;
create index if not exists donors_hold_idx on donors (locked_until) where locked_until is not null;
create index if not exists donors_recovery_idx on donors (recovery_until) where recovery_until is not null;

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
  manage_token_hash text,
  manage_token_expires_at timestamptz,
  created_at      timestamptz not null default now()
);

alter table blood_requests add column if not exists manage_token_hash text;
alter table blood_requests add column if not exists manage_token_expires_at timestamptz;

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
alter table request_notifications add column if not exists action_token_hash text;
alter table request_notifications add column if not exists action_token_expires_at timestamptz;
alter table request_notifications add column if not exists action_status text;
alter table request_notifications add column if not exists accepted_at timestamptz;
create index if not exists notifications_action_token_idx
  on request_notifications (action_token_hash)
  where action_token_hash is not null;

create table if not exists email_outbox (
  id            bigserial primary key,
  to_email      text not null,
  subject       text not null,
  body          text not null,
  provider      text not null,
  provider_id   text,
  status        text not null default 'PENDING',
  error         text,
  recipient_email text,
  body_html     text,
  priority      integer not null default 0,
  retry_count   integer not null default 0,
  scheduled_at  timestamptz not null default now(),
  attachments_json jsonb not null default '[]'::jsonb,
  error_log     text,
  processing_started_at timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);

alter table email_outbox add column if not exists recipient_email text;
alter table email_outbox add column if not exists body_html text;
alter table email_outbox add column if not exists priority integer not null default 0;
alter table email_outbox add column if not exists retry_count integer not null default 0;
alter table email_outbox add column if not exists scheduled_at timestamptz;
alter table email_outbox add column if not exists attachments_json jsonb not null default '[]'::jsonb;
alter table email_outbox add column if not exists error_log text;
alter table email_outbox add column if not exists processing_started_at timestamptz;
alter table email_outbox add column if not exists sent_at timestamptz;
alter table email_outbox alter column status set default 'PENDING';
update email_outbox
   set recipient_email = to_email
 where recipient_email is null
   and to_email not like '%,%';
update email_outbox
   set scheduled_at = created_at
 where scheduled_at is null;
alter table email_outbox alter column scheduled_at set default now();
alter table email_outbox alter column scheduled_at set not null;
update email_outbox
   set error_log = error
 where error_log is null and error is not null;
create index if not exists email_outbox_pending_idx
  on email_outbox (priority desc, scheduled_at, created_at)
  where status = 'PENDING';
create index if not exists email_outbox_processing_idx
  on email_outbox (processing_started_at)
  where status = 'PROCESSING';

create table if not exists email_credential_state (
  credential_key text primary key,
  priority       integer not null,
  daily_limit    integer not null default 450,
  sent_count     integer not null default 0,
  window_started_at timestamptz,
  next_send_at   timestamptz not null default now(),
  cooldown_until timestamptz,
  lease_until    timestamptz,
  last_error     text,
  updated_at     timestamptz not null default now()
);

alter table donors add column if not exists locked_by_request_id uuid
  references blood_requests(id) on delete set null;

create table if not exists request_donor_holds (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references blood_requests(id) on delete cascade,
  donor_id       uuid not null references donors(id) on delete cascade,
  role           text not null check (role in ('primary','backup')),
  status         text not null default 'held'
                   check (status in ('held','released','completed','expired')),
  accepted_at    timestamptz,
  hold_expires_at timestamptz not null,
  released_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (request_id, donor_id)
);

create unique index if not exists request_donor_holds_active_donor_key
  on request_donor_holds (donor_id)
  where status = 'held';
create index if not exists request_donor_holds_request_idx
  on request_donor_holds (request_id, status, created_at);
create index if not exists request_donor_holds_expiry_idx
  on request_donor_holds (hold_expires_at)
  where status = 'held';

create table if not exists donation_events (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid references blood_requests(id) on delete set null,
  donor_id     uuid not null references donors(id) on delete cascade,
  status       text not null default 'confirmed'
                 check (status in ('confirmed','disputed')),
  donated_at   timestamptz not null default now(),
  confirmed_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (request_id, donor_id)
);

create index if not exists donation_events_donor_idx
  on donation_events (donor_id, donated_at desc);
create index if not exists donation_events_recent_idx
  on donation_events (donated_at)
  where status = 'confirmed';

create table if not exists certificates (
  id                uuid primary key default gen_random_uuid(),
  donation_event_id uuid not null unique references donation_events(id) on delete cascade,
  donor_id          uuid not null references donors(id) on delete cascade,
  certificate_number text not null unique,
  status            text not null default 'pending'
                      check (status in ('pending','ready','failed')),
  content_type      text,
  file_name         text,
  artifact_data     bytea,
  error_log         text,
  issued_at         timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists certificates_donor_idx
  on certificates (donor_id, created_at desc);
create index if not exists certificates_pending_idx
  on certificates (created_at)
  where status = 'pending';

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
  id           bigserial primary key,
  name         text not null,
  email        text not null,
  feedback_type text not null default 'other'
    check (feedback_type in ('complaint','suggestion','other')),
  message      text not null,
  created_at   timestamptz not null default now()
);

alter table contact_feedback add column if not exists feedback_type text not null default 'other'
  check (feedback_type in ('complaint','suggestion','other'));

create index if not exists contact_feedback_created_idx on contact_feedback (created_at desc);
