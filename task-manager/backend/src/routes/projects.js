import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// ── Project Files ──

router.get('/:id/files', authenticate, async (req, res) => {
  const files = await prisma.projectFile.findMany({
    where: { projectId: Number(req.params.id) },
    include: { uploadedBy: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(files)
})

router.post('/:id/files', authenticate, upload.array('files', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'לא נבחרו קבצים' })
  const created = await Promise.all(req.files.map(f =>
    prisma.projectFile.create({
      data: {
        filename: f.filename,
        originalName: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        projectId: Number(req.params.id),
        uploadedById: req.user.id
      },
      include: { uploadedBy: { select: { id: true, name: true, avatarColor: true } } }
    })
  ))
  res.status(201).json(created)
})

router.delete('/:id/files/:fileId', authenticate, async (req, res) => {
  const file = await prisma.projectFile.findUnique({ where: { id: Number(req.params.fileId) } })
  if (!file) return res.status(404).json({ error: 'קובץ לא נמצא' })
  if (req.user.role !== 'ADMIN' && file.uploadedById !== req.user.id)
    return res.status(403).json({ error: 'אין הרשאה' })

  const filePath = path.join(__dirname, '../../../uploads', file.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  await prisma.projectFile.delete({ where: { id: Number(req.params.fileId) } })
  res.json({ success: true })
})

export default router
