import { useState, useEffect } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axios';

const CARD_STYLE = {
  style: {
    base: {
      color: '#f0f0f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '15px',
      '::placeholder': { color: '#606060' },
    },
    invalid: { color: '#e06c6c' },
  },
};

function PaymentForm({ clientSecret, onSuccess, onClose }: {
  clientSecret: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (result.error) {
      setError(result.error.message ?? 'Payment failed.');
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      try {
        await api.post('/stripe/confirm-payment', { paymentIntentId: result.paymentIntent.id });
        onSuccess();
      } catch {
        setError('Payment succeeded but failed to activate VIP. Please contact support.');
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <div style={{
          fontSize: 'var(--font-size-sm)', fontWeight: 600,
          color: 'var(--text-secondary)', marginBottom: 'var(--space-2)',
        }}>
          Card details
        </div>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-overlay)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
        }}>
          <CardElement options={CARD_STYLE} />
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-sm"
          disabled={loading || !stripe}
          style={{ background: 'var(--color-primary)', color: '#472552', fontWeight: 700 }}
        >
          {loading ? 'Processing...' : 'Pay $9.99'}
        </button>
      </div>
    </form>
  );
}

export default function VipPaymentModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    api.post<{ clientSecret: string; publishableKey: string }>('/stripe/create-payment-intent')
      .then(res => {
        setClientSecret(res.data.clientSecret);
        setStripePromise(loadStripe(res.data.publishableKey));
      })
      .catch(err => {
        setInitError(err.response?.data?.message ?? 'Failed to initialize payment.');
      });
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 'var(--space-6)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-overlay)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          maxWidth: 440, width: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>
            Upgrade to VIP
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            One-time payment of $9.99
          </p>
        </div>

        {initError && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>{initError}</div>
        )}

        {!initError && (!stripePromise || !clientSecret) && (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading...</div>
        )}

        {stripePromise && clientSecret && (
          <Elements stripe={stripePromise}>
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
