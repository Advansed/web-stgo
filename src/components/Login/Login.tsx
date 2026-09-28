import React, { useState } from 'react';
import './Login.css';
import { useLogin } from './useLogin';

const UserIcon = () => (
  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);

const LockIcon = () => (
  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.5" />
    {!visible && <path d="m4 20 16-16" />}
  </svg>
);

const Login: React.FC = () => {
  const { username, setUsername, password, setPassword, rememberMe, handleMemberMe, login, loading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    void login({ login: username, password });
  };

  return (
    <main className="inspector-login">
      <header className="inspector-login-header">
        <img className="inspector-brand-lockup" src="/assets/brand/stng-wordmark.png" alt="Саха Транснефтегаз" width="461" height="156" />
        <span className="inspector-header-label">Мобильный инспектор <span aria-hidden="true">/</span> рабочий доступ</span>
      </header>

      <div className="inspector-login-main">
        <section className="inspector-login-intro" aria-label="О платформе">
          <div className="inspector-login-visual" aria-hidden="true"><img src="/assets/auth/inspector-infrastructure.webp" alt="" width="1200" height="800" /></div>
          <p className="inspector-intro-eyebrow stng-header-eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</p>
          <h1 className="stng-header-title">Мобильный<br /> инспектор</h1>
          <p className="inspector-intro-description stng-header-context">Заявки, лицевые счета и акты под рукой — на объекте и в офисе.</p>
        </section>

        <section className="inspector-auth-panel" aria-labelledby="login-title">
          <div className="inspector-panel-topline stng-header-eyebrow">ДОСТУП К СИСТЕМЕ</div>
          <div className="inspector-panel-heading">
            <h2 id="login-title">Вход в систему</h2>
            <p>Введите логин и пароль, чтобы продолжить.</p>
          </div>

          <form className="inspector-login-form" onSubmit={handleSubmit} aria-busy={loading}>
            <div className="auth-field">
              <label htmlFor="username">Логин</label>
              <div className="auth-input-wrap">
                <UserIcon />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Введите логин"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Пароль</label>
              <div className="auth-input-wrap">
                <LockIcon />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <label className="auth-remember">
              <input
                type="checkbox"
                name="remember"
                checked={rememberMe}
                onChange={(event) => handleMemberMe(event.target.checked)}
                disabled={loading}
              />
              <span className="auth-remember-box" aria-hidden="true" />
              <span>Запомнить меня</span>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Выполняется вход...' : 'Войти в систему'}</span>
              {loading ? <span className="auth-submit-spinner" aria-hidden="true" /> : <span className="auth-submit-arrow" aria-hidden="true">→</span>}
            </button>
          </form>
          <div className="inspector-panel-bottom">АО «Сахатранснефтегаз»</div>
        </section>
      </div>

      <footer className="inspector-login-footer">
        <span>Республика Саха (Якутия)</span>
        <span>© {new Date().getFullYear()} Сахатранснефтегаз</span>
      </footer>
    </main>
  );
};

export default Login;
