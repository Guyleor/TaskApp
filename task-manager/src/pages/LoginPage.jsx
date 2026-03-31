import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('שגיאה', 'נדרש אימייל וסיסמה')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('ברוך הבא! 👋')
      navigate('/')
    } catch (err) {
      toast.error('שגיאת התחברות', err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role) {
    if (role === 'admin') {
      setEmail('admin@company.com')
      setPassword('admin123')
    } else {
      setEmail('david@company.com')
      setPassword('employee123')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-circle">📋</div>
          <h1>Task Manager</h1>
          <p>מערכת ניהול משימות צוותית</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              אימייל <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              סיסמה <span className="required">*</span>
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner">⟳</span> : '🔑'} &nbsp;
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>

        <div className="login-demo">
          <p style={{ fontWeight: 600, marginBottom: 8 }}>משתמשי דמו:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('admin')}
            >
              👑 מנהל
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('employee')}
            >
              👤 עובד
            </button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p>מנהל: <code>admin@company.com</code> / <code>admin123</code></p>
            <p>עובד: <code>david@company.com</code> / <code>employee123</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
