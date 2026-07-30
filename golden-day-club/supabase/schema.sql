-- Golden Day Club production schema for Supabase/Postgres.
-- Run in a new, dedicated Supabase project. Do not reuse another product's database.

create extension if not exists pgcrypto;

create type public.gdc_role as enum ('admin','lender','manager');
create type public.gdc_fee_type as enum ('flat','percent');
create type public.gdc_duration_unit as enum ('hours','days','weeks','months');
create type public.gdc_loan_status as enum ('active','paid','written_off','cancelled');
create type public.gdc_entry_type as enum ('capital_added','capital_withdrawn','expense','loan_disbursement','payment','adjustment','reversal');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'USD',
  default_interest_rate numeric(8,4) not null default 10 check (default_interest_rate >= 0),
  default_fee_type public.gdc_fee_type not null default 'flat',
  default_fee_value numeric(14,2) not null default 0 check (default_fee_value >= 0),
  default_duration_value integer not null default 1 check (default_duration_value > 0),
  default_duration_unit public.gdc_duration_unit not null default 'days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  role public.gdc_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_phone text,
  lending_paused boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,name)
);

create table public.manager_group_assignments (
  manager_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (manager_id,group_id)
);

create table public.borrowers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.groups(id),
  full_name text not null,
  phone text,
  member_number text,
  area text,
  reference_name text,
  reference_phone text,
  notes text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  borrower_id uuid not null references public.borrowers(id),
  principal numeric(14,2) not null check (principal > 0),
  interest_rate numeric(8,4) not null default 0 check (interest_rate >= 0),
  interest_amount numeric(14,2) not null default 0 check (interest_amount >= 0),
  fee_type public.gdc_fee_type not null default 'flat',
  fee_value numeric(14,4) not null default 0 check (fee_value >= 0),
  fee_amount numeric(14,2) not null default 0 check (fee_amount >= 0),
  duration_value integer not null check (duration_value > 0),
  duration_unit public.gdc_duration_unit not null,
  given_at timestamptz not null,
  due_at timestamptz not null,
  status public.gdc_loan_status not null default 'active',
  notes text,
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_at > given_at)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  paid_at timestamptz not null,
  payment_method text,
  reference_number text,
  notes text,
  recorded_by uuid not null references public.profiles(id),
  reversed_by uuid references public.profiles(id),
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz not null default now()
);

create table public.loan_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete restrict,
  adjustment_type text not null,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  reason text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.cashbook_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_type public.gdc_entry_type not null,
  amount numeric(14,2) not null check (amount > 0),
  occurred_at timestamptz not null,
  loan_id uuid references public.loans(id),
  payment_id uuid references public.payments(id),
  description text not null,
  reference_number text,
  recorded_by uuid not null references public.profiles(id),
  reversal_of uuid references public.cashbook_entries(id),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index groups_org_idx on public.groups(organization_id);
create index borrowers_org_group_idx on public.borrowers(organization_id,group_id);
create index loans_org_due_idx on public.loans(organization_id,due_at);
create index loans_borrower_idx on public.loans(borrower_id);
create index payments_loan_paid_idx on public.payments(loan_id,paid_at);
create index cashbook_org_time_idx on public.cashbook_entries(organization_id,occurred_at);
create index audit_org_time_idx on public.audit_events(organization_id,created_at desc);

create or replace function public.current_profile()
returns public.profiles
language sql stable security definer set search_path=public
as $$ select p from public.profiles p where p.id=auth.uid() and p.active limit 1 $$;

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path=public
as $$ select (public.current_profile()).organization_id $$;

create or replace function public.current_role()
returns public.gdc_role language sql stable security definer set search_path=public
as $$ select (public.current_profile()).role $$;

create or replace function public.can_access_group(target_group uuid)
returns boolean language sql stable security definer set search_path=public
as $$
  select case
    when public.current_role() in ('admin','lender') then true
    when public.current_role()='manager' then exists (
      select 1 from public.manager_group_assignments a
      where a.manager_id=auth.uid() and a.group_id=target_group
    )
    else false end
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.manager_group_assignments enable row level security;
alter table public.borrowers enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;
alter table public.loan_adjustments enable row level security;
alter table public.cashbook_entries enable row level security;
alter table public.audit_events enable row level security;

create policy org_read on public.organizations for select using (id=public.current_org_id());
create policy org_admin_update on public.organizations for update using (id=public.current_org_id() and public.current_role()='admin');

create policy profiles_read on public.profiles for select using (organization_id=public.current_org_id());
create policy profiles_admin_write on public.profiles for all using (organization_id=public.current_org_id() and public.current_role()='admin') with check (organization_id=public.current_org_id() and public.current_role()='admin');

create policy groups_read on public.groups for select using (organization_id=public.current_org_id() and public.can_access_group(id));
create policy groups_lender_write on public.groups for all using (organization_id=public.current_org_id() and public.current_role() in ('admin','lender')) with check (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));

create policy assignments_admin_read on public.manager_group_assignments for select using (public.current_role()='admin' or manager_id=auth.uid());
create policy assignments_admin_write on public.manager_group_assignments for all using (public.current_role()='admin') with check (public.current_role()='admin');

create policy borrowers_read on public.borrowers for select using (organization_id=public.current_org_id() and public.can_access_group(group_id));
create policy borrowers_lender_write on public.borrowers for all using (organization_id=public.current_org_id() and public.current_role() in ('admin','lender')) with check (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));

create policy loans_read on public.loans for select using (
  organization_id=public.current_org_id() and exists (
    select 1 from public.borrowers b where b.id=borrower_id and public.can_access_group(b.group_id)
  )
);
create policy loans_lender_insert on public.loans for insert with check (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));
create policy loans_lender_update on public.loans for update using (organization_id=public.current_org_id() and public.current_role() in ('admin','lender')) with check (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));

create policy payments_read on public.payments for select using (
  organization_id=public.current_org_id() and exists (
    select 1 from public.loans l join public.borrowers b on b.id=l.borrower_id
    where l.id=loan_id and public.can_access_group(b.group_id)
  )
);
create policy payments_collect on public.payments for insert with check (
  organization_id=public.current_org_id() and public.current_role() in ('admin','lender','manager') and exists (
    select 1 from public.loans l join public.borrowers b on b.id=l.borrower_id
    where l.id=loan_id and public.can_access_group(b.group_id)
  )
);
create policy payments_admin_reverse on public.payments for update using (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));

create policy adjustments_read on public.loan_adjustments for select using (organization_id=public.current_org_id());
create policy adjustments_lender_write on public.loan_adjustments for insert with check (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));

create policy cashbook_read on public.cashbook_entries for select using (
  organization_id=public.current_org_id() and (
    public.current_role() in ('admin','lender') or
    (entry_type='payment' and exists (
      select 1 from public.loans l join public.borrowers b on b.id=l.borrower_id
      where l.id=loan_id and public.can_access_group(b.group_id)
    ))
  )
);
create policy cashbook_lender_write on public.cashbook_entries for insert with check (organization_id=public.current_org_id() and public.current_role() in ('admin','lender'));

create policy audit_admin_read on public.audit_events for select using (organization_id=public.current_org_id() and public.current_role()='admin');
create policy audit_insert on public.audit_events for insert with check (organization_id=public.current_org_id() and actor_id=auth.uid());

-- Never delete financial rows from the application. Reverse payments and cashbook entries instead.
