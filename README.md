# TaskManager — Team Task Management System

> A full-stack project and task management app for organizations, with full Hebrew & English support.

🌐 **Live Demo:** [taskapp-production-11d4.up.railway.app](https://taskapp-production-11d4.up.railway.app)

---

## Features

### Tasks & Projects
- Create, edit and delete projects and tasks
- Filter by status, priority, assignee, project and due date
- Quick status switching (To Do / In Progress / Done) directly from the task card
- Monthly calendar view showing all tasks by due date

### Smart Dashboard
- Clickable stat cards — clicking a card navigates directly to the relevant filtered tasks
- Quick overview: total tasks, completed, in progress, overdue

### Team Progress Page
- Visual progress breakdown per employee (bar chart + progress bars)
- Click an employee → view all their tasks
- Click any status (Done / In Progress / To Do) → instant filtered view

### Smart Navigation in Projects
- Stat cards inside project detail → filter the task list in-page
- Click a team member → tasks page filtered by that employee + project

### Project Files
- Upload shared files for all project members (images, PDFs, Word, Excel, etc.)
- Download and delete files

### Task Templates
- Admins create reusable templates with title, description and priority
- When creating a task — choose a template to auto-fill the form fields

### AI Assistant (Claude AI)
- Built-in AI assistant for task management advice and project guidance

### UI & Accessibility
- **Full Hebrew & English support** — automatic RTL/LTR direction switching
- **Mobile responsive** — hamburger menu and sidebar overlay on small screens
- Toast notification system
- JWT-based authentication with Admin / Employee roles

---

## Tech Stack

### Frontend
| Technology | Usage |
|---|---|
| React 18 + Vite | UI Framework |
| React Router v6 | Navigation & SPA routing |
| Context API | State management (Auth, Language, Toast) |
| CSS Variables | Dynamic theming + RTL/LTR |

### Backend
| Technology | Usage |
|---|---|
| Node.js + Express | REST API server |
| Prisma ORM | Database access |
| SQLite | Database |
| JWT | User authentication |
| Multer | File uploads |
| bcrypt | Password hashing |

### DevOps
| Technology | Usage |
|---|---|
| Railway | Hosting + Continuous Deployment |
| GitHub | Source control + CI trigger |

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### Run the app

```bash
# Clone the repo
git clone https://github.com/Guyleor/TaskApp.git
cd TaskApp

# Install backend dependencies
cd task-manager/backend
npm install

# Set up the database
npx prisma db push

# Start backend (port 3002)
node src/index.js
```

```bash
# In a separate terminal — Frontend
cd task-manager
npm install
npm run dev
# Runs on port 5173
```

### Environment Variables (Backend)

Create a `.env` file inside `task-manager/backend/`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

---

## Demo Users

| Role | Email | Password |
|---|---|---|
| Admin | admin@company.com | admin123 |
| Employee | david@company.com | employee123 |

---

## Project Structure

```
TaskApp/
├── task-manager/
│   ├── src/
│   │   ├── api/           # client.js — all API calls
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

## License

MIT © 2026
