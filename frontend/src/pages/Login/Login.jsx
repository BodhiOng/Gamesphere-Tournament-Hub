import { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await login(form);
      const nextPath = response?.user?.isAdmin
        ? '/admin'
        : location.state?.from || '/';
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-top-actions">
          <NavLink to="/" className="inline-link">&lt;- Home</NavLink>
        </div>
        <h2>Welcome back, contender</h2>
        <p className="auth-helper-text">Sign in to continue, or use the actions below to create an account or recover your password.</p>
        {location.state?.message && <p className="success-text">{location.state.message}</p>}
        <label>
          Email
          <input name="email" type="email" onChange={onChange} value={form.email} required />
        </label>
        <label>
          Password
          <input name="password" type="password" onChange={onChange} value={form.password} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-btn">Log in</button>
        <div className="auth-alt-actions">
          <NavLink to="/recover-password" className="ghost-btn auth-alt-link">Recover password</NavLink>
          <NavLink to="/register" className="ghost-btn auth-alt-link">Create account</NavLink>
        </div>
      </form>
    </main>
  );
}

export default Login;
