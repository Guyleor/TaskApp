import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Modal, { ConfirmModal } from '../components/common/Modal'

function fileIcon(mimetype = '', name = '') {
  if (mimetype.includes('image')) return '🖼️'
  if (mimetype.includes('pdf')) return '📄'
  if (mimetype.includes('word') || mimetype.includes('doc') || name.endsWith('.doc') || name.endsWith('.docx')) return '📝'
  if (mimetype.includes('sheet') || mimetype.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return '📊'
  if (mimetype.includes('zip') || mimetype.includes('rar')) return '🗜️'
  return '📎'
}

function formatSize(b) {
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}

function toInputDate(d) {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { t } = useLanguage()
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
  const [projectFiles, setProjectFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [templates, setTemplates] = useState([])
  const projectFileRef = useRef(null)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    try {
      const [projects, tasksData, usersData, filesData, templatesData] = await Promise.all([
        api.getProjects(),
        api.getTasks({ projectId: id }),
        api.getUsers(),
        api.getProjectFiles(id),
        api.getTemplates(),
      ])
      const found = projects.find(p => p.id === parseInt(id))
      if (!found) { toast.error(t.common.error, t.common.serverError); navigate('/projects'); return }
      setProject(found)
      setTasks(tasksData)
      setUsers(usersData)
      setProjectFiles(filesData)
      setTemplates(templatesData)
    } catch {
      toast.error(t.common.error, t.common.serverError)
    } finally {
      setLoading(false)
    }
  }

  async function handleProjectFileUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadingFiles(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      const created = await api.uploadProjectFiles(id, fd)
      setProjectFiles(prev => [...created, ...prev])
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setUploadingFiles(false); e.target.value = '' }
  }

  async function handleDeleteProjectFile(fileId) {
    try {
      await api.deleteProjectFile(id, fileId)
      setProjectFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  // Unique team members from assigned tasks
  const teamMembers = Object.values(
    tasks.reduce((acc, task) => {
      if (task.assignee) acc[task.assignee.id] = task.assignee
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

  const filteredTasks = taskFilter === 'ALL' ? tasks : tasks.filter(task => task.status === taskFilter)

  async function handleTaskSaved(task, isEdit) {
    if (isEdit) {
      setTasks(ts => ts.map(t => t.id === task.id ? task : t))
    } else {
      setTasks(ts => [task, ...ts])
    }
    setTaskModalOpen(false)
    toast.success(t.common.success, `"${task.title}"`)
  }

  async function handleDeleteTask() {
    try {
      await api.deleteTask(deleteTaskId)
      setTasks(ts => ts.filter(t => t.id !== deleteTaskId))
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
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
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/projects')}>
          {t.projectDetail.back}
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
            {t.projectDetail.newTask}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { icon: '📋', label: t.projectDetail.total, value: stats.total, color: project.color, bg: project.color + '20', filter: 'ALL' },
          { icon: '✅', label: t.projectDetail.done, value: stats.done, color: '#10b981', bg: '#d1fae5', filter: 'DONE' },
          { icon: '⚡', label: t.projectDetail.inProgress, value: stats.inProgress, color: '#3b82f6', bg: '#dbeafe', filter: 'IN_PROGRESS' },
          { icon: '📌', label: t.projectDetail.todo, value: stats.todo, color: '#f59e0b', bg: '#fef3c7', filter: 'TODO' },
          { icon: '⏰', label: t.projectDetail.overdue, value: stats.overdue, color: '#ef4444', bg: '#fee2e2', filter: 'OVERDUE' },
        ].map(s => (
          <div
            className="stat-card"
            key={s.label}
            onClick={() => {
              if (s.filter === 'OVERDUE') navigate(`/tasks?project=${id}&overdue=true`)
              else { setTaskFilter(s.filter); document.querySelector('.task-list-anchor')?.scrollIntoView({ behavior: 'smooth' }) }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
            <div style={{ color: 'var(--text-light)', fontSize: 18 }}>›</div>
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
                <span style={{ fontWeight: 700, fontSize: 14 }}>{t.projectDetail.projectProgress}</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: project.color }}>{progress}%</span>
              </div>
              <div className="progress-bar-track" style={{ height: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%`, background: project.color }} />
              </div>
            </div>
          </div>

          {/* Anchor for scroll */}
          <div className="task-list-anchor" />

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { key: 'ALL', label: `${t.projectDetail.filterAll} (${stats.total})` },
              { key: 'TODO', label: `${t.projectDetail.filterTodo} (${stats.todo})` },
              { key: 'IN_PROGRESS', label: `${t.projectDetail.filterInProgress} (${stats.inProgress})` },
              { key: 'DONE', label: `${t.projectDetail.filterDone} (${stats.done})` },
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
              <h3>{t.projectDetail.noTasks}</h3>
              {isAdmin && (
                <button className="btn btn-primary" onClick={() => setTaskModalOpen(true)}>
                  {t.projectDetail.newTask}
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

        {/* Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">{t.projectDetail.team}</div>
              <span style={{
                background: project.color + '20', color: project.color,
                borderRadius: 20, padding: '2px 10px',
                fontSize: 12, fontWeight: 700
              }}>{teamMembers.length}</span>
            </div>
            <div style={{ padding: '8px 16px 16px' }}>
              {teamMembers.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                  {t.projectDetail.noTeam}
                </p>
              ) : teamMembers.map(m => {
                const memberTasks = tasks.filter(task => task.assigneeId === m.id)
                const memberDone = memberTasks.filter(task => task.status === 'DONE').length
                const memberPct = memberTasks.length > 0 ? Math.round((memberDone / memberTasks.length) * 100) : 0
                return (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/tasks?assignee=${m.id}&project=${id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 6px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', borderRadius: 'var(--radius)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="avatar" style={{ background: m.avatarColor }}>
                      {m.name.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        <span>{memberTasks.length} {t.projectDetail.taskCount}</span>
                        <span style={{ color: project.color, fontWeight: 700 }}>{memberPct}%</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 5 }}>
                        <div className="progress-bar-fill" style={{ width: `${memberPct}%`, background: project.color }} />
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-light)', fontSize: 16 }}>›</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Project Files */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title">{t.projectDetail.projectFiles}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{projectFiles.length} {t.projectDetail.files}</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => projectFileRef.current?.click()}
                  disabled={uploadingFiles}
                >
                  {uploadingFiles ? t.projectDetail.uploading : t.projectDetail.uploadBtn}
                </button>
                <input ref={projectFileRef} type="file" multiple style={{ display: 'none' }} onChange={handleProjectFileUpload} />
              </div>
            </div>
            <div style={{ padding: '8px 12px 12px' }}>
              {projectFiles.length === 0 ? (
                <div
                  className="file-drop-zone"
                  style={{ padding: '20px 12px' }}
                  onClick={() => projectFileRef.current?.click()}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.projectDetail.clickToUpload}</div>
                </div>
              ) : (
                projectFiles.map(f => (
                  <div key={f.id} className="file-item" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{fileIcon(f.mimetype, f.originalName)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={`/uploads/${f.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="file-name"
                        style={{ display: 'block', color: 'var(--primary)', fontSize: 12 }}
                      >
                        {f.originalName}
                      </a>
                      <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                        {formatSize(f.size)} · {f.uploadedBy?.name}
                      </div>
                    </div>
                    {(isAdmin || f.uploadedById === user?.id) && (
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => handleDeleteProjectFile(f.id)}
                        style={{ fontSize: 14 }}
                      >🗑️</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mini task breakdown per member */}
          {teamMembers.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <div className="card-title">{t.projectDetail.taskBreakdown}</div>
              </div>
              <div style={{ padding: '8px 16px 16px' }}>
                {teamMembers.map(m => {
                  const mt = tasks.filter(task => task.assigneeId === m.id)
                  return (
                    <div key={m.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div className="avatar avatar-sm" style={{ background: m.avatarColor }}>{m.name.slice(0, 2)}</div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{m.name.split(' ')[0]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingRight: 4 }}>
                        {[
                          { key: 'TODO', color: '#f59e0b', bg: '#fef3c7', label: t.projectDetail.filterTodo },
                          { key: 'IN_PROGRESS', color: '#3b82f6', bg: '#dbeafe', label: t.projectDetail.filterInProgress },
                          { key: 'DONE', color: '#10b981', bg: '#d1fae5', label: t.projectDetail.filterDone },
                        ].map(s => {
                          const cnt = mt.filter(task => task.status === s.key).length
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
                        {mt.length === 0 && <span style={{ color: 'var(--text-light)', fontSize: 12 }}>{t.common.noData}</span>}
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
        templates={templates}
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
          onEdit={task => { setDetailOpen(false); setEditTask(task); setTaskModalOpen(true) }}
          toast={toast}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title={t.tasks.deleteTask}
        message={t.tasks.deleteConfirm}
      />
    </div>
  )
}

/* ── Task Row ── */
function TaskRow({ task, projectColor, isAdmin, currentUserId, onOpen, onEdit, onDelete, onStatus }) {
  const { t } = useLanguage()
  const statusLabel = { TODO: t.tasks.todo, IN_PROGRESS: t.tasks.inProgress, DONE: t.tasks.done }
  const statusBadge = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' }
  const priorityLabel = { HIGH: t.tasks.high, MEDIUM: t.tasks.medium, LOW: t.tasks.low }
  const priorityBadge = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }
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
        <span className={`badge ${priorityBadge[task.priority]}`}>{priorityLabel[task.priority]}</span>
        <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>

        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue' : daysDiff !== null && daysDiff <= 3 && daysDiff >= 0 ? 'soon' : ''}`}>
            {overdue ? '⚠️' : '📅'} {new Date(task.dueDate).toLocaleDateString()}
            {overdue && ` (${t.tasks.overdue})`}
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
            style={{ fontSize: 11, padding: '4px 10px', background: task.status === s ? projectColor : '', borderColor: task.status === s ? projectColor : '' }}
            onClick={e => onStatus(s, e)}
          >
            {s === 'TODO' ? '📌' : s === 'IN_PROGRESS' ? '⚡' : '✅'} {statusLabel[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Task Form Modal ── */
function TaskFormModal({ isOpen, onClose, editTask, projectId, projectName, users, isAdmin, currentUser, onSaved, toast, templates = [] }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' })
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [existingAtts, setExistingAtts] = useState([])
  const [deletingAtt, setDeletingAtt] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) { setPendingFiles([]); setExistingAtts([]); setSelectedTemplate(''); return }
    if (editTask) {
      setForm({
        title: editTask.title || '',
        description: editTask.description || '',
        priority: editTask.priority || 'MEDIUM',
        status: editTask.status || 'TODO',
        dueDate: toInputDate(editTask.dueDate),
        assigneeId: editTask.assigneeId?.toString() || ''
      })
      api.getTask(editTask.id).then(task => setExistingAtts(task.attachments || [])).catch(() => {})
    } else {
      setForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' })
      setExistingAtts([])
    }
    setPendingFiles([])
    setSelectedTemplate('')
  }, [isOpen, editTask])

  function applyTemplate(templateId) {
    const tmpl = templates.find(tmpl => tmpl.id === parseInt(templateId))
    if (!tmpl) return
    setSelectedTemplate(templateId)
    setForm(f => ({
      ...f,
      title: f.title || tmpl.name,
      description: tmpl.description || f.description,
      priority: tmpl.priority || f.priority
    }))
  }

  async function handleAI() {
    if (!form.title) { toast.warning(t.common.error, t.tasks.taskTitle + ' ' + t.common.required); return }
    setAiLoading(true)
    try {
      const res = await api.generateDescription(form.title, projectName)
      setForm(f => ({ ...f, description: res.description }))
      toast.success('AI')
    } catch (err) { toast.error('AI', err.message) }
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
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setDeletingAtt(null) }
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error(t.common.error, t.tasks.titleRequired); return }
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
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setSaving(false) }
  }

  function getFileIcon(f) {
    const type = f.type || f.mimetype || ''
    if (type.includes('image')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('doc')) return '📝'
    if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return '📊'
    return '📎'
  }

  function getFormatSize(b) {
    if (b < 1024) return b + ' B'
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }

  const totalFiles = existingAtts.length + pendingFiles.length

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
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
      {!editTask && templates.length > 0 && (
        <div className="form-group" style={{
          background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
          borderRadius: 'var(--radius)', padding: '12px 14px',
          border: '1px solid #c7d2fe', marginBottom: 16
        }}>
          <label className="form-label" style={{ fontSize: 12, marginBottom: 6, color: 'var(--primary)' }}>
            {t.tasks.fromTemplate}
          </label>
          <select
            className="form-control"
            value={selectedTemplate}
            onChange={e => applyTemplate(e.target.value)}
            style={{ borderColor: 'var(--primary)' }}
          >
            <option value="">{t.tasks.selectTemplate}</option>
            {templates.map(tmpl => (
              <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">{t.tasks.taskTitle} <span className="required">*</span></label>
        <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="form-label" style={{ margin: 0 }}>{t.tasks.description}</label>
          <button className="ai-btn" onClick={handleAI} disabled={aiLoading} type="button">
            {aiLoading ? <span className="spinner">⟳</span> : '✨'} Claude AI
          </button>
        </div>
        <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
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
          <label className="form-label">{t.tasks.dueDate}</label>
          <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
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
      </div>

      {/* File attachments */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="form-label" style={{ margin: 0 }}>
            📎 {t.tasks.attachments} {totalFiles > 0 && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>({totalFiles})</span>}
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t.common.add}
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
            🖼️ &nbsp;·&nbsp; 📄 PDF &nbsp;·&nbsp; 📊 Excel &nbsp;·&nbsp; 📎
          </div>
        )}

        {existingAtts.map(a => (
          <div key={a.id} className="file-item" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{getFileIcon(a)}</span>
            <a href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer"
              className="file-name" style={{ color: 'var(--primary)', flex: 1, fontSize: 13 }}
              onClick={e => e.stopPropagation()}>
              {a.originalName}
            </a>
            <span className="file-size" style={{ fontSize: 11, color: 'var(--text-light)' }}>{getFormatSize(a.size)}</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              disabled={deletingAtt === a.id}
              onClick={() => handleDeleteExisting(a.id)}
            >🗑️</button>
          </div>
        ))}

        {pendingFiles.map((f, i) => (
          <div key={i} className="file-item" style={{ marginBottom: 6, background: 'var(--primary)10', border: '1px solid var(--primary)30', borderRadius: 8, padding: '8px 12px' }}>
            <span style={{ fontSize: 16 }}>{getFileIcon(f)}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{getFormatSize(f.size)}</span>
            <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', borderRadius: 10, padding: '2px 7px', fontWeight: 600 }}>new</span>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => removePending(i)}
            >✕</button>
          </div>
        ))}
      </div>
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
  const statusBadge = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' }
  const priorityLabel = { HIGH: t.tasks.high, MEDIUM: t.tasks.medium, LOW: t.tasks.low }
  const priorityBadge = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  async function handleComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setAddingComment(true)
    try {
      const c = await api.addComment(task.id, comment)
      setTask(prev => ({ ...prev, comments: [...(prev.comments || []), c] }))
      setComment('')
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setAddingComment(false) }
  }

  async function handleDeleteComment(cid) {
    try {
      await api.deleteComment(cid)
      setTask(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== cid) }))
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  async function handleFiles(e) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('files', f))
      const atts = await api.uploadFiles(task.id, fd)
      setTask(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...atts] }))
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleDeleteAtt(aid) {
    try {
      await api.deleteAttachment(aid)
      setTask(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== aid) }))
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  function getFileSizeStr(b) {
    if (b < 1024) return b + ' B'
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }

  function getMimeIcon(m = '') {
    if (m.includes('image')) return '🖼️'
    if (m.includes('pdf')) return '📄'
    return '📎'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.tasks.title} size="modal-lg"
      footer={
        <>
          {(isAdmin || task.assigneeId === currentUser?.id) && (
            <button className="btn btn-secondary" onClick={() => onEdit(task)}>✏️ {t.common.edit}</button>
          )}
          <button className="btn btn-primary" onClick={onClose}>{t.common.close}</button>
        </>
      }
    >
      <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{task.title}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className={`badge ${priorityBadge[task.priority]}`}>{priorityLabel[task.priority]}</span>
        <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue' : ''}`} style={{ fontSize: 13 }}>
            {overdue ? '⚠️' : '📅'} {new Date(task.dueDate).toLocaleDateString()}
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
          <h4 style={{ fontWeight: 700 }}>📎 {t.tasks.attachments} ({task.attachments?.length || 0})</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? '...' : '⬆️'}
          </button>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
        </div>
        {task.attachments?.length === 0 && <p style={{ color: 'var(--text-light)', fontSize: 13 }}>{t.common.noData}</p>}
        {task.attachments?.map(a => (
          <div key={a.id} className="file-item">
            <span style={{ fontSize: 18 }}>{getMimeIcon(a.mimetype)}</span>
            <a href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer" className="file-name" style={{ color: 'var(--primary)' }} onClick={e => e.stopPropagation()}>
              {a.originalName}
            </a>
            <span className="file-size">{getFileSizeStr(a.size)}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteAtt(a.id)}>🗑️</button>
          </div>
        ))}
      </div>
      <hr className="divider" />
      {/* Comments */}
      <div>
        <h4 style={{ fontWeight: 700, marginBottom: 10 }}>💬 {t.tasks.comments} ({task.comments?.length || 0})</h4>
        {task.comments?.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div className="avatar avatar-sm" style={{ background: c.user.avatarColor, flexShrink: 0 }}>{c.user.name.slice(0, 2)}</div>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <strong style={{ fontSize: 12 }}>{c.user.name}</strong>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
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
          <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} placeholder={t.tasks.addComment} rows={2} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={addingComment || !comment.trim()} style={{ alignSelf: 'flex-end' }}>
            {t.common.add}
          </button>
        </form>
      </div>
    </Modal>
  )
}
