import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const titles = {
  '/': { title: 'דשבורד', subtitle: 'סקירה כללית של המשימות' },
  '/projects': { title: 'פרויקטים', subtitle: 'ניהול פרויקטים' },
  '/tasks': { title: 'משימות', subtitle: 'כל המשימות' },
  '/calendar': { title: 'לוח שנה', subtitle: 'תצוגה חודשית' },
  '/progress': { title: 'התקדמות', subtitle: 'סטטיסטיקות עובדים' },
  '/users': { title: 'משתמשים', subtitle: 'ניהול משתמשים' },
}

export default function Navbar({ onMobileToggle }) {
  const location = useLocation()
  const { user } = useAuth()
  const pageInfo = titles[location.pathname] || { title: 'TaskManager', subtitle: '' }

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="hamburger-btn" onClick={onMobileToggle}>☰</button>
        <div>
          <div className="page-title">{pageInfo.title}</div>
          <div className="page-subtitle">{pageInfo.subtitle}</div>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-date" style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left' }}>
          {dateStr}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'var(--bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <div
            className="avatar avatar-sm"
            style={{ background: user?.avatarColor || '#6366f1' }}
          >
            {getInitials(user?.name)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {user?.role === 'ADMIN' ? 'מנהל' : 'עובד'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
