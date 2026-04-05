import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', authenticate, async (req, res) => {
  const templates = await prisma.taskTemplate.findMany({
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(templates)
})

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, priority } = req.body
  if (!name) return res.status(400).json({ error: 'שם תבנית הוא שדה חובה' })
  const template = await prisma.taskTemplate.create({
    data: { name, description, priority: priority || 'MEDIUM', createdById: req.user.id },
    include: { createdBy: { select: { id: true, name: true } } }
  })
  res.status(201).json(template)
})

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, description, priority } = req.body
  const template = await prisma.taskTemplate.update({
    where: { id: Number(req.params.id) },
    data: { name, description, priority },
    include: { createdBy: { select: { id: true, name: true } } }
  })
  res.json(template)
})

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  await prisma.taskTemplate.delete({ where: { id: Number(req.params.id) } })
  res.json({ success: true })
})

export default router
