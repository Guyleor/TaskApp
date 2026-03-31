import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'נדרש אימייל וסיסמה' })
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...userWithoutPassword } = user
    res.json({ token, user: userWithoutPassword })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
})

router.get('/me', authenticate, async (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user
  res.json(userWithoutPassword)
})

export default router
