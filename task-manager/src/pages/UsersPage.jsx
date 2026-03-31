import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import Modal, { ConfirmModal } from '../components/common/Modal'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#0f172a', '#84cc16']

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE', avatarColor: '#6366f1' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const { user: currentUser } = useAuth()

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch { toast.error('שגיאה', 'לא ניתן לטעון משתמשים') }
    finally { setLoading(false) }
  }

  function openCreate() {
    setEditUser(null)
    setForm({ name: '', email: '', password: '', role: 'EMPLOYEE', avatarColor: '#6366f1' })
    setModalOpen(true)
  }

  function openEdit(u) {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, avatarColor: u.avatarColor })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.email) { toast.error('שגיאה', 'שם ואימייל חובה'); return }
    if (!editUser && !form.password) { toast.error('שגיאה', 'סיסמה חובה'); return }
    setSaving(true)
    try {
      if (editUser) {
        const updated = await api.updateUser(editUser.id, form)
        setUsers(us => us.map(u => u.id === updated.id ? updated : u))
        toast.success('עודכן', 'המשתמש עודכן')
      } else {
        const created = await api.createUser(form)
        setUsers(us => [...us, created])
        toast.success('נוצר', 'המשתמש נוצר')
      }
      setModalOpen(false)
    } catch (err) { toast.error('שגיאה', err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      await api.deleteUser(deleteId)
      setUsers(us => us.filter(u => u.id !== deleteId))
      toast.success('נמחק')
    } catch (err) { toast.error('שגיאה', err.message) }
  }

  function getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  if (loading) return <div className="loading-spinner" />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>👥 ניהול משתמשים</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{users.length} משתמשים</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>＋ משתמש חדש</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>משתמש</th>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>נרשם</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: u.avatarColor }}>{getInitials(u.name)}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        {u.id === currentUser?.id && (
                          <div style={{ fontSize: 11, color: 'var(--primary)' }}>אתה</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'ADMIN' ? 'admin' : 'employee'}`}>
                      {u.role === 'ADMIN' ? '👑 מנהל' : '👤 עובד'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(u)} title="עריכה">✏️</button>
                      {u.id !== currentUser?.id && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteId(u.id)} title="מחיקה">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? '✏️ עריכת משתמש' : '➕ משתמש חדש'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>ביטול</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '...' : editUser ? 'שמור' : 'צור משתמש'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">שם מלא <span className="required">*</span></label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="שם מלא" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">אימייל <span className="required">*</span></label>
            <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">סיסמה {editUser ? '' : <span className="required">*</span>}</label>
            <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? 'השאר ריק לא לשנות' : 'סיסמה חדשה'} />
          </div>
          <div className="form-group">
            <label className="form-label">תפקיד</label>
            <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="EMPLOYEE">👤 עובד</option>
              <option value="ADMIN">👑 מנהל</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">צבע אווטר</label>
          <div className="color-picker">
            {COLORS.map(c => (
              <div
                key={c}
                className={`color-dot ${form.avatarColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div className="avatar avatar-sm" style={{ background: form.avatarColor }}>
              {form.name ? form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AB'}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>תצוגה מקדימה</span>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="מחיקת משתמש"
        message="האם אתה בטוח שברצונך למחוק משתמש זה? הפעולה אינה ניתנת לביטול."
      />
    </div>
  )
}
