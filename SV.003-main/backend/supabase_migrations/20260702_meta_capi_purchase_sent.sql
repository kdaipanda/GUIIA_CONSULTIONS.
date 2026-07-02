-- Meta Conversions API: evita reenviar Purchase duplicado por sesión
alter table public.payment_transactions
  add column if not exists meta_capi_purchase_sent boolean default false;

comment on column public.payment_transactions.meta_capi_purchase_sent is
  'True cuando el evento Purchase ya se envió a Meta CAPI para esta sesión';
