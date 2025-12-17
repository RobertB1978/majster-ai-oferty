/**
 * PostHog Feature Flags & Analytics Context
 * TIER 1.3 - Feature flags for controlled rollouts
 *
 * Manifest compliance:
 * - Fail fast: No API key = provider does nothing
 * - Security: Safe for frontend, respects privacy
 * - Simplicity: Standard PostHog SDK integration
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import posthog from 'posthog-js';

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

interface PostHogContextValue {
  posthog: typeof posthog | null;
  isEnabled: boolean;
}

const PostHogContext = createContext<PostHogContextValue>({
  posthog: null,
  isEnabled: false,
});

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const isEnabled = Boolean(POSTHOG_API_KEY && POSTHOG_API_KEY.trim() !== '');

  useEffect(() => {
    // Fail fast - no tracking without API key
    if (!isEnabled) {
      return;
    }

    // Initialize PostHog
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      loaded: (posthog) => {
        // Debug mode only in development
        if (import.meta.env.MODE === 'development') {
          posthog.debug();
        }
      },
      // Privacy-friendly defaults
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // Only track explicit events
      // Performance
      session_recording: {
        enabled: false, // Disable session recording by default (GDPR)
      },
    });

    return () => {
      posthog.reset();
    };
  }, [isEnabled]);

  return (
    <PostHogContext.Provider value={{ posthog: isEnabled ? posthog : null, isEnabled }}>
      {children}
    </PostHogContext.Provider>
  );
}

/**
 * Hook to access PostHog instance
 * Returns null if PostHog is not initialized
 */
export function usePostHog() {
  return useContext(PostHogContext);
}

/**
 * Hook to check feature flag
 * Returns false if PostHog is not initialized or flag is not set
 */
export function useFeatureFlag(flagKey: string): boolean {
  const { posthog, isEnabled } = usePostHog();

  if (!isEnabled || !posthog) {
    return false;
  }

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Hook to get feature flag value with payload
 * Returns undefined if PostHog is not initialized or flag is not set
 */
export function useFeatureFlagPayload(flagKey: string): any {
  const { posthog, isEnabled } = usePostHog();

  if (!isEnabled || !posthog) {
    return undefined;
  }

  return posthog.getFeatureFlagPayload(flagKey);
}

/**
 * Identify user for PostHog
 * Call this after user logs in
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!POSTHOG_API_KEY || !posthog._isIdentified()) {
    return;
  }

  posthog.identify(userId, properties);
}

/**
 * Track custom event
 * Usage: trackPostHogEvent('button_clicked', { button_name: 'subscribe' })
 */
export function trackPostHogEvent(eventName: string, properties?: Record<string, any>) {
  if (!POSTHOG_API_KEY) {
    return;
  }

  posthog.capture(eventName, properties);
}

/**
 * Reset PostHog (call on logout)
 */
export function resetPostHog() {
  if (!POSTHOG_API_KEY) {
    return;
  }

  posthog.reset();
}
