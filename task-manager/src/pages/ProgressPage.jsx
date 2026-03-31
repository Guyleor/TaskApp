import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function ProgressPage() {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { loadProgress() }, [])

  async function loadProgress() {
    try {
      const data = await api.getUsersProgress()
      setProgress(data)
    } catch { toast.error('שגיאה', 'לא ניתן לטעון נתוני התקדמות') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="loading-spinner" />

  const totalTasks = progress.reduce((s, u) => s + u.total, 0)
  const totalDone = progress.reduce((s, u) => s + u.done, 0)
  const overallRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="👥" label="עובדים פעילים" value={progress.length} color="#6366f1" bg="#ede9fe" />
        <StatCard icon="📋" label="סה״כ משימות" value={totalTasks} color="#3b82f6" bg="#dbeafe" />
        <StatCard icon="✅" label="הושלמו" value={totalDone} color="#10b981" bg="#d1fae5" />
        <StatCard icon="📊" label="אחוז השלמה" value={`${overallRate}%`} color="#f59e0b" bg="#fef3c7" />
      </div>

      {/* Overall progress bar */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">📊 אחוז השלמה כולל</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{overallRate}%</span>
        </div>
        <div className="card-body">
          <div className="progress-bar-track" style={{ height: 20 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${overallRate}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)' }}
            />
          </div>
        </div>
      </div>

      {progress.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>אין עובדים עם משימות</h3>
          <p>הקצה משימות לעובדים כדי לראות את ההתקדמות שלהם</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {progress.map(emp => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}

      {/* Bar Chart */}
      {progress.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-title">📊 השוואת ביצועים</div>
          </div>
          <div className="card-body">
            <BarChart data={progress} />
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeeCard({ employee }) {
  const rate = employee.total > 0 ? Math.round((employee.done / employee.total) * 100) : 0

  return (
    <div className="card">
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div className="avatar avatar-lg" style={{ background: employee.avatarColor }}>
            {employee.name.slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{employee.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{employee.total} משימות</div>
          </div>
          <div style={{
            width: 52, height: 52,
            borderRadius: '50%',
            background: `conic-gradient(${employee.avatarColor} ${rate * 3.6}deg, var(--border) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: employee.avatarColor
            }}>
              {rate}%
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <MiniStat label="הושלם" value={employee.done} color="#10b981" bg="#d1fae5" icon="✅" />
          <MiniStat label="בתהליך" value={employee.inProgress} color="#3b82f6" bg="#dbeafe" icon="⚡" />
          <MiniStat label="לביצוע" value={employee.todo} color="#f59e0b" bg="#fef3c7" icon="📌" />
        </div>

        {/* Progress bars */}
        {employee.total > 0 && (
          <>
            <ProgressBar label="הושלם" value={employee.done} total={employee.total} color="#10b981" />
            <ProgressBar label="בתהליך" value={employee.inProgress} total={employee.total} color="#3b82f6" />
            <ProgressBar label="לביצוע" value={employee.todo} total={employee.total} color="#f59e0b" />
          </>
        )}

        {employee.total === 0 && (
          <p style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
            אין משימות מוקצות
          </p>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color, bg, icon }) {
  return (
    <div style={{ background: bg, borderRadius: 'var(--radius)', padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-label">
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value} ({pct}%)</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.total), 1)
  const height = 180

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minWidth: data.length * 80, height: height + 60, padding: '0 8px' }}>
        {data.map(emp => {
          const doneH = (emp.done / maxVal) * height
          const ipH = (emp.inProgress / maxVal) * height
          const todoH = (emp.todo / maxVal) * height

          return (
            <div key={emp.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
                <BarSegment height={todoH} color="#fef3c7" borderColor="#f59e0b" title={`לביצוע: ${emp.todo}`} />
                <BarSegment height={ipH} color="#dbeafe" borderColor="#3b82f6" title={`בתהליך: ${emp.inProgress}`} />
                <BarSegment height={doneH} color="#d1fae5" borderColor="#10b981" title={`הושלם: ${emp.done}`} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="avatar avatar-sm" style={{ background: emp.avatarColor, margin: '0 auto 4px' }}>
                  {emp.name.slice(0, 2)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{emp.total} משימות</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        {[
          { color: '#fef3c7', border: '#f59e0b', label: 'לביצוע' },
          { color: '#dbeafe', border: '#3b82f6', label: 'בתהליך' },
          { color: '#d1fae5', border: '#10b981', label: 'הושלם' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: l.color, border: `2px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function BarSegment({ height, color, borderColor, title }) {
  return (
    <div
      title={title}
      style={{
        width: 24,
        height: Math.max(height, height > 0 ? 4 : 0),
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: '4px 4px 0 0',
        transition: 'height 0.6s ease',
        cursor: 'pointer'
      }}
    />
  )
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
      </div>
    </div>
  )
}
