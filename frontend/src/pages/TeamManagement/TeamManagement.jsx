import { useEffect, useState } from 'react';
import TeamRoster from '../../components/TeamRoster/TeamRoster';
import { getTeamRoster } from '../../api/teamApi';

function TeamManagement() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    getTeamRoster().then(setMembers);
  }, []);

  return (
    <section>
      <h2>Team Management</h2>
      <div className="grid two">
        <article className="surface-card">
          <h3>Team Operations</h3>
          <ul className="detail-list">
            <li>Create team</li>
            <li>Invite players</li>
            <li>Remove members</li>
            <li>Assign captain</li>
          </ul>
          <p>Pending invites: PulseWave, FrostAim</p>
        </article>

        <article className="surface-card">
          <h3>Team Stats</h3>
          <p>Match Win Rate: 71%</p>
          <p>Average Round Differential: +4.2</p>
          <p>Current Rank Tier: Diamond</p>
        </article>
      </div>

      <article className="surface-card">
        <h3>Roster Table</h3>
        <TeamRoster members={members} />
      </article>
    </section>
  );
}

export default TeamManagement;
