import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [statsData, tasksData] = await Promise.all([
        api.getTaskStats(),
        api.getTasks({ status: 'IN_PROGRESS' })
      ])
      setStats(statsData)
      setTasks(tasksData.slice(0, 6))
    } catch {
      toast.error(t.common.error, t.common.serverError)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString()
  }

  function isOverdue(task) {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  }

  if (loading) return <div className="loading-spinner" />

  const completionRate = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const PRIORITY_MAP = {
    HIGH: t.tasks.high, MEDIUM: t.tasks.medium, LOW: t.tasks.low
  }
  const STATUS_MAP = {
    TODO: t.tasks.todo, IN_PROGRESS: t.tasks.inProgress, DONE: t.tasks.done
  }

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="📋" label={t.dashboard.total} value={stats?.total || 0}
          color="#6366f1" bgColor="#ede9fe" onClick={() => navigate('/tasks')} />
        <StatCard icon="✅" label={t.dashboard.done} value={stats?.done || 0}
          color="#10b981" bgColor="#d1fae5" sub={`${completionRate}${t.dashboard.completionRate}`}
          onClick={() => navigate('/tasks?status=DONE')} />
        <StatCard icon="⚡" label={t.dashboard.inProgress} value={stats?.inProgress || 0}
          color="#3b82f6" bgColor="#dbeafe" onClick={() => navigate('/tasks?status=IN_PROGRESS')} />
        <StatCard icon="⏰" label={t.dashboard.overdue} value={stats?.overdue || 0}
          color="#ef4444" bgColor="#fee2e2" onClick={() => navigate('/tasks?overdue=true')} />
        <StatCard icon="📌" label={t.dashboard.todo} value={stats?.todo || 0}
          color="#f59e0b" bgColor="#fef3c7" onClick={() => navigate('/tasks?status=TODO')} />
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">{t.dashboard.overallCompletion}</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{completionRate}%</span>
        </div>
        <div className="card-body">
          <div className="progress-bar-track" style={{ height: 16 }}>
            <div className="progress-bar-fill"
              style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>✅ {t.dashboard.done}: {stats?.done}</span>
            <span>⚡ {t.dashboard.inProgress}: {stats?.inProgress}</span>
            <span>📌 {t.dashboard.todo}: {stats?.todo}</span>
            <span>⏰ {t.dashboard.overdue}: {stats?.overdue}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">{t.dashboard.activeTasks}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>
            {t.dashboard.showAll}
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-icon">🎉</div>
              <h3>{t.dashboard.noActiveTasks}</h3>
              <p>{t.dashboard.allDone}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t.dashboard.task}</th>
                    <th>{t.dashboard.project}</th>
                    <th>{t.dashboard.priority}</th>
                    <th>{t.dashboard.status}</th>
                    <th>{t.dashboard.assignedTo}</th>
                    <th>{t.dashboard.dueDate}</th>
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
                      <td><span className={`badge badge-${task.priority.toLowerCase()}`}>{PRIORITY_MAP[task.priority]}</span></td>
                      <td><span className={`badge badge-${task.status === 'IN_PROGRESS' ? 'in-progress' : task.status === 'TODO' ? 'todo' : 'done'}`}>{STATUS_MAP[task.status]}</span></td>
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

function StatCard({ icon, label, value, color, bgColor, sub, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: bgColor, color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {sub && <div className="stat-change">{sub}</div>}
      </div>
      {onClick && <div style={{ color: 'var(--text-light)', fontSize: 18, marginRight: 'auto' }}>›</div>}
    </div>
  )
}
