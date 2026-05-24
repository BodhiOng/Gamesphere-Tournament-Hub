const widgets = [
  { title: 'Joined Tournaments', value: '5', detail: '2 currently live' },
  { title: 'Upcoming Matches', value: '3', detail: 'Next in 18h' },
  { title: 'Notifications', value: '7', detail: '2 urgent' },
  { title: 'Team Invites', value: '2', detail: 'Pending response' },
  { title: 'Recent Results', value: 'W-W-L', detail: 'Last 3 fixtures' },
];

function Dashboard() {
  return (
    <section>
      <h2>Dashboard</h2>
      <p>Main user hub for tournaments, invites, and recent performance snapshots.</p>
      <div className="grid three">
        {widgets.map((item) => (
          <article key={item.title} className="surface-card">
            <h3>{item.title}</h3>
            <p className="metric-value">{item.value}</p>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Dashboard;
