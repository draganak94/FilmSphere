import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axios';
import NavBar from '../components/NavBar';

const ELEMENT_STYLE = {
  style: {
    base: {
      color: '#f0f0f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '15px',
      '::placeholder': { color: '#606060' },
    },
    invalid: { color: '#e06c6c' },
  },
  disableLink: true,
};

const inputBoxStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--bg-overlay)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
};

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post<{ clientSecret: string }>('/stripe/create-subscription');

      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) return;

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardNumber },
      });

      if (result.error) {
        setError(result.error.message ?? 'Payment failed.');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await api.post('/stripe/confirm-payment', { paymentIntentId: result.paymentIntent.id });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="form-group">
        <label className="form-label" style={{ color: 'var(--color-primary)' }}>Card number</label>
        <div style={inputBoxStyle}>
          <CardNumberElement options={ELEMENT_STYLE} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--color-primary)' }}>Expiry date</label>
          <div style={inputBoxStyle}>
            <CardExpiryElement options={ELEMENT_STYLE} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--color-primary)' }}>CVC</label>
          <div style={inputBoxStyle}>
            <CardCvcElement options={ELEMENT_STYLE} />
          </div>
        </div>
      </div>

      {error && <span className="form-error">{error}</span>}

      <button
        type="submit"
        disabled={loading || !stripe}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          background: 'var(--color-primary)',
          color: '#472552',
          fontWeight: 700,
          fontSize: 'var(--font-size-md)',
          padding: 'var(--space-3) var(--space-6)',
          borderRadius: 'var(--radius-md)',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity var(--transition-fast)',
          border: 'none',
          textAlign: 'center',
        }}
      >
        {loading ? 'Processing...' : 'Subscribe for $9.99/month'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
        You can cancel your subscription at any time from your profile.
      </p>
    </form>
  );
}

export default function VipPage() {
  const navigate = useNavigate();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ publishableKey: string }>('/stripe/config')
      .then(res => setStripePromise(loadStripe(res.data.publishableKey)))
      .catch(() => setInitError('Failed to initialize payment.'));
  }, []);

  const handleSuccess = () => navigate('/profile');

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="container">
        <NavBar />

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 'var(--space-12)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 460 }}>

            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-2xl)', fontWeight: 700,
                color: 'var(--color-primary)', marginBottom: 'var(--space-1)',
              }}>
                FilmSphere VIP
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                $9.99 / month · Cancel anytime
              </p>
            </div>

            <div style={{
              borderTop: '1px solid var(--bg-overlay)',
              marginBottom: 'var(--space-8)',
            }} />

            {initError && (
              <p className="form-error">{initError}</p>
            )}

            {stripePromise && (
              <Elements stripe={stripePromise}>
                <CheckoutForm onSuccess={handleSuccess} />
              </Elements>
            )}

            {!stripePromise && !initError && (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                Loading...
              </p>
            )}

            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <Link
                to="/profile"
                style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}
              >
                ← Back to profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
