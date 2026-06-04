import { LayoutDashboard, ClipboardList, Flower2, Camera, MessageCircle, Heart, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Compass } from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, user, onLogout, collapsed, onToggleCollapse }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'plan', label: "Today's Plan", icon: <ClipboardList size={18} /> },
    { id: 'yoga', label: 'Yoga Session', icon: <Flower2 size={18} /> },
    { id: 'pose', label: 'Live Pose Check', icon: <Camera size={18} /> },
    { id: 'chat', label: 'Talk to Mentor', icon: <MessageCircle size={18} /> },
    { id: 'mood', label: 'Mood & Journal', icon: <Heart size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <Compass size={20} />
        {!collapsed && <span>Yogtatva</span>}
      </div>

      <button className="sidebar-toggle" onClick={onToggleCollapse} title="Toggle Sidebar">
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" style={{ marginBottom: collapsed ? '0' : '16px' }}>
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">Wellness Journey</div>
            </div>
          )}
        </div>
        <button
          className="sidebar-item"
          onClick={onLogout}
          style={{ color: 'var(--error-color)', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '10px 12px' }}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
