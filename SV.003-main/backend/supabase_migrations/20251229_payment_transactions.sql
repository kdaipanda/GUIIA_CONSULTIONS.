-- Migración: tabla payment_transactions para persistencia de transacciones de Stripe
-- Fecha: 2025-12-29
--
-- Ejecutar en Supabase SQL Editor (proyecto correspondiente).

-- Crear tabla payment_transactions
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  type text, -- 'membership' o 'consultation_credits'
  package text, -- 'basic', 'professional', 'premium', 'credits_10', etc.
  package_id text,
  billing_cycle text, -- 'monthly' o 'annual'
  credits integer,
  currency text default 'mxn',
  amount numeric(10, 2),
  status text, -- 'open', 'complete', 'expired'
  payment_status text, -- 'unpaid', 'paid'
  stripe boolean default false,
  veterinarian_id text,
  credits_applied boolean default false,
  credits_applied_at timestamptz,
  consultations_remaining_after integer,
  membership_activated boolean default false,
  membership_activated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Índices para búsquedas rápidas
create index if not exists idx_payment_transactions_session_id on public.payment_transactions(session_id);
create index if not exists idx_payment_transactions_veterinarian_id on public.payment_transactions(veterinarian_id);
create index if not exists idx_payment_transactions_created_at on public.payment_transactions(created_at desc);

-- Comentarios
comment on table public.payment_transactions is 'Transacciones de pago de Stripe (membresías y créditos de consultas)';
comment on column public.payment_transactions.session_id is 'ID de sesión de Stripe Checkout (cs_xxx)';
comment on column public.payment_transactions.type is 'Tipo de transacción: membership o consultation_credits';
comment on column public.payment_transactions.payment_status is 'Estado del pago: unpaid, paid';






