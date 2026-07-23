import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RecoverPassword() {
  const { recoverPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    newPassword: '',
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

    if (form.newPassword !== form.confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    try {
      const response = await recoverPassword({
        email: form.email,
        username: form.username,
        newPassword: form.newPassword,
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
          <NavLink to="/login" className="inline-link">Back to login</NavLink>
        </div>
        <h2>Recover account access</h2>
        <p className="auth-helper-text">Use the same email and username you registered with. Pending account requests can also update their password here.</p>
        <label>
          Email
          <input name="email" type="email" onChange={onChange} value={form.email} required />
        </label>
        <label>
          Username
          <input name="username" autoCapitalize="none" onChange={onChange} value={form.username} required />
        </label>
        <label>
          New password
          <input name="newPassword" type="password" minLength={8} onChange={onChange} value={form.newPassword} required />
        </label>
        <label>
          Confirm new password
          <input name="confirmPassword" type="password" minLength={8} onChange={onChange} value={form.confirmPassword} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-btn">Update password</button>
      </form>
    </main>
  );
}

export default RecoverPassword;
