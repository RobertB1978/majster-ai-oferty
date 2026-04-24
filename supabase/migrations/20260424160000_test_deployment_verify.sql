-- ============================================
-- TEST DEPLOYMENT VERIFICATION
-- Testowa tabela do weryfikacji czy migracje wchodzą na produkcję
-- ============================================

CREATE TABLE public.deployment_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  environment TEXT DEFAULT 'production'
);

-- Dodaj RLS
ALTER TABLE public.deployment_test ENABLE ROW LEVEL SECURITY;

-- Ubezpiecz dostęp
CREATE POLICY "Allow read for all authenticated" ON public.deployment_test
  FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.deployment_test (test_name, environment)
VALUES ('test_run_' || TO_CHAR(NOW(), 'YYYY-MM-DD_HH24-MI-SS'), 'production');

COMMENT ON TABLE public.deployment_test IS 'TEMPORARY: Test table for deployment verification. Safe to delete after testing.';
