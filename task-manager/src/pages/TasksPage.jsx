import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Modal, { ConfirmModal } from '../components/common/Modal'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString()
}

function toInputDate(d) {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
}

export default function TasksPage() {
  const [searchParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    assigneeId: '',
    projectId: '',
    search: '',
    overdue: searchParams.get('overdue') || ''
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const toast = useToast()
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAdmin = user?.role === 'ADMIN'
  const searchTimeout = useRef(null)

  const PRIORITIES = [
    { value: '', label: t.tasks.allPriorities },
    { value: 'HIGH', label: t.tasks.high },
    { value: 'MEDIUM', label: t.tasks.medium },
    { value: 'LOW', label: t.tasks.low },
  ]
  const STATUSES = [
    { value: '', label: t.tasks.allStatuses },
    { value: 'TODO', label: t.tasks.todo },
    { value: 'IN_PROGRESS', label: t.tasks.inProgress },
    { value: 'DONE', label: t.tasks.done },
  ]

  useEffect(() => { loadInitial() }, [])

  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => loadTasks(), 400)
    return () => clearTimeout(searchTimeout.current)
  }, [filters])

  async function loadInitial() {
    try {
      const [tasksData, projectsData, usersData] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getUsers(),
      ])
      setTasks(tasksData)
      setProjects(projectsData)
      setUsers(usersData)
    } catch { toast.error(t.common.error, t.common.serverError) }
    finally { setLoading(false) }
  }

  async function loadTasks() {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.assigneeId) params.assigneeId = filters.assigneeId
    if (filters.projectId) params.projectId = filters.projectId
    if (filters.search) params.search = filters.search
    if (filters.overdue) params.overdue = filters.overdue
    const data = await api.getTasks(params)
    setTasks(data)
  }

  function openCreate() {
    setEditTask(null)
    setModalOpen(true)
  }

  function openEdit(task, e) {
    e?.stopPropagation()
    setEditTask(task)
    setModalOpen(true)
  }

  async function openDetail(task) {
    const full = await api.getTask(task.id)
    setDetailTask(full)
    setDetailOpen(true)
  }

  async function handleSaved(task, isEdit) {
    if (isEdit) {
      setTasks(ts => ts.map(t => t.id === task.id ? task : t))
    } else {
      setTasks(ts => [task, ...ts])
    }
    setModalOpen(false)
    toast.success(t.common.success, `"${task.title}"`)
  }

  async function handleDelete() {
    try {
      await api.deleteTask(deleteId)
      setTasks(ts => ts.filter(t => t.id !== deleteId))
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  async function quickStatusChange(task, status, e) {
    e.stopPropagation()
    const updated = await api.updateTask(task.id, { status })
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
    if (detailTask?.id === updated.id) setDetailTask(updated)
  }

  if (loading) return <div className="loading-spinner" />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>✅ {t.tasks.subtitle}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tasks.length} {t.tasks.count}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>{t.tasks.newTask}</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="form-control"
          style={{ flex: 1, minWidth: 200, maxWidth: 300 }}
          placeholder={t.tasks.searchPlaceholder}
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select className="filter-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="filter-select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {isAdmin && (
          <>
            <select className="filter-select" value={filters.assigneeId} onChange={e => setFilters(f => ({ ...f, assigneeId: e.target.value }))}>
              <option value="">{t.tasks.allEmployees}</option>
              {users.filter(u => u.role === 'EMPLOYEE').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select className="filter-select" value={filters.projectId} onChange={e => setFilters(f => ({ ...f, projectId: e.target.value }))}>
              <option value="">{t.tasks.allProjects}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        )}
        {(filters.status || filters.priority || filters.search || filters.assigneeId || filters.projectId) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', priority: '', assigneeId: '', projectId: '', search: '' })}>
            {t.tasks.clear}
          </button>
        )}
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>{t.tasks.noTasks}</h3>
          <button className="btn btn-primary" onClick={openCreate}>{t.tasks.newTask}</button>
        </div>
      ) : (
        <div>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              onOpen={() => openDetail(task)}
              onEdit={e => openEdit(task, e)}
              onDelete={e => { e.stopPropagation(); setDeleteId(task.id) }}
              onStatusChange={(status, e) => quickStatusChange(task, status, e)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editTask={editTask}
        projects={projects}
        users={users}
        isAdmin={isAdmin}
        currentUser={user}
        onSaved={handleSaved}
        toast={toast}
      />

      {/* Detail Modal */}
      <TaskDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        task={detailTask}
        setTask={setDetailTask}
        isAdmin={isAdmin}
        currentUser={user}
        onEdit={t => { setDetailOpen(false); openEdit(t) }}
        toast={toast}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t.tasks.deleteTask}
        message={t.tasks.deleteConfirm}
      />
    </div>
  )
}

