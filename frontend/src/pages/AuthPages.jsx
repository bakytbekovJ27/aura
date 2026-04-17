import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { register } from '../api/client';
import { useToast } from '../hooks/useToast';

// ── Login ─────────────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast('Добро пожаловать в AURA ✨', 'success');
      navigate('/');
    } catch (err) {
      toast(err.message || 'Неверный логин или пароль', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-visual">👩</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, letterSpacing: 8, color: 'var(--rose-deep)' }}>
            AURA
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
            AI-стилист нового поколения
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
          {['💄 Макияж','👗 Гардероб','🎨 Цвета','✨ AI советы'].map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <form className="auth-form fade-in" onSubmit={submit}>
          <div className="auth-title">Привет ✨</div>
          <div className="auth-subtitle">
            Войди в свой профиль и продолжи работу с персональным стилистом
          </div>

          <div className="form-group">
            <label className="form-label">Имя пользователя</label>
            <input
              name="username"
              value={form.username}
              onChange={handle}
              className="form-control"
              placeholder="your_username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              className="form-control"
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Вход...</> : '→ Войти'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: 'var(--rose-deep)', textDecoration: 'none', fontWeight: 500 }}>
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Register ─────────────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', password2: '',
  });
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast('Пароли не совпадают!', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      await login(form.username, form.password);
      toast('Аккаунт создан! Добро пожаловать ✨', 'success');
      navigate('/');
    } catch (err) {
      const data = err.data || {};
      const msg  = Object.values(data).flat().join(' ') || err.message;
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-visual">🌸</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, letterSpacing: 6, color: 'var(--rose-deep)' }}>
            Присоединяйся
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, maxWidth: 260 }}>
            Создай профиль и получи персонального AI-стилиста
          </div>
        </div>
      </div>

      <div className="auth-right">
        <form className="auth-form fade-in" onSubmit={submit}>
          <div className="auth-title">Создать аккаунт</div>
          <div className="auth-subtitle">
            Несколько секунд — и твой стилист готов к работе
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Имя</label>
              <input name="first_name" value={form.first_name} onChange={handle}
                className="form-control" placeholder="Алия" />
            </div>
            <div className="form-group">
              <label className="form-label">Фамилия</label>
              <input name="last_name" value={form.last_name} onChange={handle}
                className="form-control" placeholder="Смит" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Имя пользователя</label>
            <input name="username" value={form.username} onChange={handle}
              className="form-control" placeholder="aliya_smith" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              className="form-control" placeholder="you@example.com" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                className="form-control" placeholder="••••••" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Повтори пароль</label>
              <input name="password2" type="password" value={form.password2} onChange={handle}
                className="form-control" placeholder="••••••" required />
            </div>
          </div>

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Создаю аккаунт...</> : '✨ Зарегистрироваться'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--rose-deep)', textDecoration: 'none', fontWeight: 500 }}>
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
