/**
 * Stripe Checkout Button Component
 *
 * React component for initiating Stripe checkout.
 * Redirects user to Stripe Checkout page for payment.
 *
 * Created: 2025-12-17
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateCheckoutSession } from '@/hooks/useStripeSubscription';
import { Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutButtonProps {
  priceId: string;
  planName: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function StripeCheckoutButton({
  priceId,
  planName,
  children,
  className,
  disabled,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const createCheckout = useCreateCheckoutSession();

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const { sessionId, url } = await createCheckout.mutateAsync({ priceId });

      // Option 1: Redirect to Stripe-hosted checkout page
      if (url) {
        window.location.href = url;
        return;
      }

      // Option 2: Use Stripe.js to redirect (more control)
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading || !priceId}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Przekierowanie...
        </>
      ) : (
        children || `Wybierz plan ${planName}`
      )}
    </Button>
  );
}
