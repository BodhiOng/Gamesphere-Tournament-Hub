function Profile() {
  return (
    <section>
      <h2>Profile</h2>
      <div className="grid two">
        <article className="surface-card">
          <h3>User Info</h3>
          <p>Username: acecaptain</p>
          <p>Gamer Tag: AceCaptain</p>
          <p>Region: NA</p>
        </article>

        <article className="surface-card">
          <h3>Team Affiliation</h3>
          <p>Team: Quantum Five</p>
          <p>Role: Captain</p>
          <p>Tier: Diamond</p>
        </article>
      </div>

      <article className="surface-card">
        <h3>Match History & Achievements</h3>
        <ul className="detail-list">
          <li>Won Rift Rivals Qualifier - May 2026</li>
          <li>Top 8 at Valor Clash Spring Cup - Apr 2026</li>
          <li>MVP badge in 3 matches this season</li>
        </ul>
      </article>
    </section>
  );
}

export default Profile;