/* ── Task Card ── */
function TaskCard({ task, isAdmin, currentUserId, onOpen, onEdit, onDelete, onStatusChange }) {
  const { t } = useLanguage()
  const canEdit = isAdmin || task.assigneeId === currentUserId

  const priorityColor = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--success)' }
  const priorityLabel = { HIGH: t.tasks.high, MEDIUM: t.tasks.medium, LOW: t.tasks.low }
  const statusLabel = { TODO: t.tasks.todo, IN_PROGRESS: t.tasks.inProgress, DONE: t.tasks.done }
  const statusBadge = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' }
  const overdue = isOverdue(task)
  const daysDiff = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / 86400000) : null

  return (
    <div
      className={`task-card priority-${task.priority.toLowerCase()}`}
      onClick={onOpen}
    >
      <div className="task-card-header">
        <div style={{ flex: 1 }}>
          <div className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>
            {task.status === 'DONE' ? '✅ ' : ''}{task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              {task.description.slice(0, 100)}{task.description.length > 100 ? '...' : ''}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="task-actions">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit}>✏️</button>
            {isAdmin && <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete}>🗑️</button>}
          </div>
        )}
      </div>

      <div className="task-meta">
        <span className={`badge badge-${task.priority.toLowerCase()}`}>{priorityLabel[task.priority]}</span>
        <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>

        {task.project && (
          <span className="task-project" style={{ background: task.project.color }}>
            {task.project.name}
          </span>
        )}

        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue' : daysDiff !== null && daysDiff <= 3 ? 'soon' : ''}`}>
            {overdue ? '⚠️' : '📅'} {formatDate(task.dueDate)}
            {overdue && ` (${t.tasks.overdue})`}
            {!overdue && daysDiff !== null && daysDiff <= 3 && daysDiff >= 0 && ` (${daysDiff}d)`}
          </span>
        )}

        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 'auto' }}>
            <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }}>
              {task.assignee.name.slice(0, 2)}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{task.assignee.name}</span>
          </div>
        )}

        {(task._count?.comments > 0 || task._count?.attachments > 0) && (
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-light)', marginRight: 4 }}>
            {task._count?.comments > 0 && <span>💬 {task._count.comments}</span>}
            {task._count?.attachments > 0 && <span>📎 {task._count.attachments}</span>}
          </div>
        )}
      </div>

      {/* Quick status buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        {['TODO', 'IN_PROGRESS', 'DONE'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${task.status === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={e => onStatusChange(s, e)}
          >
            {s === 'TODO' ? '📌' : s === 'IN_PROGRESS' ? '⚡' : '✅'} {statusLabel[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Task Form Modal ── */
function TaskFormModal({ isOpen, onClose, editTask, projects, users, isAdmin, currentUser, onSaved, toast }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', status: 'TODO',
    dueDate: '', projectId: '', assigneeId: ''
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editTask) {
        setForm({
          title: editTask.title || '',
          description: editTask.description || '',
          priority: editTask.priority || 'MEDIUM',
          status: editTask.status || 'TODO',
          dueDate: toInputDate(editTask.dueDate),
          projectId: editTask.projectId?.toString() || '',
          assigneeId: editTask.assigneeId?.toString() || ''
        })
      } else {
        setForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', projectId: projects[0]?.id?.toString() || '', assigneeId: '' })
      }
    }
  }, [isOpen, editTask])

  async function handleAI() {
    if (!form.title) { toast.warning(t.common.error, t.tasks.taskTitle + ' ' + t.common.required); return }
    setAiLoading(true)
    try {
      const project = projects.find(p => p.id === parseInt(form.projectId))
      const result = await api.generateDescription(form.title, project?.name)
      setForm(f => ({ ...f, description: result.description }))
      toast.success('AI')
    } catch (err) {
      toast.error('AI', err.message)
    } finally { setAiLoading(false) }
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error(t.common.error, t.tasks.titleRequired); return }
    if (!form.projectId) { toast.error(t.common.error, t.common.required); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        projectId: parseInt(form.projectId),
        assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
        dueDate: form.dueDate || null,
      }
      let task
      if (editTask) {
        task = await api.updateTask(editTask.id, payload)
      } else {
        task = await api.createTask(payload)
      }
      onSaved(task, !!editTask)
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTask ? t.tasks.editTask : t.tasks.createTask}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '...' : editTask ? t.common.save : t.tasks.newTask}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">{t.tasks.taskTitle} <span className="required">*</span></label>
        <input
          className="form-control"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="form-label" style={{ margin: 0 }}>{t.tasks.description}</label>
          <button className="ai-btn" onClick={handleAI} disabled={aiLoading} type="button">
            {aiLoading ? <span className="spinner">⟳</span> : '✨'} Claude AI
          </button>
        </div>
        <textarea
          className="form-control"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t.tasks.priority}</label>
          <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            <option value="HIGH">🔴 {t.tasks.high}</option>
            <option value="MEDIUM">🟡 {t.tasks.medium}</option>
            <option value="LOW">🟢 {t.tasks.low}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t.tasks.status}</label>
          <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="TODO">📌 {t.tasks.todo}</option>
            <option value="IN_PROGRESS">⚡ {t.tasks.inProgress}</option>
            <option value="DONE">✅ {t.tasks.done}</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t.dashboard.project} <span className="required">*</span></label>
          <select className="form-control" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
            <option value=""></option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t.tasks.dueDate}</label>
          <input
            type="date"
            className="form-control"
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="form-group">
          <label className="form-label">{t.tasks.assignee}</label>
          <select className="form-control" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
            <option value="">{t.tasks.unassigned}</option>
            {users.filter(u => u.role === 'EMPLOYEE').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
    </Modal>
  )
}

