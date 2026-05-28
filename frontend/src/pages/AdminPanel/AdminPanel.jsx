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
    <div className="admin-layout">
      <aside className="admin-side-nav" aria-label="Admin quick navigation">
        <a href="#create-tournaments" className="nav-chip">Create tournaments</a>
        <a href="#manage-users" className="nav-chip">Manage users</a>
        <a href="#approve-teams" className="nav-chip">Approve teams</a>
        <a href="#update-matches" className="nav-chip">Update match results</a>
        <a href="#moderate-reports" className="nav-chip">Moderate reports</a>
      </aside>

      <main className="admin-column">
        <section id="create-tournaments" className="surface-card">
          <h3>Create tournaments</h3>
          <p>Create and configure new tournaments, set slots, prize pools, and schedules.</p>
          <div className="cta-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="primary-btn">Create Tournament</button>
          </div>
        </section>

        <section id="manage-users" className="surface-card">
          <h3>Manage users</h3>
          <p>Review account requests and manage user accounts.</p>

          <div style={{ marginTop: '1rem' }}>
            {loading && <p>Loading requests...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && requests.length === 0 && <p>No pending requests.</p>}

            {!loading && requests.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table-shell auth-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Gamer Tag</th>
                      <th>Requested</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => {
                      const isPending = req.status === 'Pending' || req.status === 0 || req.status === '0';
                      const requestedAt = req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '-';
                      return (
                        <tr key={req.id}>
                          <td>{req.username}</td>
                          <td>{req.email}</td>
                          <td>{req.gamerTag || '-'}</td>
                          <td>{requestedAt}</td>
                          <td>{typeof req.status === 'string' ? req.status : (req.status === 0 ? 'Pending' : req.status)}</td>
                          <td>
                            <div className="cta-row">
                              <button type="button" className="primary-btn" onClick={() => handleDecision(req.id, 'approve')} disabled={!isPending}>
                                Approve
                              </button>
                              <button type="button" className="ghost-btn" onClick={() => handleDecision(req.id, 'reject')} disabled={!isPending}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section id="approve-teams" className="surface-card">
          <h3>Approve teams</h3>
          <p>Approve or reject team registrations and manage team metadata.</p>
          <div className="cta-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="primary-btn">Review Team Approvals</button>
          </div>
        </section>

        <section id="update-matches" className="surface-card">
          <h3>Update match results</h3>
          <p>Manually update match outcomes, correct scores, and resolve disputes.</p>
          <div className="cta-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="primary-btn">Manage Matches</button>
          </div>
        </section>

        <section id="moderate-reports" className="surface-card">
          <h3>Moderate reports</h3>
          <p>Review player reports, ban appeals, and moderation history.</p>
          <div className="cta-row" style={{ marginTop: '1rem' }}>
            <button type="button" className="ghost-btn">Review Reports</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;
