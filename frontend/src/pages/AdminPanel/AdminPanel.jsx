const actions = [
  'Create tournaments',
  'Manage users',
  'Approve teams',
  'Update match results',
  'Moderate reports',
];

function AdminPanel() {
  return (
    <section className="surface-card">
      <h2>Admin Panel</h2>
      <p>Admin-only controls for tournament lifecycle and platform moderation.</p>
      <ul className="detail-list">
        {actions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="cta-row">
        <button type="button" className="primary-btn">Create Tournament</button>
        <button type="button" className="ghost-btn">Review Reports</button>
      </div>
    </section>
  );
}

export default AdminPanel;
