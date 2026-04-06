import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const navItems = [
    { path: '/', icon: '📊', label: t.nav.dashboard },
    { path: '/projects', icon: '📁', label: t.nav.projects },
    { path: '/tasks', icon: '✅', label: t.nav.tasks },
    { path: '/calendar', icon: '📅', label: t.nav.calendar },
    { path: '/progress', icon: '📈', label: t.nav.progress },
  ]

  const adminItems = [
    { path: '/users', icon: '👥', label: t.nav.users },
  ]

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  function getRoleLabel(role) {
    return role === 'ADMIN' ? t.auth.admin : t.auth.employee
  }

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">📋</div>
        {!collapsed && (
          <div>
            <div className="logo-text">TaskManager</div>
            <div className="logo-sub">{t.auth.subtitle}</div>
          </div>
        )}
        <button className="sidebar-mobile-close" onClick={onMobileClose}>✕</button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-title">{t.nav.mainNav}</div>}
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path || (item.path === '/projects' && location.pathname.startsWith('/projects')) ? 'active' : ''}`}
            onClick={() => { navigate(item.path); onMobileClose?.() }}
            data-tooltip={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            {!collapsed && <div className="nav-section-title">{t.nav.management}</div>}
            {adminItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => { navigate(item.path); onMobileClose?.() }}
                data-tooltip={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title={t.auth.logout}>
          <div className="avatar avatar-sm" style={{ background: user?.avatarColor || '#6366f1' }}>
            {getInitials(user?.name)}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{getRoleLabel(user?.role)}</div>
          </div>
          {!collapsed && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>🚪</span>}
        </div>
      </div>

      <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'הרחב' : 'כווץ'}>
        {collapsed ? '‹' : '›'}
      </button>
    </div>
  )
}
