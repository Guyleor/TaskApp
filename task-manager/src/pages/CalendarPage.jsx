import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const toast = useToast()
  const { t } = useLanguage()

  useEffect(() => { loadTasks() }, [year, month])

  async function loadTasks() {
    setLoading(true)
    try {
      const data = await api.getCalendarTasks(year, month)
      setTasks(data)
    } catch { toast.error(t.common.error, t.common.serverError) }
    finally { setLoading(false) }
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function getDaysInMonth(y, m) { return new Date(y, m, 0).getDate() }
  function getFirstDayOfMonth(y, m) { return new Date(y, m - 1, 1).getDay() }

  function getTasksForDay(day) {
    return tasks.filter(t => {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day
    })
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const today = new Date()

  function isToday(day) {
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day
  }

  const statusLabel = { TODO: t.tasks.todo, IN_PROGRESS: t.tasks.inProgress, DONE: t.tasks.done }
  const priorityLabel = { HIGH: t.tasks.high, MEDIUM: t.tasks.medium, LOW: t.tasks.low }
  const priorityColors = [
    { color: '#ef4444', label: t.tasks.high },
    { color: '#f59e0b', label: t.tasks.medium },
    { color: '#10b981', label: t.tasks.low },
  ]

  return (
    <div>
      <div className="calendar-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-icon" onClick={prevMonth}>‹</button>
          <div className="calendar-month">{t.calendar.months[month - 1]} {year}</div>
          <button className="btn btn-secondary btn-icon" onClick={nextMonth}>›</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }}>
            📅 {t.calendar.today}
          </button>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            {tasks.length} {t.tasks.count}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {priorityColors.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {loading ? <div className="loading-spinner" /> : (
        <div className="calendar-grid">
          {t.calendar.days.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {Array.from({ length: totalCells }, (_, i) => {
            const day = i - firstDay + 1
            const isValid = day >= 1 && day <= daysInMonth
            const dayTasks = isValid ? getTasksForDay(day) : []
            return (
              <div key={i} className={`calendar-day ${!isValid ? 'other-month' : ''} ${isValid && isToday(day) ? 'today' : ''}`}>
                {isValid && (
                  <>
                    <div className="day-number">{day}</div>
                    {dayTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="calendar-task"
                        style={{
                          background: task.priority === 'HIGH' ? '#ef4444' : task.priority === 'MEDIUM' ? '#f59e0b' : '#10b981',
                          opacity: task.status === 'DONE' ? 0.6 : 1
                        }}
                        title={`${task.title} - ${statusLabel[task.status]}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        {task.status === 'DONE' ? '✓ ' : ''}{task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 4px' }}>
                        +{dayTasks.length - 3}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t.tasks.title}</h2>
              <button className="modal-close" onClick={() => setSelectedTask(null)}>×</button>
            </div>
            <div className="modal-body">
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>{selectedTask.title}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className={`badge badge-${selectedTask.priority?.toLowerCase()}`}>{priorityLabel[selectedTask.priority]}</span>
                <span className={`badge badge-${selectedTask.status === 'IN_PROGRESS' ? 'in-progress' : selectedTask.status === 'TODO' ? 'todo' : 'done'}`}>
                  {statusLabel[selectedTask.status]}
                </span>
                {selectedTask.project && (
                  <span className="task-project" style={{ background: selectedTask.project.color }}>{selectedTask.project.name}</span>
                )}
              </div>
              {selectedTask.assignee && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>👤 {selectedTask.assignee.name}</p>
              )}
              {selectedTask.dueDate && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                  📅 {t.tasks.dueDate}: {new Date(selectedTask.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
