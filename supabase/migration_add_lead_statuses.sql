-- Migration to support 'not_responded' and 'rejected' statuses in Supabase
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'new', 'enriched', 'review', 'queued',
  'sent', 'delivered', 'read',
  'replied', 'won', 'lost', 'skipped',
  'not_responded', 'rejected'
));
