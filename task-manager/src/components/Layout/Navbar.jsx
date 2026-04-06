import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function Navbar({ onMobileToggle }) {
  const location = useLocation()
  const { user } = useAuth()
  const { lang, setLang, t } = useLanguage()

  const titles = {
    '/': { title: t.nav.dashboard, subtitle: t.dashboard.subtitle },
    '/projects': { title: t.nav.projects, subtitle: t.projects.subtitle },
    '/tasks': { title: t.nav.tasks, subtitle: t.tasks.subtitle },
    '/calendar': { title: t.nav.calendar, subtitle: t.calendar.subtitle },
    '/progress': { title: t.nav.progress, subtitle: t.progress.subtitle },
    '/users': { title: t.nav.users, subtitle: t.users.subtitle },
  }

  const pageInfo = titles[location.pathname] || { title: 'TaskManager', subtitle: '' }

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const now = new Date()
  const dateStr = lang === 'he'
    ? now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

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

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg)', border: '1.5px solid var(--border)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: 'var(--text)', transition: 'var(--transition)',
          }}
          title={lang === 'he' ? 'Switch to English' : 'עבור לעברית'}
        >
          {lang === 'he' ? '🇺🇸 EN' : '🇮🇱 עב'}
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'var(--bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <div className="avatar avatar-sm" style={{ background: user?.avatarColor || '#6366f1' }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {user?.role === 'ADMIN' ? t.auth.admin : t.auth.employee}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
