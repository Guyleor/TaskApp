import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

const PRIORITY_MAP = { HIGH: { label: 'גבוהה', badge: 'badge-high' }, MEDIUM: { label: 'בינונית', badge: 'badge-medium' }, LOW: { label: 'נמוכה', badge: 'badge-low' } }
const STATUS_MAP = { TODO: { label: 'לביצוע', badge: 'badge-todo' }, IN_PROGRESS: { label: 'בתהליך', badge: 'badge-in-progress' }, DONE: { label: 'הושלם', badge: 'badge-done' } }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [statsData, tasksData] = await Promise.all([
        api.getTaskStats(),
        api.getTasks({ status: 'IN_PROGRESS' })
      ])
      setStats(statsData)
      setTasks(tasksData.slice(0, 6))
    } catch {
      toast.error('שגיאה', 'לא ניתן לטעון נתונים')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('he-IL')
  }

  function isOverdue(task) {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  }

  if (loading) return <div className="loading-spinner" />

  const completionRate = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div>
      <div className="stats-grid">
        <StatCard
          icon="📋" label="סה״כ משימות" value={stats?.total || 0}
          color="#6366f1" bgColor="#ede9fe"
        />
        <StatCard
          icon="✅" label="הושלמו" value={stats?.done || 0}
          color="#10b981" bgColor="#d1fae5"
          sub={`${completionRate}% השלמה`}
        />
        <StatCard
          icon="⚡" label="בתהליך" value={stats?.inProgress || 0}
          color="#3b82f6" bgColor="#dbeafe"
        />
        <StatCard
          icon="⏰" label="באיחור" value={stats?.overdue || 0}
          color="#ef4444" bgColor="#fee2e2"
        />
        <StatCard
          icon="📌" label="לביצוע" value={stats?.todo || 0}
          color="#f59e0b" bgColor="#fef3c7"
        />
      </div>

      {/* Completion Bar */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">📊 אחוז השלמה כולל</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{completionRate}%</span>
        </div>
        <div className="card-body">
          <div className="progress-bar-track" style={{ height: 16 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>✅ הושלמו: {stats?.done}</span>
            <span>⚡ בתהליך: {stats?.inProgress}</span>
            <span>📌 לביצוע: {stats?.todo}</span>
            <span>⏰ באיחור: {stats?.overdue}</span>
          </div>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚡ משימות פעילות</div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>
            הצג הכל
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-icon">🎉</div>
              <h3>אין משימות פעילות</h3>
              <p>כל המשימות הושלמו!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>משימה</th>
                    <th>פרויקט</th>
                    <th>עדיפות</th>
                    <th>סטטוס</th>
                    <th>שייך ל</th>
                    <th>תאריך יעד</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="task-project" style={{ background: task.project?.color }}>
                          {task.project?.name}
                        </span>
                      </td>
                      <td><span className={`badge badge-${task.priority.toLowerCase()}`}>{PRIORITY_MAP[task.priority]?.label}</span></td>
                      <td><span className={`badge badge-${task.status === 'IN_PROGRESS' ? 'in-progress' : task.status === 'TODO' ? 'todo' : 'done'}`}>{STATUS_MAP[task.status]?.label}</span></td>
                      <td>
                        {task.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }}>
                              {task.assignee.name.slice(0, 2)}
                            </div>
                            <span style={{ fontSize: 13 }}>{task.assignee.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                      <td>
                        {task.dueDate ? (
                          <span className={`task-due ${isOverdue(task) ? 'overdue' : ''}`}>
                            {isOverdue(task) ? '⚠️ ' : '📅 '}{formatDate(task.dueDate)}
                          </span>
                        ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, bgColor, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bgColor, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {sub && <div className="stat-change">{sub}</div>}
      </div>
    </div>
  )
}
