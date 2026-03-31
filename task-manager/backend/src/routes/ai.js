import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/describe', authenticate, async (req, res) => {
  const { title, projectName } = req.body
  if (!title) return res.status(400).json({ error: 'כותרת משימה נדרשת' })

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
    return res.status(503).json({ error: 'מפתח Claude API לא מוגדר' })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `אתה עוזר לניהול משימות. צור תיאור קצר ומקצועי בעברית למשימה הבאה:

כותרת: "${title}"
פרויקט: "${projectName || 'כללי'}"

כתוב תיאור של 2-3 משפטים שמסביר מה צריך לעשות, שיקולים חשובים, ותוצאה צפויה. היה ספציפי ומעשי. כתוב בעברית בלבד.`
      }]
    })

    res.json({ description: message.content[0].text })
  } catch (err) {
    console.error('AI error:', err)
    res.status(500).json({ error: 'שגיאה בשירות ה-AI' })
  }
})

export default router
