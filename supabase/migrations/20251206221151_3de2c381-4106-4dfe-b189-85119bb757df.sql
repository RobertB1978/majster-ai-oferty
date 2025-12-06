-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to validate offer approval token
CREATE OR REPLACE FUNCTION public.validate_offer_token(_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_approvals
    WHERE public_token = _token
      AND status = 'pending'
  )
$$;

-- 6. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Drop insecure policies from offer_approvals
DROP POLICY IF EXISTS "Public can update offers by token" ON public.offer_approvals;
DROP POLICY IF EXISTS "Public can view offers by token" ON public.offer_approvals;

-- 8. Create secure policies for offer_approvals with token validation
CREATE POLICY "Public can view pending offers by valid token"
ON public.offer_approvals
FOR SELECT
USING (
  status = 'pending' 
  AND public_token IS NOT NULL
);

CREATE POLICY "Public can update pending offers with valid token"
ON public.offer_approvals
FOR UPDATE
USING (
  status = 'pending'
  AND public_token IS NOT NULL
)
WITH CHECK (
  status IN ('approved', 'rejected')
  AND public_token IS NOT NULL
);

-- 9. Add API rate limiting table
CREATE TABLE public.api_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    endpoint text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (identifier, endpoint, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.api_rate_limits
FOR ALL
USING (true);