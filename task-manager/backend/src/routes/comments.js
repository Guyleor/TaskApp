import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.post('/task/:taskId', authenticate, async (req, res) => {
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'תוכן ההערה לא יכול להיות ריק' })

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      taskId: Number(req.params.taskId),
      userId: req.user.id
    },
    include: { user: { select: { id: true, name: true, avatarColor: true } } }
  })
  res.status(201).json(comment)
})

router.delete('/:id', authenticate, async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: Number(req.params.id) } })
  if (!comment) return res.status(404).json({ error: 'הערה לא נמצאה' })
  if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'אין הרשאה למחוק הערה זו' })
  }
  await prisma.comment.delete({ where: { id: Number(req.params.id) } })
  res.json({ success: true })
})

export default router
