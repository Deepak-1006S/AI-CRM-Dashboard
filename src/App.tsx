import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import { createMockContacts } from './mock/contacts';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Contact } from './types';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', action: 'dashboard' },
  { id: 'toggle-theme', label: 'Toggle theme', action: 'toggleTheme' },
  { id: 'switch-role', label: 'Switch role', action: 'switchRole' },
  { id: 'refresh', label: 'Refresh metrics', action: 'refresh' }
] as const;

type CommandAction = (typeof COMMANDS)[number]['action'];

type Role = 'admin' | 'sales';

const THEME_STORAGE_KEY = 'crm-theme';
const ROLE_STORAGE_KEY = 'crm-role';

function App() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>(THEME_STORAGE_KEY, 'dark');
  const [role, setRole] = useLocalStorage<Role>(ROLE_STORAGE_KEY, 'sales');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<number>(0);
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string>('');
  const [liveEvents, setLiveEvents] = useState<{ message: string; time: Date }[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [lastSynced, setLastSynced] = useState<Date>(() => new Date());

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const formatAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).valueOf();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const stageOrder = ['New lead', 'Qualified', 'Demo scheduled', 'Proposal', 'Negotiation'];
    const interval = window.setInterval(() => {
      setContacts((current) => {
        if (current.length === 0) return current;
        const index = Math.floor(Math.random() * Math.min(current.length, 120));
        const existing = current[index];
        const nextStage = stageOrder[(stageOrder.indexOf(existing.stage) + 1) % stageOrder.length];
        const nextStatus = Math.random() < 0.2 ? (existing.status === 'Active' ? 'Dormant' : 'Active') : existing.status;
        const updated: Contact = {
          ...existing,
          stage: nextStage,
          status: nextStatus,
          value: existing.value + (Math.random() < 0.35 ? 1200 : 0),
          lastContacted: new Date().toISOString()
        };
        const next = [...current];
        next[index] = updated;

        setLiveEvents((previous) => [
          { message: `${existing.name} moved to ${updated.stage}.`, time: new Date() },
          ...previous
        ].slice(0, 8));

        return next;
      });
    }, 12000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContacts(createMockContacts(10000));
      setLoading(false);
      setLastSynced(new Date());
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault();
        document.getElementById('dashboard-panel')?.scrollIntoView({ behavior: 'smooth' });
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [theme]);

  const summary = useMemo(() => {
    const totalRevenue = contacts.reduce((sum, contact) => sum + contact.value, 0);
    const openDeals = contacts.filter((item) => item.status === 'Active').length;
    const churn = contacts.filter((item) => item.status === 'Dormant').length;
    const pipelineVelocity = Math.min(78, Math.max(20, Math.round(openDeals / 12)));
    const followUpCount = Math.max(8, Math.round(openDeals * 0.24));
    return { totalRevenue, openDeals, churn, pipelineVelocity, followUpCount };
  }, [contacts]);

  const handleStatusToggle = (index: number) => {
    setContacts((current) => {
      const next = [...current];
      const contact = next[index];
      next[index] = {
        ...contact,
        status: contact.status === 'Active' ? 'Dormant' : 'Active'
      };
      return next;
    });
    setNotification('Lead status updated optimistically. Saving changes...');
    window.setTimeout(() => {
      setNotification('Lead status saved successfully.');
    }, 500);
  };

  const runCommand = (action: CommandAction) => {
    switch (action) {
      case 'dashboard':
        document.getElementById('dashboard-panel')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'toggleTheme':
        setTheme(theme === 'dark' ? 'light' : 'dark');
        break;
      case 'switchRole':
        setRole((current) => (current === 'admin' ? 'sales' : 'admin'));
        break;
      case 'refresh':
        setLoading(true);
        window.setTimeout(() => {
          setContacts(createMockContacts(10000));
          setLoading(false);
          setLastSynced(new Date());
        }, 700);
        break;
    }
    setCommandOpen(false);
  };

  const visibleContacts = useMemo(() => contacts.slice(0, 10000), [contacts]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">AI CRM</div>
        <nav className="nav-links">
          <button className="nav-button active">Dashboard</button>
          <button className="nav-button">Contacts</button>
          <button className="nav-button">Pipeline</button>
          <button className="nav-button">Reports</button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-role">Role</div>
          <button className="pill" onClick={() => setRole(role === 'admin' ? 'sales' : 'admin')}>
            {role === 'admin' ? 'Admin' : 'Sales'}
          </button>
          <div className="hint">Ctrl+K for command menu</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-headline">
              <h1>CRM command center</h1>
              <span className="live-pill">Live</span>
            </div>
            <p className="subtitle">Professional sales operations with fast data, role-aware UI, and keyboard-first navigation.</p>
            <div className="topbar-meta">
              <span>Local time: {formatTime(currentTime)}</span>
              <span>Last sync: {formatTime(lastSynced)}</span>
              <span>Feed updates: {liveEvents.length}</span>
            </div>
          </div>
          <div className="top-actions">
            <button className="ghost-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle theme</button>
            <button className="primary-btn" onClick={() => setCommandOpen(true)}>Open command menu</button>
          </div>
        </header>

        <section id="dashboard-panel" className="grid-panel">
          <div className="stats-grid">
            <div className="metric-card">
              <span className="metric-label">Total active value</span>
              <strong>${summary.totalRevenue.toLocaleString()}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Open deals</span>
              <strong>{summary.openDeals}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Dormant leads</span>
              <strong>{summary.churn}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">Team role</span>
              <strong>{role === 'admin' ? 'Administrator' : 'Sales rep'}</strong>
            </div>
          </div>

          {loading ? (
            <div className="skeleton-grid">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <>
              <div className="overview-card">
                <div className="overview-header">
                  <div>
                    <h2>{role === 'admin' ? 'Team overview' : 'Your pipeline'}</h2>
                    <p>{role === 'admin' ? 'Monitor team performance and forecast with confidence.' : 'Track your top leads and convert faster.'}</p>
                  </div>
                  <span className="badge">{role === 'admin' ? 'Admin view' : 'Sales view'}</span>
                </div>
                <div className="overview-body">
                  <div className="overview-stat">
                    <span>Pipeline velocity</span>
                    <strong>{summary.pipelineVelocity}%</strong>
                  </div>
                  <div className="overview-stat">
                    <span>Weekly response</span>
                    <strong>{Math.ceil(summary.openDeals * 0.35)}%</strong>
                  </div>
                  <div className="overview-stat">
                    <span>Follow-ups</span>
                    <strong>{summary.followUpCount}</strong>
                  </div>
                </div>
              </div>
              <div className="feed-card">
                <div className="overview-header">
                  <div>
                    <h2>Realtime activity</h2>
                    <p>Live updates from your pipeline, pushed directly into the dashboard.</p>
                  </div>
                  <span className="badge">Realtime</span>
                </div>
                <div className="event-feed">
                  {liveEvents.length === 0 ? (
                    <div className="event-empty">Waiting for fresh activity...</div>
                  ) : (
                    liveEvents.map((event, index) => (
                      <div key={`${event.message}-${index}`} className="event-item">
                        <span>{event.message}</span>
                        <time>{formatTime(event.time)}</time>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="table-panel">
          <div className="table-header">
            <div>
              <h2>Contacts & deals</h2>
              <p>Keyboard shortcuts: Ctrl+K, Ctrl+T, Ctrl+1</p>
            </div>
            <button className="secondary-btn" onClick={() => setCommandOpen(true)}>Quick command</button>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="table-skeleton">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="row-skeleton" />
                ))}
              </div>
            ) : (
              <List
                height={520}
                itemCount={visibleContacts.length}
                itemSize={64}
                width="100%"
                className="virtual-list"
              >
                {({ index, style }: { index: number; style: CSSProperties }) => {
                  const contact = visibleContacts[index];
                  return (
                    <div className="table-row" style={style} key={contact.id}>
                      <div className="row-cell name-cell">
                        <div className="contact-avatar">{contact.initials}</div>
                        <div>
                          <strong>{contact.name}</strong>
                          <span>{contact.company} · {formatAgo(contact.lastContacted)}</span>
                        </div>
                      </div>
                      <div className="row-cell">{contact.stage}</div>
                      <div className="row-cell">${contact.value.toLocaleString()}</div>
                      <div className="row-cell status-cell">{contact.status}</div>
                      <div className="row-cell actions-cell">
                        <button className="link-btn" onClick={() => handleStatusToggle(index)}>
                          Toggle status
                        </button>
                      </div>
                    </div>
                  );
                }}
              </List>
            )}
          </div>
        </section>
      </main>

      {isCommandOpen && (
        <div className="command-overlay" onClick={() => setCommandOpen(false)}>
          <div className="command-panel" onClick={(event) => event.stopPropagation()}>
            <div className="command-header">
              <span>Command</span>
              <button className="close-btn" onClick={() => setCommandOpen(false)}>Esc</button>
            </div>
            <div className="command-search">
              <input
                autoFocus
                value={COMMANDS[selectedCommand]?.label}
                readOnly
                placeholder="Choose an action..."
              />
            </div>
            <div className="command-list">
              {COMMANDS.map((command, idx) => (
                <button
                  key={command.id}
                  className={`command-item ${idx === selectedCommand ? 'selected' : ''}`}
                  onClick={() => runCommand(command.action)}
                >
                  {command.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {notification && <div className="toast">{notification}</div>}
    </div>
  );
}

export default App;
