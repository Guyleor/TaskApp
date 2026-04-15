# TaskManager — מערכת ניהול משימות לצוותים

> אפליקציית Full-Stack לניהול פרויקטים ומשימות בארגון, עם תמיכה מלאה בעברית ואנגלית.

🌐 **Live Demo:** [taskapp-production-11d4.up.railway.app](https://taskapp-production-11d4.up.railway.app)

---

## תכונות עיקריות

### ניהול משימות ופרויקטים
- יצירה, עריכה ומחיקה של פרויקטים ומשימות
- סינון לפי סטטוס, עדיפות, עובד, פרויקט ותאריך
- מעבר מהיר בין סטטוסים (To Do / In Progress / Done) ישירות מהכרטיס
- תצוגת לוח שנה חודשי עם כל המשימות לפי תאריך יעד

### דשבורד חכם
- כרטיסי סטטיסטיקות לחיצים — לחיצה על כרטיס מנווטת ישירות למשימות המתאימות
- סקירה מהירה: סה"כ משימות, הושלמו, בתהליך, באיחור

### עמוד התקדמות צוות
- תצוגה ויזואלית של התקדמות כל עובד (גרף עמודות + progress bars)
- לחיצה על עובד → צפייה בכל המשימות שלו
- לחיצה על כל סטטוס (Done / In Progress / To Do) → סינון ישיר

### ניווט חכם בפרויקטים
- כרטיסי סטטיסטיקות בפירוט פרויקט → סינון רשימת המשימות תוך הדף
- לחיצה על איש צוות → עמוד משימות מסונן לפי עובד + פרויקט

### קבצי פרויקט
- העלאת קבצים משותפים לכל משתתפי הפרויקט (תמונות, PDF, Word, Excel ועוד)
- הורדה ומחיקה של קבצים

### תבניות משימות
- מנהל יוצר תבניות קבועות עם כותרת, תיאור ועדיפות
- בעת יצירת משימה — אפשרות להתחיל מתבנית ולמלא את השדות אוטומטית

### בינה מלאכותית (Claude AI)
- עוזר AI מובנה לניהול משימות וייעוץ בפרויקטים

### ממשק משתמש
- **תמיכה מלאה בעברית ואנגלית** — מיתוג RTL/LTR אוטומטי
- **Responsive** — תפריט המבורגר וסייד-בר כ-overlay במובייל
- מערכת התראות (Toast notifications)
- אבטחה מבוססת JWT עם הרשאות Admin / Employee

---

## טכנולוגיות

### Frontend
| טכנולוגיה | שימוש |
|---|---|
| React 18 + Vite | UI Framework |
| React Router v6 | ניווט ו-SPA |
| Context API | ניהול State (Auth, Language, Toast) |
| CSS Variables | עיצוב דינמי + RTL/LTR |

### Backend
| טכנולוגיה | שימוש |
|---|---|
| Node.js + Express | שרת API |
| Prisma ORM | גישה לבסיס נתונים |
| SQLite | בסיס נתונים |
| JWT | אימות משתמשים |
| Multer | העלאת קבצים |
| bcrypt | הצפנת סיסמאות |

### DevOps
| טכנולוגיה | שימוש |
|---|---|
| Railway | Hosting + CD |
| GitHub | Source Control + CI trigger |

---

## התקנה מקומית

### דרישות מקדימות
- Node.js 18+
- npm

### הרצה

```bash
# שכפול הפרויקט
git clone https://github.com/Guyleor/TaskApp.git
cd TaskApp

# התקנת תלויות Backend
cd task-manager/backend
npm install

# הגדרת בסיס הנתונים
npx prisma db push

# הרצת Backend (פורט 3002)
node src/index.js
```

```bash
# בטרמינל נפרד — Frontend
cd task-manager
npm install
npm run dev
# פורט 5173
```

### משתני סביבה (Backend)

צור קובץ `.env` בתיקיית `task-manager/backend/`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

---

## משתמשי Demo

| תפקיד | אימייל | סיסמה |
|---|---|---|
| Admin | admin@company.com | admin123 |
| Employee | david@company.com | employee123 |

---

## מבנה הפרויקט

```
TaskApp/
├── task-manager/
│   ├── src/
│   │   ├── api/           # client.js — כל קריאות ה-API
│   │   ├── components/    # Layout, Modal, common components
│   │   ├── context/       # AuthContext, LanguageContext, ToastContext
│   │   └── pages/         # Dashboard, Projects, Tasks, Calendar, Progress...
│   ├── backend/
│   │   ├── prisma/        # schema.prisma
│   │   └── src/
│   │       ├── routes/    # projects, tasks, users, templates, auth
│   │       └── index.js   # Express app
│   └── dist/              # Vite build (served by Express in production)
└── package.json           # Root scripts for Railway deployment
```

---

## Screenshots

### דשבורד ראשי
> סטטיסטיקות לחיצות, סקירת משימות אחרונות

### עמוד התקדמות
> גרף התקדמות לכל עובד, לחיצה על כל סטטוס לסינון ישיר

### פירוט פרויקט
> צוות, קבצים משותפים, תבניות משימות, סינון תוך-דף

---

## רישיון

MIT © 2026
