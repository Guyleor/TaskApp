import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authenticate, async (req, res) => {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { tasks: true } },
      tasks: { select: { status: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const result = projects.map(p => ({
    ...p,
    taskCount: p._count.tasks,
    doneCount: p.tasks.filter(t => t.status === 'DONE').length,
    tasks: undefined,
    _count: undefined
  }))

  res.json(result)
})

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, color } = req.body
  if (!name) return res.status(400).json({ error: 'שם פרויקט הוא שדה חובה' })

  const project = await prisma.project.create({
    data: { name, description, color: color || '#6366f1' }
  })
  res.status(201).json({ ...project, taskCount: 0, doneCount: 0 })
})

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, description, color } = req.body
  const project = await prisma.project.update({
    where: { id: Number(req.params.id) },
    data: { name, description, color }
  })
  res.json(project)
})

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

export default router
