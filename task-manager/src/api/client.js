const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const options = { method, headers }
  if (body) options.body = isFormData ? body : JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return data
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  getMe: () => request('GET', '/auth/me'),

  // Projects
  getProjects: () => request('GET', '/projects'),
  createProject: (data) => request('POST', '/projects', data),
  updateProject: (id, data) => request('PUT', `/projects/${id}`, data),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),

  // Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('GET', `/tasks${qs ? '?' + qs : ''}`)
  },
  getTaskStats: () => request('GET', '/tasks/stats'),
  getCalendarTasks: (year, month) => request('GET', `/tasks/calendar?year=${year}&month=${month}`),
  getTask: (id) => request('GET', `/tasks/${id}`),
  createTask: (data) => request('POST', '/tasks', data),
  updateTask: (id, data) => request('PUT', `/tasks/${id}`, data),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  // Users
  getUsers: () => request('GET', '/users'),
  createUser: (data) => request('POST', '/users', data),
  updateUser: (id, data) => request('PUT', `/users/${id}`, data),
  deleteUser: (id) => request('DELETE', `/users/${id}`),
  getUsersProgress: () => request('GET', '/users/progress'),

  // Comments
  addComment: (taskId, content) => request('POST', `/comments/task/${taskId}`, { content }),
  deleteComment: (id) => request('DELETE', `/comments/${id}`),

  // Attachments
  uploadFiles: (taskId, formData) => request('POST', `/attachments/task/${taskId}`, formData, true),
  deleteAttachment: (id) => request('DELETE', `/attachments/${id}`),

  // AI
  generateDescription: (title, projectName) => request('POST', '/ai/describe', { title, projectName }),
}
