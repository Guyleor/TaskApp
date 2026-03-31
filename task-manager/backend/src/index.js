import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import taskRoutes from './routes/tasks.js'
import userRoutes from './routes/users.js'
import commentRoutes from './routes/comments.js'
import attachmentRoutes from './routes/attachments.js'
import aiRoutes from './routes/ai.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors({
  origin: isProd ? true : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/users', userRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/attachments', attachmentRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

// Serve frontend in production
if (isProd) {
  const frontendDist = path.join(__dirname, '../../../task-manager/dist')
  app.use(express.static(frontendDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
