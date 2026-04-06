import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { lang, setLang, t } = useLanguage()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      toast.error(t.common.error, t.auth.fillRequired)
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success(t.auth.welcome)
      navigate('/')
    } catch (err) {
      toast.error(t.auth.loginError, err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role) {
    if (role === 'admin') { setEmail('admin@company.com'); setPassword('admin123') }
    else { setEmail('david@company.com'); setPassword('employee123') }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Language toggle */}
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <button
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            style={{
              padding: '6px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.4)',
              background: 'rgba(255,255,255,.15)', color: 'white',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {lang === 'he' ? '🇺🇸 EN' : '🇮🇱 עב'}
          </button>
        </div>

        <div className="login-logo">
          <div className="logo-circle">📋</div>
          <h1>{t.auth.title}</h1>
          <p>{t.auth.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t.auth.email} <span className="required">*</span></label>
            <input
              type="email" className="form-control"
              placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.auth.password} <span className="required">*</span></label>
            <input
              type="password" className="form-control"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full"
            style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner">⟳</span> : '🔑'} &nbsp;
            {loading ? t.auth.loggingIn : t.auth.loginBtn}
          </button>
        </form>

        <div className="login-demo">
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{t.auth.demoUsers}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillDemo('admin')}>
              👑 {t.auth.admin}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillDemo('employee')}>
              👤 {t.auth.employee}
            </button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p>{t.auth.admin}: <code>admin@company.com</code> / <code>admin123</code></p>
            <p>{t.auth.employee}: <code>david@company.com</code> / <code>employee123</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
