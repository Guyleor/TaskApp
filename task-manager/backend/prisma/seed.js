import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const empPassword = await bcrypt.hash('employee123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      name: 'מנהל מערכת',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'ADMIN',
      avatarColor: '#6366f1'
    }
  })

  const emp1 = await prisma.user.upsert({
    where: { email: 'david@company.com' },
    update: {},
    create: {
      name: 'דוד כהן',
      email: 'david@company.com',
      password: empPassword,
      role: 'EMPLOYEE',
      avatarColor: '#10b981'
    }
  })

  const emp2 = await prisma.user.upsert({
    where: { email: 'sara@company.com' },
    update: {},
    create: {
      name: 'שרה לוי',
      email: 'sara@company.com',
      password: empPassword,
      role: 'EMPLOYEE',
      avatarColor: '#f59e0b'
    }
  })

  const emp3 = await prisma.user.upsert({
    where: { email: 'yossi@company.com' },
    update: {},
    create: {
      name: 'יוסי ישראלי',
      email: 'yossi@company.com',
      password: empPassword,
      role: 'EMPLOYEE',
      avatarColor: '#ef4444'
    }
  })

  const project1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'פיתוח אתר',
      description: 'פיתוח אתר חדש לחברה',
      color: '#6366f1'
    }
  })

  const project2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'מסע פרסום',
      description: 'קמפיין שיווקי חדש ברשתות חברתיות',
      color: '#10b981'
    }
  })

  const project3 = await prisma.project.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'אפליקציה מובייל',
      description: 'פיתוח אפליקציית מובייל לאנדרואיד ואייפון',
      color: '#f59e0b'
    }
  })

  const now = new Date()
  const tasks = [
    {
      title: 'עיצוב דף הבית',
      description: 'עיצוב מחדש של דף הבית עם מיקוד בחוויית משתמש ועיצוב מודרני',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      assigneeId: emp1.id,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'פיתוח API לאחורה',
      description: 'פיתוח ממשק REST API לתמיכה בפרונטאנד',
      priority: 'HIGH',
      status: 'TODO',
      projectId: project1.id,
      assigneeId: emp2.id,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'בדיקות QA מקיפות',
      description: 'בדיקות איכות מקיפות לכל מודולי המערכת',
      priority: 'MEDIUM',
      status: 'TODO',
      projectId: project1.id,
      assigneeId: emp1.id,
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'יצירת תוכן לקמפיין',
      description: 'כתיבת טקסטים ותוכן מקצועי לקמפיין הפרסומי',
      priority: 'MEDIUM',
      status: 'DONE',
      projectId: project2.id,
      assigneeId: emp2.id,
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'עיצוב גרפי לרשתות חברתיות',
      description: 'יצירת חומרים גרפיים לפייסבוק, אינסטגרם וטוויטר',
      priority: 'LOW',
      status: 'DONE',
      projectId: project2.id,
      assigneeId: emp3.id,
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'פיתוח מסך התחברות',
      description: 'פיתוח מסך התחברות והרשמה לאפליקציה',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      projectId: project3.id,
      assigneeId: emp1.id,
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'אינטגרציה עם Push Notifications',
      description: 'הטמעת מערכת התראות Push לאנדרואיד ואייפון',
      priority: 'MEDIUM',
      status: 'TODO',
      projectId: project3.id,
      assigneeId: emp3.id,
      dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'אופטימיזציה לביצועים',
      description: 'שיפור מהירות טעינה וביצועי האפליקציה',
      priority: 'LOW',
      status: 'TODO',
      projectId: project3.id,
      assigneeId: emp2.id,
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    }
  ]

  for (const task of tasks) {
    await prisma.task.create({ data: task })
  }

  console.log('✅ Seed completed!')
  console.log('Users created:')
  console.log('  Admin: admin@company.com / admin123')
  console.log('  Employee: david@company.com / employee123')
  console.log('  Employee: sara@company.com / employee123')
  console.log('  Employee: yossi@company.com / employee123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