/* ── Task Detail Modal ── */
function TaskDetailModal({ isOpen, onClose, task, setTask, isAdmin, currentUser, onEdit, toast }) {
  const { t } = useLanguage()
  const [comment, setComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  if (!task) return null

  const statusLabel = { TODO: t.tasks.todo, IN_PROGRESS: t.tasks.inProgress, DONE: t.tasks.done }
  const priorityLabel = { HIGH: t.tasks.high, MEDIUM: t.tasks.medium, LOW: t.tasks.low }
  const overdue = isOverdue(task)
  const canEdit = isAdmin || task.assigneeId === currentUser?.id

  async function handleComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setAddingComment(true)
    try {
      const newComment = await api.addComment(task.id, comment)
      setTask(t => ({ ...t, comments: [...(t.comments || []), newComment] }))
      setComment('')
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setAddingComment(false) }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api.deleteComment(commentId)
      setTask(t => ({ ...t, comments: t.comments.filter(c => c.id !== commentId) }))
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  async function handleFileUpload(e) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('files', f))
      const atts = await api.uploadFiles(task.id, fd)
      setTask(t => ({ ...t, attachments: [...(t.attachments || []), ...atts] }))
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleDeleteAttachment(id) {
    try {
      await api.deleteAttachment(id)
      setTask(t => ({ ...t, attachments: t.attachments.filter(a => a.id !== id) }))
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  function getFileIcon(mime = '') {
    if (mime.includes('image')) return '🖼️'
    if (mime.includes('pdf')) return '📄'
    if (mime.includes('word') || mime.includes('doc')) return '📝'
    if (mime.includes('excel') || mime.includes('xls') || mime.includes('spreadsheet')) return '📊'
    return '📎'
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.tasks.title} size="modal-lg"
      footer={
        <>
          {canEdit && <button className="btn btn-secondary" onClick={() => onEdit(task)}>✏️ {t.common.edit}</button>}
          <button className="btn btn-primary" onClick={onClose}>{t.common.close}</button>
        </>
      }
    >
      {/* Header info */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{task.title}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className={`badge badge-${task.priority?.toLowerCase()}`}>{priorityLabel[task.priority]}</span>
          <span className={`badge badge-${task.status === 'IN_PROGRESS' ? 'in-progress' : task.status === 'TODO' ? 'todo' : 'done'}`}>{statusLabel[task.status]}</span>
          {task.project && <span className="task-project" style={{ background: task.project.color }}>{task.project.name}</span>}
          {task.dueDate && (
            <span className={`task-due ${overdue ? 'overdue' : ''}`} style={{ fontSize: 13 }}>
              {overdue ? '⚠️' : '📅'} {formatDate(task.dueDate)}{overdue ? ` (${t.tasks.overdue})` : ''}
            </span>
          )}
        </div>
        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor }}>{task.assignee.name.slice(0, 2)}</div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{task.assignee.name}</span>
          </div>
        )}
      </div>

      {task.description && (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{task.description}</p>
        </div>
      )}

      <hr className="divider" />

      {/* Attachments */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ fontWeight: 700 }}>📎 {t.tasks.attachments} ({task.attachments?.length || 0})</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? '...' : '⬆️'}
          </button>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
        {task.attachments?.length === 0 && <p style={{ color: 'var(--text-light)', fontSize: 13 }}>{t.common.noData}</p>}
        {task.attachments?.map(att => (
          <div key={att.id} className="file-item">
            <span style={{ fontSize: 20 }}>{getFileIcon(att.mimetype)}</span>
            <a
              href={`/uploads/${att.filename}`}
              target="_blank" rel="noreferrer"
              className="file-name"
              style={{ color: 'var(--primary)' }}
              onClick={e => e.stopPropagation()}
            >
              {att.originalName}
            </a>
            <span className="file-size">{formatSize(att.size)}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteAttachment(att.id)}>🗑️</button>
          </div>
        ))}
      </div>

      <hr className="divider" />

      {/* Comments */}
      <div>
        <h4 style={{ fontWeight: 700, marginBottom: 12 }}>💬 {t.tasks.comments} ({task.comments?.length || 0})</h4>
        {task.comments?.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div className="avatar avatar-sm" style={{ background: c.user.avatarColor, flexShrink: 0 }}>{c.user.name.slice(0, 2)}</div>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: 13 }}>{c.user.name}</strong>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  {(isAdmin || c.userId === currentUser?.id) && (
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 12 }} onClick={() => handleDeleteComment(c.id)}>✕</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.content}</p>
            </div>
          </div>
        ))}

        <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <textarea
            className="form-control"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t.tasks.addComment}
            rows={2}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={addingComment || !comment.trim()} style={{ alignSelf: 'flex-end' }}>
            {t.common.add}
          </button>
        </form>
      </div>
    </Modal>
  )
}
