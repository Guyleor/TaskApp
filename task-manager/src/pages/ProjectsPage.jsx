import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Modal, { ConfirmModal } from '../components/common/Modal'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#0f172a', '#84cc16']

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    try {
      const data = await api.getProjects()
      setProjects(data)
    } catch { toast.error(t.common.error, t.common.serverError) }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditProject(null)
    setForm({ name: '', description: '', color: '#6366f1' })
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditProject(p)
    setForm({ name: p.name, description: p.description || '', color: p.color })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error(t.common.error, t.common.required); return }
    setSaving(true)
    try {
      if (editProject) {
        const updated = await api.updateProject(editProject.id, form)
        setProjects(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p))
        toast.success(t.common.success)
      } else {
        const created = await api.createProject(form)
        setProjects(ps => [{ ...created, taskCount: 0, doneCount: 0 }, ...ps])
        toast.success(t.common.success)
      }
      setModalOpen(false)
    } catch (err) { toast.error(t.common.error, err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      await api.deleteProject(deleteId)
      setProjects(ps => ps.filter(p => p.id !== deleteId))
      toast.success(t.common.success)
    } catch (err) { toast.error(t.common.error, err.message) }
  }

  if (loading) return <div className="loading-spinner" />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t.projects.allProjects}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{projects.length} {t.projects.count}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            {t.projects.newProject}
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>{t.projects.noProjects}</h3>
          <p>{t.projects.createFirst}</p>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>{t.projects.newProject}</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={id => setDeleteId(id)}
              onOpen={() => navigate(`/projects/${project.id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProject ? t.projects.editProject : t.projects.createProject}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t.common.cancel}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '...' : editProject ? t.common.save : t.projects.newProject}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t.projects.projectName} <span className="required">*</span></label>
          <input
            className="form-control"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={t.projects.projectName}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t.projects.description}</label>
          <textarea
            className="form-control"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t.projects.color}</label>
          <div className="color-picker">
            {COLORS.map(c => (
              <div
                key={c}
                className={`color-dot ${form.color === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setForm(f => ({ ...f, color: c }))}
              />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: form.color }} />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t.projects.deleteProject}
        message={t.projects.deleteConfirm}
      />
    </div>
  )
}

function ProjectCard({ project, isAdmin, onEdit, onDelete, onOpen, t }) {
  const progress = project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0

  return (
    <div className="card" style={{ overflow: 'visible', transition: 'all 0.2s', cursor: 'pointer' }}
      onClick={onOpen}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
    >
      <div style={{ height: 6, background: project.color, borderRadius: '12px 12px 0 0' }} />
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: project.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📁
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{project.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {project.taskCount} {t.projects.tasks}
              </div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); onEdit(project) }}>✏️</button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); onDelete(project.id) }}>🗑️</button>
            </div>
          )}
        </div>

        {project.description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
            {project.description}
          </p>
        )}

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t.projects.progress}</span>
            <span style={{ fontWeight: 700, color: project.color }}>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: project.color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-light)' }}>
            <span>✅ {project.doneCount} {t.projects.completed}</span>
            <span>📌 {project.taskCount - project.doneCount} {t.projects.remaining}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
