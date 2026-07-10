import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login, isAuthenticated, isLoading, isWaiter } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={isWaiter ? '/dashboard' : '/kitchen'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Credenciais inválidas. Tente novamente.';
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon">
            <UtensilsCrossed size={26} />
          </div>
          <div>
            <div className="login-title">RestaurantApp</div>
            <div className="login-sub">Entre com suas credenciais de funcionário</div>
          </div>
        </div>

        {error && <div className="login-error mb-4">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[var(--text-muted)] flex"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner w-3.5 h-3.5 border-2" />
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
