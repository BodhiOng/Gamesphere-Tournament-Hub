import { useEffect, useState } from 'react';
import { approveAccountRequest, getAccountRequests, rejectAccountRequest } from '../../api/adminApi';

const actions = [
  'Create tournaments',
  'Manage users',
  'Approve teams',
  'Update match results',
  'Moderate reports',
];

function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadRequests() {
      try {
        const data = await getAccountRequests();
        if (!ignore) {
          setRequests(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshRequests = async () => {
    setError('');
    const data = await getAccountRequests();
    setRequests(data);
  };

  const handleDecision = async (id, decision) => {
    setError('');
    try {
      if (decision === 'approve') {
        await approveAccountRequest(id);
      } else {
        await rejectAccountRequest(id);
      }

      await refreshRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="surface-card">
      <h2>Admin Panel</h2>
      <p>Admin-only controls for tournament lifecycle and platform moderation.</p>
      <ul className="detail-list">
        {actions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="surface-card" style={{ marginTop: '1.5rem' }}>
        <h3>Pending account requests</h3>
        {loading && <p>Loading requests...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && requests.length === 0 && <p>No pending requests.</p>}
        <div className="detail-list">
          {requests.map((request) => (
            <div key={request.id} className="surface-card" style={{ marginBottom: '1rem' }}>
              <strong>{request.username}</strong>
              <p>{request.email}</p>
              <p>Status: {request.status}</p>
              <div className="cta-row">
                <button type="button" className="primary-btn" onClick={() => handleDecision(request.id, 'approve')} disabled={request.status !== 'Pending'}>
                  Approve
                </button>
                <button type="button" className="ghost-btn" onClick={() => handleDecision(request.id, 'reject')} disabled={request.status !== 'Pending'}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-row">
        <button type="button" className="primary-btn">Create Tournament</button>
        <button type="button" className="ghost-btn">Review Reports</button>
      </div>
    </section>
  );
}

export default AdminPanel;
