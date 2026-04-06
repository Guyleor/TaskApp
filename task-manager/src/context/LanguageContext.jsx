import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  he: {
    nav: {
      dashboard: 'דשבורד', projects: 'פרויקטים', tasks: 'משימות',
      calendar: 'לוח שנה', progress: 'התקדמות', users: 'משתמשים',
      management: 'ניהול', mainNav: 'ניווט ראשי',
    },
    common: {
      save: 'שמור', cancel: 'ביטול', delete: 'מחק', edit: 'ערוך',
      create: 'צור', add: 'הוסף', search: 'חיפוש', loading: 'טוען...',
      error: 'שגיאה', success: 'הצלחה', confirm: 'אישור', close: 'סגור',
      required: 'חובה', noData: 'אין נתונים', serverError: 'שגיאת שרת',
    },
    auth: {
      title: 'Task Manager', subtitle: 'מערכת ניהול משימות צוותית',
      email: 'אימייל', password: 'סיסמה', loginBtn: 'התחברות',
      loggingIn: 'מתחבר...', logout: 'התנתקות', demoUsers: 'משתמשי דמו:',
      admin: 'מנהל', employee: 'עובד', welcome: 'ברוך הבא! 👋',
      loginError: 'שגיאת התחברות', fillRequired: 'נדרש אימייל וסיסמה',
    },
    dashboard: {
      title: 'דשבורד', subtitle: 'סקירה כללית של המשימות',
      total: 'סה״כ משימות', done: 'הושלמו', inProgress: 'בתהליך',
      overdue: 'באיחור', todo: 'לביצוע', completionRate: '% השלמה',
      overallCompletion: '📊 אחוז השלמה כולל',
      activeTasks: '⚡ משימות פעילות', showAll: 'הצג הכל',
      noActiveTasks: 'אין משימות פעילות', allDone: 'כל המשימות הושלמו!',
      task: 'משימה', project: 'פרויקט', priority: 'עדיפות',
      status: 'סטטוס', assignedTo: 'שייך ל', dueDate: 'תאריך יעד',
    },
    projects: {
      title: 'פרויקטים', subtitle: 'ניהול פרויקטים',
      allProjects: '📁 כל הפרויקטים', newProject: '＋ פרויקט חדש',
      editProject: '✏️ עריכת פרויקט', createProject: '➕ פרויקט חדש',
      deleteProject: 'מחיקת פרויקט',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק פרויקט זה? כל המשימות שלו יימחקו.',
      noProjects: 'אין פרויקטים עדיין', createFirst: 'צור את הפרויקט הראשון שלך',
      projectName: 'שם פרויקט', description: 'תיאור', color: 'צבע',
      tasks: 'משימות', completed: 'הושלמו', progress: 'התקדמות',
      remaining: 'נותרו', count: 'פרויקטים',
    },
    tasks: {
      title: 'משימות', subtitle: 'כל המשימות',
      newTask: '＋ משימה חדשה', editTask: '✏️ עריכת משימה',
      createTask: '➕ משימה חדשה', deleteTask: 'מחיקת משימה',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק משימה זו?',
      noTasks: 'אין משימות', taskTitle: 'כותרת',
      description: 'תיאור', priority: 'עדיפות', status: 'סטטוס',
      dueDate: 'תאריך יעד', assignee: 'הקצה לעובד', unassigned: 'לא מוקצה',
      allPriorities: 'כל העדיפויות', allStatuses: 'כל הסטטוסים',
      allEmployees: 'כל העובדים', allProjects: 'כל הפרויקטים',
      searchPlaceholder: '🔍 חיפוש משימות...', clear: '✕ נקה',
      high: 'גבוהה', medium: 'בינונית', low: 'נמוכה',
      todo: 'לביצוע', inProgress: 'בתהליך', done: 'הושלם',
      comments: 'תגובות', attachments: 'קבצים', addComment: 'הוסף תגובה...',
      aiBtn: '✨ Claude AI', overdue: 'באיחור',
      fromTemplate: '📋 התחל מתבנית', selectTemplate: '— בחר תבנית —',
      titleRequired: 'כותרת חובה', count: 'משימות',
    },
    calendar: {
      title: 'לוח שנה', subtitle: 'תצוגה חודשית',
      months: ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'],
      days: ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'],
      noTasks: 'אין משימות בחודש זה', today: 'היום',
    },
    progress: {
      title: 'התקדמות', subtitle: 'סטטיסטיקות עובדים',
      activeEmployees: 'עובדים פעילים', totalTasks: 'סה״כ משימות',
      completed: 'הושלמו', completionRate: 'אחוז השלמה',
      overallCompletion: '📊 אחוז השלמה כולל',
      noEmployees: 'אין עובדים עם משימות',
      noEmployeesSub: 'הקצה משימות לעובדים כדי לראות את ההתקדמות שלהם',
      done: 'הושלם', inProgress: 'בתהליך', todo: 'לביצוע', tasks: 'משימות',
    },
    users: {
      title: 'משתמשים', subtitle: 'ניהול משתמשים',
      newUser: '＋ משתמש חדש', editUser: '✏️ עריכת משתמש',
      createUser: '➕ משתמש חדש', deleteUser: 'מחיקת משתמש',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק משתמש זה?',
      noUsers: 'אין משתמשים', name: 'שם מלא', email: 'אימייל',
      password: 'סיסמה', role: 'תפקיד', admin: 'מנהל', employee: 'עובד',
      joined: 'הצטרף', actions: 'פעולות', count: 'משתמשים',
      newPassword: 'סיסמה חדשה (ריק = ללא שינוי)',
    },
    projectDetail: {
      back: '‹', newTask: '＋ משימה חדשה',
      projectProgress: 'התקדמות פרויקט',
      team: '👥 צוות הפרויקט', noTeam: 'אין עובדים מוקצים עדיין',
      taskBreakdown: '📊 פירוט משימות',
      projectFiles: '📂 קבצי פרויקט', uploadBtn: '＋ העלה',
      uploading: '⏳', clickToUpload: 'לחץ להעלאת קבצים משותפים',
      files: 'קבצים', noTasks: 'אין משימות',
      filterAll: 'הכל', filterTodo: 'לביצוע',
      filterInProgress: 'בתהליך', filterDone: 'הושלם',
      total: 'סה״כ משימות', done: 'הושלמו', inProgress: 'בתהליך',
      todo: 'לביצוע', overdue: 'באיחור',
      tasks: 'משימות', taskCount: 'משימות',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks',
      calendar: 'Calendar', progress: 'Progress', users: 'Users',
      management: 'Management', mainNav: 'Main Navigation',
    },
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      create: 'Create', add: 'Add', search: 'Search', loading: 'Loading...',
      error: 'Error', success: 'Success', confirm: 'Confirm', close: 'Close',
      required: 'Required', noData: 'No data', serverError: 'Server error',
    },
    auth: {
      title: 'Task Manager', subtitle: 'Team Task Management System',
      email: 'Email', password: 'Password', loginBtn: 'Sign In',
      loggingIn: 'Signing in...', logout: 'Logout', demoUsers: 'Demo Users:',
      admin: 'Admin', employee: 'Employee', welcome: 'Welcome! 👋',
      loginError: 'Login Error', fillRequired: 'Email and password are required',
    },
    dashboard: {
      title: 'Dashboard', subtitle: 'Tasks Overview',
      total: 'Total Tasks', done: 'Completed', inProgress: 'In Progress',
      overdue: 'Overdue', todo: 'To Do', completionRate: '% Completion',
      overallCompletion: '📊 Overall Completion Rate',
      activeTasks: '⚡ Active Tasks', showAll: 'Show All',
      noActiveTasks: 'No active tasks', allDone: 'All tasks completed!',
      task: 'Task', project: 'Project', priority: 'Priority',
      status: 'Status', assignedTo: 'Assigned To', dueDate: 'Due Date',
    },
    projects: {
      title: 'Projects', subtitle: 'Project Management',
      allProjects: '📁 All Projects', newProject: '＋ New Project',
      editProject: '✏️ Edit Project', createProject: '➕ New Project',
      deleteProject: 'Delete Project',
      deleteConfirm: 'Are you sure you want to delete this project? All its tasks will be deleted.',
      noProjects: 'No projects yet', createFirst: 'Create your first project',
      projectName: 'Project Name', description: 'Description', color: 'Color',
      tasks: 'Tasks', completed: 'Completed', progress: 'Progress',
      remaining: 'Remaining', count: 'projects',
    },
    tasks: {
      title: 'Tasks', subtitle: 'All Tasks',
      newTask: '＋ New Task', editTask: '✏️ Edit Task',
      createTask: '➕ New Task', deleteTask: 'Delete Task',
      deleteConfirm: 'Are you sure you want to delete this task?',
      noTasks: 'No tasks', taskTitle: 'Title',
      description: 'Description', priority: 'Priority', status: 'Status',
      dueDate: 'Due Date', assignee: 'Assign to Employee', unassigned: 'Unassigned',
      allPriorities: 'All Priorities', allStatuses: 'All Statuses',
      allEmployees: 'All Employees', allProjects: 'All Projects',
      searchPlaceholder: '🔍 Search tasks...', clear: '✕ Clear',
      high: 'High', medium: 'Medium', low: 'Low',
      todo: 'To Do', inProgress: 'In Progress', done: 'Done',
      comments: 'Comments', attachments: 'Files', addComment: 'Add comment...',
      aiBtn: '✨ Claude AI', overdue: 'Overdue',
      fromTemplate: '📋 Start from template', selectTemplate: '— Select template —',
      titleRequired: 'Title is required', count: 'tasks',
    },
    calendar: {
      title: 'Calendar', subtitle: 'Monthly View',
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      noTasks: 'No tasks this month', today: 'Today',
    },
    progress: {
      title: 'Progress', subtitle: 'Employee Statistics',
      activeEmployees: 'Active Employees', totalTasks: 'Total Tasks',
      completed: 'Completed', completionRate: 'Completion Rate',
      overallCompletion: '📊 Overall Completion Rate',
      noEmployees: 'No employees with tasks',
      noEmployeesSub: 'Assign tasks to employees to see their progress',
      done: 'Done', inProgress: 'In Progress', todo: 'To Do', tasks: 'Tasks',
    },
    users: {
      title: 'Users', subtitle: 'User Management',
      newUser: '＋ New User', editUser: '✏️ Edit User',
      createUser: '➕ New User', deleteUser: 'Delete User',
      deleteConfirm: 'Are you sure you want to delete this user?',
      noUsers: 'No users', name: 'Full Name', email: 'Email',
      password: 'Password', role: 'Role', admin: 'Admin', employee: 'Employee',
      joined: 'Joined', actions: 'Actions', count: 'users',
      newPassword: 'New password (empty = no change)',
    },
    projectDetail: {
      back: '‹', newTask: '＋ New Task',
      projectProgress: 'Project Progress',
      team: '👥 Project Team', noTeam: 'No assigned employees yet',
      taskBreakdown: '📊 Task Breakdown',
      projectFiles: '📂 Project Files', uploadBtn: '＋ Upload',
      uploading: '⏳', clickToUpload: 'Click to upload shared files',
      files: 'files', noTasks: 'No tasks',
      filterAll: 'All', filterTodo: 'To Do',
      filterInProgress: 'In Progress', filterDone: 'Done',
      total: 'Total Tasks', done: 'Completed', inProgress: 'In Progress',
      todo: 'To Do', overdue: 'Overdue',
      tasks: 'Tasks', taskCount: 'tasks',
    },
  },
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'he')

  function setLang(l) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
