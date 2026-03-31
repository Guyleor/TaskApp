import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

const taskInclude = {
  project: { select: { id: true, name: true, color: true } },
  assignee: { select: { id: true, name: true, avatarColor: true } },
  comments: {
    include: { user: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: { createdAt: 'asc' }
  },
  attachments: true,
  _count: { select: { comments: true, attachments: true } }
}

// Get all tasks with filters
router.get('/', authenticate, async (req, res) => {
  const { status, priority, assigneeId, projectId, search } = req.query
  const where = {}

  if (status) where.status = status
  if (priority) where.priority = priority
  if (assigneeId) where.assigneeId = Number(assigneeId)
  if (projectId) where.projectId = Number(projectId)
  if (search) where.title = { contains: search, mode: 'insensitive' }

  // Employees only see their assigned tasks
  if (req.user.role === 'EMPLOYEE') {
    where.assigneeId = req.user.id
  }

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ createdAt: 'desc' }]
  })
  res.json(tasks)
})

// Dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  const base = req.user.role === 'EMPLOYEE' ? { assigneeId: req.user.id } : {}
  const now = new Date()

  const [total, done, inProgress, todo, overdue] = await Promise.all([
    prisma.task.count({ where: base }),
    prisma.task.count({ where: { ...base, status: 'DONE' } }),
    prisma.task.count({ where: { ...base, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { ...base, status: 'TODO' } }),
    prisma.task.count({ where: { ...base, dueDate: { lt: now }, status: { not: 'DONE' } } })
  ])

  res.json({ total, done, inProgress, todo, overdue })
})

// Calendar view - tasks by month
router.get('/calendar', authenticate, async (req, res) => {
  const { year, month } = req.query
  const y = parseInt(year) || new Date().getFullYear()
  const m = parseInt(month) || new Date().getMonth() + 1

  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59)

  const where = { dueDate: { gte: start, lte: end } }
  if (req.user.role === 'EMPLOYEE') where.assigneeId = req.user.id

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { color: true, name: true } },
      assignee: { select: { name: true } }
    }
  })
  res.json(tasks)
})

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: Number(req.params.id) },
    include: taskInclude
  })
  if (!task) return res.status(404).json({ error: 'משימה לא נמצאה' })
  res.json(task)
})

// Create task
router.post('/', authenticate, async (req, res) => {
  const { title, description, priority, status, dueDate, projectId, assigneeId } = req.body
  if (!title || !projectId) return res.status(400).json({ error: 'כותרת ופרויקט הם שדות חובה' })

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: Number(projectId),
        assigneeId: assigneeId ? Number(assigneeId) : null
      },
      include: taskInclude
    })
    res.status(201).json(task)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

// Update task
router.put('/:id', authenticate, async (req, res) => {
  const { title, description, priority, status, dueDate, projectId, assigneeId } = req.body
  try {
    const data = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (priority !== undefined) data.priority = priority
    if (status !== undefined) data.status = status
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (projectId !== undefined) data.projectId = Number(projectId)
    if (assigneeId !== undefined) data.assigneeId = assigneeId ? Number(assigneeId) : null

    const task = await prisma.task.update({
      where: { id: Number(req.params.id) },
      data,
      include: taskInclude
    })
    res.json(task)
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

export default router
