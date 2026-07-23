import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    gamerTag: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    try {
      const response = await register({
        username: form.username,
        gamerTag: form.gamerTag,
        email: form.email,
        password: form.password,
      });
      navigate('/login', { state: { message: response.message } });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-top-actions">
          <NavLink to="/" className="inline-link">← Home</NavLink>
        </div>
        <h2>Create your competitor account</h2>
        <label>
          Username
          <input name="username" autoCapitalize="none" onChange={onChange} value={form.username} required />
        </label>
        <label>
          Gamer Tag
          <input name="gamerTag" autoCapitalize="none" onChange={onChange} value={form.gamerTag} required />
        </label>
        <label>
          Email
          <input name="email" type="email" onChange={onChange} value={form.email} required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} onChange={onChange} value={form.password} required />
        </label>
        <label>
          Confirm password
          <input name="confirmPassword" type="password" minLength={8} onChange={onChange} value={form.confirmPassword} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-btn">Register</button>
        <p className="login-prompt">Already registered? <NavLink to="/login">Log in</NavLink></p>
      </form>
    </main>
  );
}

export default Register;
