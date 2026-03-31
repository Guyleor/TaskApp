import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const prisma = new PrismaClient()

router.post('/task/:taskId', authenticate, upload.array('files', 5), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'לא נבחרו קבצים' })

  const attachments = await Promise.all(
    req.files.map(file =>
      prisma.attachment.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          taskId: Number(req.params.taskId)
        }
      })
    )
  )
  res.status(201).json(attachments)
})

router.delete('/:id', authenticate, async (req, res) => {
  const att = await prisma.attachment.findUnique({ where: { id: Number(req.params.id) } })
  if (!att) return res.status(404).json({ error: 'קובץ לא נמצא' })

  const filePath = path.join(__dirname, '../../../uploads', att.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  await prisma.attachment.delete({ where: { id: Number(req.params.id) } })
  res.json({ success: true })
})

export default router
