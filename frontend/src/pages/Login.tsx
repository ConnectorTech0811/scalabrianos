import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import logoVertical from '../assets/logo_vertical.png';
import '../styles/Login.css';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      if (response.data.success) {
        login(response.data.user, response.data.token);
        const role = response.data.user.role;
        const isAdm = [
          'ADMIN_GERAL',
          'ADMINISTRADOR',
          'REGISTRO_REGIONAL',
          'SUPERIOR_REGIONAL',
          'SECRETARIO_REGIONAL',
          'ECONOMO_REGIONAL',
          'SECRETARIADO_MISSAO',
          'SECRETARIADO_VIDA_RELIGIOSA',
          'SECRETARIADO_FORMACAO',
          'SUPERIOR_LOCAL',
          'ECONOMO_LOCAL'
        ].includes(role);
        if (!isAdm) {
          navigate('/financeiro');
        } else {
          navigate('/home');
        }
      } else {
        setError(response.data.message || t('common.error'));
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-content">
        <div className="login-logo-container">
          <img src={logoVertical} alt="Scalabrianos Logo" className="login-logo" />
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <input
              type="email"
              placeholder={t('login.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>{t('login.remember_me')}</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? t('login.loading') : t('login.submit')}
          </button>

          <div className="login-footer">
            <a href="/forgot-password">{t('login.forgot_password')}</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
