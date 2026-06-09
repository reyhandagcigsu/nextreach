-- NextReach — database schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New query).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- Table: leads
-- One row per lead captured by the rule-based chatbot on the landing page.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  company      text,
  company_size text,
  interest     text,
  urgency      text,            -- how soon they need it (sales prioritization)
  message      text,            -- free-text: what they actually want to ask
  status       text not null default 'new', -- sales pipeline: new/contacted/in_progress/closed/junk
  owner        text,            -- who on the team claimed this lead
  transcript   jsonb,           -- full conversation log for audit / context
  source       text not null default 'chatbot'
);

-- If the table already exists from an earlier version, add the new columns.
alter table public.leads add column if not exists urgency text;
alter table public.leads add column if not exists message text;
alter table public.leads add column if not exists status text not null default 'new';
alter table public.leads add column if not exists owner text;

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Auth is out of scope, so we keep the security model deliberately simple:
--   * The public landing page (anon role) may INSERT new leads.
--   * Nobody can SELECT/UPDATE/DELETE through the anon key.
--
-- The /admin view is gated by an env password on the client only — it does
-- NOT read through a privileged role here. For a real deployment you would
-- add Supabase Auth and a SELECT policy scoped to authenticated admins.
-- During the case, /admin reads via the anon key; to allow that, uncomment
-- the "anon can read" policy below (acceptable for a demo, NOT production).
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

-- Allow the chatbot (anonymous visitors) to submit leads — but validate the
-- payload at the DB level. This is the only anti-spam layer that survives a
-- bot hitting the REST endpoint directly with the public anon key (which
-- bypasses every client-side guard: honeypot, validation, required fields).
drop policy if exists "anon can insert leads" on public.leads;
create policy "anon can insert leads"
  on public.leads
  for insert
  to anon
  with check (
    char_length(name) between 1 and 120
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and char_length(email) <= 200
    and (company is null or char_length(company) <= 200)
    and (message is null or char_length(message) <= 2000)
    and (company_size is null or company_size in ('1-10', '11-50', '51-200', '200+'))
    and (interest is null or interest in ('sales', 'marketing', 'support', 'other'))
    and (urgency is null or urgency in ('high', 'medium', 'low'))
    and (
      transcript is null
      or (jsonb_typeof(transcript) = 'array' and jsonb_array_length(transcript) <= 100)
    )
  );

-- DEMO ONLY: let the anon key read leads so the /admin table works without
-- Supabase Auth. Remove this in production and replace with an authenticated
-- policy. Comment this out if you wire up real auth.
drop policy if exists "anon can read leads (demo)" on public.leads;
create policy "anon can read leads (demo)"
  on public.leads
  for select
  to anon
  using (true);

-- DEMO ONLY: let the anon key update leads so the /admin status & owner controls
-- work without Supabase Auth. Same caveat as above — remove and scope to
-- authenticated admins in production.
drop policy if exists "anon can update leads (demo)" on public.leads;
create policy "anon can update leads (demo)"
  on public.leads
  for update
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Rate limit / dedup (runs in the DB, so it also catches direct REST inserts).
-- Rejects a second submission from the same email within 1 minute — stops a
-- flood loop without hurting a real visitor who submits once. (A bot rotating
-- emails still gets through; the full answer is an Edge Function + captcha —
-- see README.) SECURITY DEFINER so it can read the table even when RLS would
-- otherwise hide rows from the anon role.
-- ---------------------------------------------------------------------------
create or replace function public.leads_rate_limit()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if exists (
    select 1 from public.leads
    where email = new.email
      and created_at > now() - interval '1 minute'
  ) then
    raise exception 'Çok sık gönderim. Lütfen biraz sonra tekrar deneyin.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_rate_limit_trg on public.leads;
create trigger leads_rate_limit_trg
  before insert on public.leads
  for each row execute function public.leads_rate_limit();
