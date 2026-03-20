-- Atomic rate limit check-and-increment function
-- Fixes TOCTOU race condition in rate limiter (Security fix)
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests int,
  p_window_ms bigint
) RETURNS TABLE(allowed boolean, current_count int, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_count int;
  v_reset_at timestamptz;
BEGIN
  v_window_start := NOW() - (p_window_ms || ' milliseconds')::interval;

  -- Clean stale entries (older than window)
  DELETE FROM api_rate_limits
  WHERE window_start < v_window_start;

  -- Atomic increment-or-insert using advisory lock on identifier hash
  -- This ensures no race condition between check and increment
  INSERT INTO api_rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, NOW())
  ON CONFLICT (identifier, endpoint)
  DO UPDATE SET
    request_count = CASE
      WHEN api_rate_limits.window_start < v_window_start
      THEN 1  -- Reset window
      ELSE api_rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN api_rate_limits.window_start < v_window_start
      THEN NOW()
      ELSE api_rate_limits.window_start
    END
  RETURNING request_count, window_start INTO v_count, v_reset_at;

  v_reset_at := v_reset_at + (p_window_ms || ' milliseconds')::interval;

  RETURN QUERY SELECT
    (v_count <= p_max_requests) AS allowed,
    v_count AS current_count,
    v_reset_at AS reset_at;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit TO anon, authenticated, service_role;

COMMENT ON FUNCTION check_and_increment_rate_limit IS
'Atomically checks and increments rate limit counter. Prevents TOCTOU race condition.';
