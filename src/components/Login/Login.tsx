import React, { useState } from 'react';
import './Login.css';
import { useLogin } from './useLogin';

const Login: React.FC = () => {
  const { username, setUsername, password, setPassword, rememberMe, handleMemberMe, login, loading } = useLogin();

  const handleSubmit = async () => {
    login({ login: username, password });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Сахатранснефтегаз</h1>
          <p className="login-subtitle">Вход в систему</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Логин или Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="form-input"
              placeholder="Введите ваш логин или email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="form-input"
              placeholder="Введите ваш пароль"
              disabled={loading}
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleMemberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Запомнить меня</span>
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
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>

        <div className="login-footer">
          <p>Нет аккаунта? <a href="/register">Зарегистрироваться</a></p>
          <div className="support-info">
            <p>Техническая поддержка: support@company.com</p>
            <p>Телефон: +7 (XXX) XXX-XX-XX</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;