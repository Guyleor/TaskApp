import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/', icon: '📊', label: 'דשבורד' },
  { path: '/projects', icon: '📁', label: 'פרויקטים' },
  { path: '/tasks', icon: '✅', label: 'משימות' },
  { path: '/calendar', icon: '📅', label: 'לוח שנה' },
  { path: '/progress', icon: '📈', label: 'התקדמות' },
]

const adminItems = [
  { path: '/users', icon: '👥', label: 'משתמשים' },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  function getRoleLabel(role) {
    return role === 'ADMIN' ? 'מנהל' : 'עובד'
  }

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">📋</div>
        {!collapsed && (
          <div>
            <div className="logo-text">TaskManager</div>
            <div className="logo-sub">ניהול משימות</div>
          </div>
        )}
        <button className="sidebar-mobile-close" onClick={onMobileClose}>✕</button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-title">ניווט ראשי</div>}
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            data-tooltip={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            {!collapsed && <div className="nav-section-title">ניהול</div>}
            {adminItems.map(item => (
              <div
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
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
        <div className="sidebar-user" onClick={logout} title="התנתקות">
          <div
            className="avatar avatar-sm"
            style={{ background: user?.avatarColor || '#6366f1' }}
          >
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
