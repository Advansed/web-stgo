import React, { useState } from 'react';
import './Login.css';
import { useLogin } from './useLogin';

// SVG Icons components for cleaner code
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Login: React.FC = () => {
  const { username, setUsername, password, setPassword, rememberMe, handleMemberMe, login, loading } = useLogin();
  
  // Локальный стейт только для отображения пароля (UX)
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    login({ login: username, password });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="login-page">
      {/* Левая часть - Визуал */}
      <div className="login-visual-side">
        <div className="visual-content">
          <h1 className="visual-title">Энергия<br/>вашего успеха</h1>
          <p className="visual-desc">
            Единая цифровая платформа управления ресурсами АО «Сахатранснефтегаз».
            Надежность, эффективность и безопасность.
          </p>
        </div>
        <div className="visual-footer">
          © {new Date().getFullYear()} Сахатранснефтегаз
        </div>
      </div>

      {/* Правая часть - Форма */}
      <div className="login-form-side">
        <div className="login-wrapper">
          <div className="login-header">
            <span className="brand-logo-text">СТНГ • Вход</span>
            <h2 className="login-title">С возвращением!</h2>
            <p className="login-subtitle">Пожалуйста, введите свои данные для входа</p>
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Логин или Email
            </label>
            <div className="input-wrapper">
              <UserIcon />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input"
                placeholder="user@example.com"
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Пароль
            </label>
            <div className="input-wrapper">
              <LockIcon />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input"
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleMemberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Запомнить меня</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Забыли пароль?
            </a>
          </div>

          <button
            onClick={handleSubmit}
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Вход в систему...' : 'Войти'}
          </button>

          <div className="login-footer">
            <p>Нет аккаунта? <a href="/register">Подать заявку</a></p>
            <div className="support-block">
              <p>Техподдержка: support@stng.ru | +7 (XXX) XXX-XX-XX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;