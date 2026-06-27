import { motion } from 'framer-motion';
import { LayoutDashboard, ClipboardList, Flower2, Camera, MessageCircle, Heart, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Compass } from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, user, onLogout, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plan', label: "Today's Plan", icon: ClipboardList },
    { id: 'yoga', label: 'Yoga Session', icon: Flower2 },
    { id: 'pose', label: 'Live Pose Check', icon: Camera },
    { id: 'chat', label: 'Talk to Mentor', icon: MessageCircle },
    { id: 'mood', label: 'Mood & Journal', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white/95 backdrop-blur-sm border-r border-canvas-deep flex flex-col py-5 z-[100] overflow-hidden transition-[width] duration-300`}
      style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
    >
      <div className="flex items-center gap-2.5 px-4 pb-6 whitespace-nowrap overflow-hidden">
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
          className="text-moss shrink-0"
        >
          <Compass size={20} />
        </motion.span>
        {!collapsed && (
          <span className="font-display text-[13px] tracking-[0.28em] uppercase text-moss-deep">Yogtatva</span>
        )}
      </div>

      <button
        className="mx-4 mb-2 flex items-center justify-center text-text-secondary hover:text-moss-deep transition-colors duration-300 py-2"
        onClick={onToggleCollapse}
        title="Toggle Sidebar"
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap overflow-hidden transition-colors duration-300 ${
                active ? 'text-moss-deep' : 'text-text-secondary hover:text-ink hover:bg-canvas-deep/60'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-moss/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 shrink-0">
                <Icon size={18} />
              </span>
              {!collapsed && <span className="relative z-10">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-4 border-t border-canvas-deep mt-auto">
        <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'mb-0' : 'mb-4'}`}>
          <div className="w-8 h-8 rounded-full bg-moss/10 text-moss-deep flex items-center justify-center text-[13px] font-semibold shrink-0">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-[13px] text-ink font-medium">{user?.name || 'User'}</div>
              <div className="text-[11px] text-text-secondary">Wellness Journey</div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 rounded-xl text-[13px] text-clay hover:bg-clay/8 transition-colors duration-300 w-full ${
            collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
