import { useEffect, useState } from 'react';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';

function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ username: '', email: '' });

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
          setError('');
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError('');
      }

      try {
        const result = await getCurrentUserProfile(user);
        if (isMounted) {
          setProfile(result);
          const resolvedName = result?.username || user.username || '';
          setForm({
            username: resolvedName,
            email: result?.email || user.email || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load profile details right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'username' ? value.toLowerCase() : value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Please log in to edit your profile.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCurrentUserProfile(user, {
        username: form.username,
        email: form.email,
      });

      setProfile(updated);
      const nextAuthUser = {
        ...user,
        username: updated?.username || user.username,
        email: updated?.email || user.email,
        gamerTag: updated?.gamerTag || updated?.username || user.gamerTag || user.username,
      };
      updateUser(nextAuthUser);

      const resolvedName = updated?.username || '';
      setForm({
        username: resolvedName,
        email: updated?.email || '',
      });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err?.message || 'Unable to update profile right now.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <section>
        <h2>Profile</h2>
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p>Please log in to view your profile.</p>
        </article>
      </section>
    );
  }

  const hasLoadedProfile = Boolean(profile);

  return (
    <section>
      <h2>Profile</h2>

      {loading ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p>Loading profile details...</p>
        </article>
      ) : null}

      {error ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p className="error-text">{error}</p>
        </article>
      ) : null}

      <article className="surface-card" style={{ marginTop: '1rem' }}>
        <h3>Edit Account</h3>
        <p style={{ marginTop: '0.5rem' }}>
          Update your profile details. Values already used by another account cannot be saved.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', maxWidth: '460px' }}>
          <label>
            Public ID
            <input
              value={profile?.publicId || user.publicId || ''}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label>
            Username
            <input
              name="username"
              autoCapitalize="none"
              value={form.username}
              onChange={onChange}
              disabled={loading || saving}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              disabled={loading || saving}
              required
            />
          </label>

          <div className="cta-row">
            <button type="submit" className="primary-btn" disabled={loading || saving || !hasLoadedProfile}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {success ? <p className="success-text">{success}</p> : null}
        </form>
      </article>
    </section>
  );
}

export default Profile;
