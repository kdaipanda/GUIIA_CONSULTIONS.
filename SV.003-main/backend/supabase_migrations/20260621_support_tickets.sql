-- Tickets de soporte GUIAA (dudas, quejas, escalaciones del chat)
-- Ejecutar en Supabase SQL Editor

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text not null,
  user_name text,
  subject text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal'
    check (priority in ('normal', 'high')),
  context_view text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_support_tickets_user
  on public.support_tickets (user_id, created_at desc);

create index if not exists idx_support_tickets_status
  on public.support_tickets (status, created_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_role text not null check (author_role in ('user', 'assistant', 'admin')),
  author_profile_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket
  on public.support_messages (ticket_id, created_at asc);
