import React, { useState } from 'react';
import './Login.css';
import { useLogin } from './useLogin';
import { useToast } from '../Toast';


const Login: React.FC = () => {
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
    const { login, isLoading }          = useLogin()
    const toast = useToast()

    const handleSubmit = async() => {
        const res = await login( { username: username, password: password } )
        if(res) toast.success("Авторизация успешна")
        else toast.success("Ошибка авторизации")
    }   
    
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Заголовок с логотипом */}
        <div className="login-header">
          {/* {logo && <img src={logo} alt="Logo" className="login-logo" />} */}
          <h1 className="login-title">{ "Сахатранснефтегаз" }</h1>
          <p className="login-subtitle">Вход в систему</p>
        </div>

        {/* Форма входа */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Логин или Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="Введите ваш логин или email"
              required
              disabled={isLoading}
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
              className="form-input"
              placeholder="Введите ваш пароль"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Запомнить меня</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Забыли пароль?
            </a>
          </div>

          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Дополнительная информация */}
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