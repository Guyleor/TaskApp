import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Get all users (admin sees all, employees see all for assignment purposes)
router.get('/', authenticate, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatarColor: true, createdAt: true },
    orderBy: { name: 'asc' }
  })
  res.json(users)
})

// Create user (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, email, password, role, avatarColor } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'שם, אימייל וסיסמה הם שדות חובה' })
  }
  try {
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'EMPLOYEE', avatarColor: avatarColor || '#6366f1' },
      select: { id: true, name: true, email: true, role: true, avatarColor: true, createdAt: true }
    })
    res.status(201).json(user)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'אימייל כבר קיים במערכת' })
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

// Update user (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, email, role, avatarColor, password } = req.body
  try {
    const data = { name, email, role, avatarColor }
    if (password) data.password = await bcrypt.hash(password, 10)
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, email: true, role: true, avatarColor: true }
    })
    res.json(user)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'אימייל כבר קיים' })
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

// Employee progress stats
router.get('/progress', authenticate, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      avatarColor: true,
      assignedTasks: { select: { status: true, priority: true } }
    },
    orderBy: { name: 'asc' }
  })

  const progress = users.map(u => ({
    id: u.id,
    name: u.name,
    avatarColor: u.avatarColor,
    total: u.assignedTasks.length,
    done: u.assignedTasks.filter(t => t.status === 'DONE').length,
    inProgress: u.assignedTasks.filter(t => t.status === 'IN_PROGRESS').length,
    todo: u.assignedTasks.filter(t => t.status === 'TODO').length,
    highPriority: u.assignedTasks.filter(t => t.priority === 'HIGH').length
  }))

  res.json(progress)
})

export default router
