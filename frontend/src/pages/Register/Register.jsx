import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await register(form);
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
          <input name="username" onChange={onChange} value={form.username} required />
        </label>
        <label>
          Email
          <input name="email" type="email" onChange={onChange} value={form.email} required />
        </label>
        <label>
          Password
          <input name="password" type="password" onChange={onChange} value={form.password} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-btn">Register</button>
        <p className="login-prompt">Already registered? <NavLink to="/login">Log in</NavLink></p>
      </form>
    </main>
  );
}

export default Register;
