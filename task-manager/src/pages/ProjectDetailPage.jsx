import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import Modal, { ConfirmModal } from '../components/common/Modal'

const STATUS_LABEL = { TODO: 'לביצוע', IN_PROGRESS: 'בתהליך', DONE: 'הושלם' }
const STATUS_BADGE = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' }
const PRIORITY_LABEL = { HIGH: 'גבוהה', MEDIUM: 'בינונית', LOW: 'נמוכה' }
const PRIORITY_BADGE = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }

function toInputDate(d) {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState('ALL')

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTaskId, setDeleteTaskId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    try {
      const [projects, tasksData, usersData] = await Promise.all([
        api.getProjects(),
        api.getTasks({ projectId: id }),
        api.getUsers(),
      ])
      const found = projects.find(p => p.id === parseInt(id))
      if (!found) { toast.error('שגיאה', 'פרויקט לא נמצא'); navigate('/projects'); return }
      setProject(found)
      setTasks(tasksData)
      setUsers(usersData)
    } catch {
      toast.error('שגיאה', 'לא ניתן לטעון פרויקט')
    } finally {
      setLoading(false)
    }
  }

  // Unique team members from assigned tasks
  const teamMembers = Object.values(
    tasks.reduce((acc, t) => {
      if (t.assignee) acc[t.assignee.id] = t.assignee
      return acc
    }, {})
  )

  // Stats
  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'DONE').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
  }
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const filteredTasks = taskFilter === 'ALL' ? tasks : tasks.filter(t => t.status === taskFilter)

  async function handleTaskSaved(task, isEdit) {
    if (isEdit) {
      setTasks(ts => ts.map(t => t.id === task.id ? task : t))
    } else {
      setTasks(ts => [task, ...ts])
    }
    setTaskModalOpen(false)
    toast.success(isEdit ? 'עודכן' : 'נוצר', `"${task.title}" ${isEdit ? 'עודכנה' : 'נוצרה'}`)
  }

  async function handleDeleteTask() {
    try {
      await api.deleteTask(deleteTaskId)
      setTasks(ts => ts.filter(t => t.id !== deleteTaskId))
      toast.success('נמחק')
    } catch (err) { toast.error('שגיאה', err.message) }
  }

  async function quickStatus(task, status, e) {
    e.stopPropagation()
    const updated = await api.updateTask(task.id, { status })
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  async function openDetail(task) {
    const full = await api.getTask(task.id)
    setSelectedTask(full)
    setDetailOpen(true)
  }

  if (loading) return <div className="loading-spinner" />
  if (!project) return null

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/projects')} title="חזרה לפרויקטים">
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: project.color + '25',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
            }}>📁</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color }} />
              </div>
              {project.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{project.description}</p>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setTaskModalOpen(true) }}>
            ＋ משימה חדשה
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { icon: '📋', label: 'סה״כ משימות', value: stats.total, color: project.color, bg: project.color + '20' },
          { icon: '✅', label: 'הושלמו', value: stats.done, color: '#10b981', bg: '#d1fae5' },
          { icon: '⚡', label: 'בתהליך', value: stats.inProgress, color: '#3b82f6', bg: '#dbeafe' },
          { icon: '📌', label: 'לביצוע', value: stats.todo, color: '#f59e0b', bg: '#fef3c7' },
          { icon: '⏰', label: 'באיחור', value: stats.overdue, color: '#ef4444', bg: '#fee2e2' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        {/* Tasks column */}
        <div>
          {/* Progress + filter */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>התקדמות פרויקט</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: project.color }}>{progress}%</span>
              </div>
              <div className="progress-bar-track" style={{ height: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%`, background: project.color }} />
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { key: 'ALL', label: `הכל (${stats.total})` },
              { key: 'TODO', label: `לביצוע (${stats.todo})` },
              { key: 'IN_PROGRESS', label: `בתהליך (${stats.inProgress})` },
              { key: 'DONE', label: `הושלם (${stats.done})` },
            ].map(f => (
              <button
                key={f.key}
                className={`btn btn-sm ${taskFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task list */}
          {filteredTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-icon">📋</div>
              <h3>אין משימות</h3>
              {isAdmin && (
                <button className="btn btn-primary" onClick={() => setTaskModalOpen(true)}>
                  ＋ משימה חדשה
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                projectColor={project.color}
                isAdmin={isAdmin}
                currentUserId={user?.id}
                onOpen={() => openDetail(task)}
                onEdit={e => { e.stopPropagation(); setEditTask(task); setTaskModalOpen(true) }}
                onDelete={e => { e.stopPropagation(); setDeleteTaskId(task.id) }}
                onStatus={(s, e) => quickStatus(task, s, e)}
              />
            ))
          )}
        </div>

        {/* Sidebar: Team */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">👥 צוות הפרויקט</div>
              <span style={{
                background: project.color + '20', color: project.color,
                borderRadius: 20, padding: '2px 10px',
                fontSize: 12, fontWeight: 700
              }}>{teamMembers.length}</span>
            </div>
            <div style={{ padding: '8px 16px 16px' }}>
              {teamMembers.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  אין עובדים מוקצים עדיין
                </p>
              ) : teamMembers.map(m => {
                const memberTasks = tasks.filter(t => t.assigneeId === m.id)
                const memberDone = memberTasks.filter(t => t.status === 'DONE').length
                const memberPct = memberTasks.length > 0 ? Math.round((memberDone / memberTasks.length) * 100) : 0
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div className="avatar" style={{ background: m.avatarColor }}>
                      {m.name.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        <span>{memberTasks.length} משימות</span>
                        <span style={{ color: project.color, fontWeight: 700 }}>{memberPct}%</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 5 }}>
                        <div className="progress-bar-fill" style={{ width: `${memberPct}%`, background: project.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mini task breakdown per member */}
          {teamMembers.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <div className="card-title">📊 פירוט משימות</div>
              </div>
              <div style={{ padding: '8px 16px 16px' }}>
                {teamMembers.map(m => {
                  const mt = tasks.filter(t => t.assigneeId === m.id)
                  return (
                    <div key={m.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div className="avatar avatar-sm" style={{ background: m.avatarColor }}>{m.name.slice(0, 2)}</div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{m.name.split(' ')[0]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingRight: 4 }}>
                        {[
                          { key: 'TODO', color: '#f59e0b', bg: '#fef3c7', label: 'לביצוע' },
                          { key: 'IN_PROGRESS', color: '#3b82f6', bg: '#dbeafe', label: 'בתהליך' },
                          { key: 'DONE', color: '#10b981', bg: '#d1fae5', label: 'הושלם' },
                        ].map(s => {
                          const cnt = mt.filter(t => t.status === s.key).length
                          if (cnt === 0) return null
                          return (
                            <span key={s.key} style={{
                              background: s.bg, color: s.color,
                              borderRadius: 12, padding: '2px 8px',
                              fontSize: 11, fontWeight: 700
                            }}>
                              {cnt} {s.label}
                            </span>
                          )
                        })}
                        {mt.length === 0 && <span style={{ color: 'var(--text-light)', fontSize: 12 }}>אין משימות</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        editTask={editTask}
        projectId={parseInt(id)}
        projectName={project.name}
        users={users}
        isAdmin={isAdmin}
        currentUser={user}
        onSaved={handleTaskSaved}
        toast={toast}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          task={selectedTask}
          setTask={setSelectedTask}
          isAdmin={isAdmin}
          currentUser={user}
          onEdit={t => { setDetailOpen(false); setEditTask(t); setTaskModalOpen(true) }}
          toast={toast}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="מחיקת משימה"
        message="האם אתה בטוח שברצונך למחוק משימה זו?"
      />
    </div>
  )
}

/* ── Task Row ── */
function TaskRow({ task, projectColor, isAdmin, currentUserId, onOpen, onEdit, onDelete, onStatus }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  const daysDiff = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / 86400000) : null

  return (
    <div
      className={`task-card priority-${task.priority.toLowerCase()}`}
      onClick={onOpen}
      style={{ marginBottom: 10 }}
    >
      <div className="task-card-header">
        <div style={{ flex: 1 }}>
          <div className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>
            {task.status === 'DONE' ? '✅ ' : ''}{task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              {task.description.slice(0, 90)}{task.description.length > 90 ? '...' : ''}
            </div>
          )}
        </div>
        {(isAdmin || task.assigneeId === currentUserId) && (
          <div className="task-actions">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit}>✏️</button>
            {isAdmin && <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete}>🗑️</button>}
          </div>
        )}
      </div>

      <div className="task-meta">
        <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
        <span className={`badge ${STATUS_BADGE[task.status]}`}>{STATUS_LABEL[task.status]}</span>

        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue' : daysDiff !== null && daysDiff <= 3 && daysDiff >= 0 ? 'soon' : ''}`}>
            {overdue ? '⚠️' : '📅'} {new Date(task.dueDate).toLocaleDateString('he-IL')}
            {overdue && ' (באיחור)'}
          </span>
        )}

        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 'auto' }}>
            <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }}>
              {task.assignee.name.slice(0, 2)}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{task.assignee.name}</span>
          </div>
        )}

        {(task._count?.comments > 0 || task._count?.attachments > 0) && (
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-light)' }}>
            {task._count?.comments > 0 && <span>💬 {task._count.comments}</span>}
            {task._count?.attachments > 0 && <span>📎 {task._count.attachments}</span>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        {['TODO', 'IN_PROGRESS', 'DONE'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${task.status === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px', background: task.status === s ? projectColor : '' , borderColor: task.status === s ? projectColor : '' }}
            onClick={e => onStatus(s, e)}
          >
            {s === 'TODO' ? '📌' : s === 'IN_PROGRESS' ? '⚡' : '✅'} {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Task Form Modal ── */
function TaskFormModal({ isOpen, onClose, editTask, projectId, projectName, users, isAdmin, currentUser, onSaved, toast }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' })
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [existingAtts, setExistingAtts] = useState([])
  const [deletingAtt, setDeletingAtt] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) { setPendingFiles([]); setExistingAtts([]); return }
    if (editTask) {
      setForm({
        title: editTask.title || '',
        description: editTask.description || '',
        priority: editTask.priority || 'MEDIUM',
        status: editTask.status || 'TODO',
        dueDate: toInputDate(editTask.dueDate),
        assigneeId: editTask.assigneeId?.toString() || ''
      })
      api.getTask(editTask.id).then(t => setExistingAtts(t.attachments || [])).catch(() => {})
    } else {
      setForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' })
      setExistingAtts([])
    }
    setPendingFiles([])
  }, [isOpen, editTask])

  async function handleAI() {
    if (!form.title) { toast.warning('שים לב', 'נדרשת כותרת'); return }
    setAiLoading(true)
    try {
      const res = await api.generateDescription(form.title, projectName)
      setForm(f => ({ ...f, description: res.description }))
      toast.success('AI', 'תיאור נוצר!')
    } catch (err) { toast.error('שגיאת AI', err.message) }
    finally { setAiLoading(false) }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files)
    setPendingFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  function removePending(idx) {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleDeleteExisting(attId) {
    setDeletingAtt(attId)
    try {
      await api.deleteAttachment(attId)
      setExistingAtts(prev => prev.filter(a => a.id !== attId))
    } catch (err) { toast.error('שגיאה', err.message) }
    finally { setDeletingAtt(null) }
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('שגיאה', 'כותרת חובה'); return }
    setSaving(true)
    try {
      const payload = { ...form, projectId, assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null, dueDate: form.dueDate || null }
      let task = editTask ? await api.updateTask(editTask.id, payload) : await api.createTask(payload)
      if (pendingFiles.length) {
        const fd = new FormData()
        pendingFiles.forEach(f => fd.append('files', f))
        await api.uploadFiles(task.id, fd)
        task = await api.getTask(task.id)
      }
      onSaved(task, !!editTask)
    } catch (err) { toast.error('שגיאה', err.message) }
    finally { setSaving(false) }
  }

  function fileIcon(f) {
    const type = f.type || f.mimetype || ''
    if (type.includes('image')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('doc')) return '📝'
    if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return '📊'
    return '📎'
  }

  function formatSize(b) {
    if (b < 1024) return b + ' B'
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }

  const totalFiles = existingAtts.length + pendingFiles.length

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={editTask ? '✏️ עריכת משימה' : '➕ משימה חדשה'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'שומר...' : editTask ? 'שמור' : 'צור'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">כותרת <span className="required">*</span></label>
        <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="שם המשימה" autoFocus />
      </div>
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="form-label" style={{ margin: 0 }}>תיאור</label>
          <button className="ai-btn" onClick={handleAI} disabled={aiLoading} type="button">
            {aiLoading ? <span className="spinner">⟳</span> : '✨'} Claude AI
          </button>
        </div>
        <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="תיאור..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">עדיפות</label>
          <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            <option value="HIGH">🔴 גבוהה</option>
            <option value="MEDIUM">🟡 בינונית</option>
            <option value="LOW">🟢 נמוכה</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">סטטוס</label>
          <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="TODO">📌 לביצוע</option>
            <option value="IN_PROGRESS">⚡ בתהליך</option>
            <option value="DONE">✅ הושלם</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">תאריך יעד</label>
          <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
        {isAdmin && (
          <div className="form-group">
            <label className="form-label">הקצה לעובד</label>
            <select className="form-control" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
              <option value="">לא מוקצה</option>
              {users.filter(u => u.role === 'EMPLOYEE').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* File attachments */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="form-label" style={{ margin: 0 }}>
            📎 קבצים מצורפים {totalFiles > 0 && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>({totalFiles})</span>}
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            ＋ הוסף קבצים
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {/* Drop zone hint when empty */}
        {totalFiles === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 10,
              padding: '18px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--text-light)',
              fontSize: 13,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            🖼️ תמונות &nbsp;·&nbsp; 📄 PDF &nbsp;·&nbsp; 📊 Excel &nbsp;·&nbsp; 📎 כל קובץ
            <div style={{ marginTop: 4, fontSize: 12 }}>לחץ לבחירת קבצים</div>
          </div>
        )}

        {/* Existing attachments (edit mode) */}
        {existingAtts.map(a => (
          <div key={a.id} className="file-item" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{fileIcon(a)}</span>
            <a href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer"
              className="file-name" style={{ color: 'var(--primary)', flex: 1, fontSize: 13 }}
              onClick={e => e.stopPropagation()}>
              {a.originalName}
            </a>
            <span className="file-size" style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatSize(a.size)}</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              disabled={deletingAtt === a.id}
              onClick={() => handleDeleteExisting(a.id)}
              title="הסר קובץ"
            >🗑️</button>
          </div>
        ))}

        {/* Pending new files */}
        {pendingFiles.map((f, i) => (
          <div key={i} className="file-item" style={{ marginBottom: 6, background: 'var(--primary)10', border: '1px solid var(--primary)30', borderRadius: 8, padding: '8px 12px' }}>
            <span style={{ fontSize: 16 }}>{fileIcon(f)}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatSize(f.size)}</span>
            <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', borderRadius: 10, padding: '2px 7px', fontWeight: 600 }}>חדש</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => removePending(i)}
              title="הסר"
            >✕</button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

/* ── Task Detail Modal (comments + attachments) ── */
function TaskDetailModal({ isOpen, onClose, task, setTask, isAdmin, currentUser, onEdit, toast }) {
  const [comment, setComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = { current: null }

  if (!task) return null

  async function handleComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setAddingComment(true)
    try {
      const c = await api.addComment(task.id, comment)
      setTask(t => ({ ...t, comments: [...(t.comments || []), c] }))
      setComment('')
    } catch (err) { toast.error('שגיאה', err.message) }
    finally { setAddingComment(false) }
  }

  async function handleDeleteComment(cid) {
    try {
      await api.deleteComment(cid)
      setTask(t => ({ ...t, comments: t.comments.filter(c => c.id !== cid) }))
    } catch (err) { toast.error('שגיאה', err.message) }
  }

  async function handleFiles(e) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('files', f))
      const atts = await api.uploadFiles(task.id, fd)
      setTask(t => ({ ...t, attachments: [...(t.attachments || []), ...atts] }))
      toast.success('הועלה', `${files.length} קבצים`)
    } catch (err) { toast.error('שגיאה', err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleDeleteAtt(aid) {
    try {
      await api.deleteAttachment(aid)
      setTask(t => ({ ...t, attachments: t.attachments.filter(a => a.id !== aid) }))
    } catch (err) { toast.error('שגיאה', err.message) }
  }

  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  function formatSize(b) {
    if (b < 1024) return b + ' B'
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }

  function fileIcon(m = '') {
    if (m.includes('image')) return '🖼️'
    if (m.includes('pdf')) return '📄'
    return '📎'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="פרטי משימה" size="modal-lg"
      footer={
        <>
          {(isAdmin || task.assigneeId === currentUser?.id) && (
            <button className="btn btn-secondary" onClick={() => onEdit(task)}>✏️ עריכה</button>
          )}
          <button className="btn btn-primary" onClick={onClose}>סגור</button>
        </>
      }
    >
      <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{task.title}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
        <span className={`badge ${STATUS_BADGE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue' : ''}`} style={{ fontSize: 13 }}>
            {overdue ? '⚠️' : '📅'} {new Date(task.dueDate).toLocaleDateString('he-IL')}
          </span>
        )}
        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }}>{task.assignee.name.slice(0, 2)}</div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{task.assignee.name}</span>
          </div>
        )}
      </div>
      {task.description && (
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{task.description}</p>
        </div>
      )}
      <hr className="divider" />
      {/* Attachments */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ fontWeight: 700 }}>📎 קבצים ({task.attachments?.length || 0})</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? '...' : '⬆️ העלה'}
          </button>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
        </div>
        {task.attachments?.length === 0 && <p style={{ color: 'var(--text-light)', fontSize: 13 }}>אין קבצים</p>}
        {task.attachments?.map(a => (
          <div key={a.id} className="file-item">
            <span style={{ fontSize: 18 }}>{fileIcon(a.mimetype)}</span>
            <a href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer" className="file-name" style={{ color: 'var(--primary)' }} onClick={e => e.stopPropagation()}>
              {a.originalName}
            </a>
            <span className="file-size">{formatSize(a.size)}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteAtt(a.id)}>🗑️</button>
          </div>
        ))}
      </div>
      <hr className="divider" />
      {/* Comments */}
      <div>
        <h4 style={{ fontWeight: 700, marginBottom: 10 }}>💬 הערות ({task.comments?.length || 0})</h4>
        {task.comments?.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div className="avatar avatar-sm" style={{ background: c.user.avatarColor, flexShrink: 0 }}>{c.user.name.slice(0, 2)}</div>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <strong style={{ fontSize: 12 }}>{c.user.name}</strong>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{new Date(c.createdAt).toLocaleDateString('he-IL')}</span>
                  {(isAdmin || c.userId === currentUser?.id) && (
                    <button className="btn btn-ghost btn-sm" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => handleDeleteComment(c.id)}>✕</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{c.content}</p>
            </div>
          </div>
        ))}
        <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} placeholder="הוסף הערה..." rows={2} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={addingComment || !comment.trim()} style={{ alignSelf: 'flex-end' }}>שלח</button>
        </form>
      </div>
    </Modal>
  )
}
