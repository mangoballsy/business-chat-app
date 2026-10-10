import React from 'react';

const channels = [
  { name: '# general', active: true },
  { name: '# sales', active: false },
  { name: '# support', active: false },
  { name: '# design', active: false },
  { name: '# engineering', active: false },
  { name: '# announcements', active: false },
];

const messages = [
  { user: 'Liam', role: 'Admin', text: 'Good morning team — today’s launch checklist is in the project board.', time: '9:15 AM' },
  { user: 'Maya', role: 'Manager', text: 'I’ve confirmed the onboarding flow with QA. We’re ready for review.', time: '9:17 AM' },
  { user: 'Theo', role: 'Support', text: 'Customer tickets are stable. I’ve closed the top three issues.', time: '9:19 AM' },
  { user: 'Nina', role: 'Sales', text: 'We have three new leads this morning. I’ll sync with the team later.', time: '9:21 AM' },
  { user: 'You', role: 'Admin', text: 'Perfect. Please keep updates in this channel and tag me in blockers.', time: '9:22 AM' },
];

const teammates = [
  { name: 'Liam', status: 'online' },
  { name: 'Maya', status: 'online' },
  { name: 'Theo', status: 'busy' },
  { name: 'Nina', status: 'online' },
  { name: 'Ava', status: 'away' },
];

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-shell">
      <aside className="workspace-sidebar">
        <div className="workspace-header">
          <div className="workspace-logo">B</div>
          <div>
            <div className="workspace-name">Business Hub</div>
            <div className="workspace-subtitle">Operations</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-title">Channels</div>
          <ul className="channel-list">
            {channels.map((channel) => (
              <li key={channel.name} className={channel.active ? 'active' : ''}>
                {channel.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-section">
          <div className="section-title">Admin</div>
          <ul className="admin-list">
            <li>Permissions</li>
            <li>Roles</li>
            <li>Workspace Settings</li>
          </ul>
        </div>
      </aside>

      <main className="chat-panel">
        <header className="topbar">
          <div className="title-block">
            <div className="channel-pill"># general</div>
            <div className="channel-description">Daily team updates and announcements</div>
          </div>

          <div className="topbar-actions">
            <button className="ghost-btn">Search</button>
            <button className="primary-btn">Start Video Call</button>
            <button className="logout-btn" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <div className="chat-body">
          <div className="messages-panel">
            {messages.map((message, index) => (
              <div key={index} className="message-row">
                <div className="avatar">{message.user.charAt(0)}</div>
                <div className="message-content">
                  <div className="message-meta">
                    <span className="user-name">{message.user}</span>
                    <span className="user-role">{message.role}</span>
                    <span className="time">{message.time}</span>
                  </div>
                  <div className="message-text">{message.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="composer-box">
            <input type="text" placeholder="Message #general" />
            <button className="send-btn">Send</button>
          </div>
        </div>
      </main>

      <aside className="member-panel">
        <div className="member-header">Team Online</div>
        <ul className="member-list">
          {teammates.map((person) => (
            <li key={person.name}>
              <span className="member-name">{person.name}</span>
              <span className={`status-dot ${person.status}`}></span>
            </li>
          ))}
        </ul>

        <div className="admin-card">
          <div className="admin-card-title">Workspace Controls</div>
          <div className="admin-card-item">User Roles</div>
          <div className="admin-card-item">Channel Restrictions</div>
          <div className="admin-card-item">Meeting Settings</div>
          <div className="admin-card-item">Security Policies</div>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">{user?.name?.charAt(0) || 'A'}</div>
          <div>
            <div className="profile-name">{user?.name || 'Admin User'}</div>
            <div className="profile-role">{user?.role || 'Admin'}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Dashboard;
