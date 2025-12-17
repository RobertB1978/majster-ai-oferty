/**
 * Google Analytics 4 Integration
 * TIER 1.2 - Analytics tracking for business insights
 *
 * Manifest compliance:
 * - Fail fast: No GA_MEASUREMENT_ID = component does nothing
 * - Security: Only loads in production with valid ID
 * - Simplicity: Native gtag.js, no extra dependencies
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Google Analytics component
 * Auto-tracks page views on route changes
 * Only loads in production with valid measurement ID
 */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Fail fast - no tracking without ID
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.trim() === '') {
      return;
    }

    // Load gtag.js script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
        send_page_view: true
      });
    `;
    document.head.appendChild(script2);

    // Cleanup
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []); // Only run once on mount

  // Track page views on route change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
      return;
    }

    // Send page view
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);

  return null; // No UI
}

/**
 * Helper function to track custom events
 * Usage: trackEvent('button_click', { button_name: 'subscribe' })
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', eventName, eventParams);
}

/**
 * Track conversion events (signup, purchase, etc.)
 */
export function trackConversion(conversionName: string, value?: number) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'conversion', {
    send_to: GA_MEASUREMENT_ID,
    value: value,
    currency: 'PLN',
    transaction_id: `${conversionName}_${Date.now()}`,
  });
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
