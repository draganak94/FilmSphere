import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

type FormFields = 'username' | 'email' | 'password' | 'displayName';

const fields: { name: FormFields; label: string; required: boolean }[] = [
  { name: 'username', label: 'Username', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'password', label: 'Password', required: true },
  { name: 'displayName', label: 'Display Name (optional)', required: false },
];

export default function RegisterPage() {
  const [form, setForm] = useState<Record<FormFields, string>>({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      setAuth(data.accessToken, {
        userId: data.userId,
        username: data.username,
        displayName: data.displayName,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 className="gradient-text" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-8)' }}>
          Create account
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {fields.map(({ name, label, required }) => (
            <div className="form-group" key={name}>
              <label className="form-label" style={{ color: 'var(--color-primary)' }}>{label}</label>
              <input
                name={name}
                type={name === 'password' ? 'password' : 'text'}
                value={form[name]}
                onChange={handleChange}
                required={required}
                autoComplete={name === 'password' ? 'new-password' : name}
              />
            </div>
          ))}

          {error && <span className="form-error">{error}</span>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', color: '#472552' }}>
            Register
          </button>
        </form>

        <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
