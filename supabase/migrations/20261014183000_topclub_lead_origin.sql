-- Extend the existing website intake to TOP Club; preserve data, roles and RLS.
BEGIN;
ALTER TABLE public.lead_intake_requests DROP CONSTRAINT lead_intake_requests_origin_check;
ALTER TABLE public.lead_intake_requests ADD CONSTRAINT lead_intake_requests_origin_check
  CHECK (origin IN ('uneed.pt','360.uneed.pt','presenca.uneed.pt','topclub.uneed.pt'));
COMMIT;
