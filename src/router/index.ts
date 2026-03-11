import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/view/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/view/ForgotPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/view/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/activate',
    name: 'activate',
    component: () => import('@/view/ActivateAccountView.vue'),
    meta: { public: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/view/ResetPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/employees/create',
    name: 'employee-create',
    component: () => import('@/view/CreateEmployeeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/employees',
    name: 'employees',
    component: () => import('@/view/EmployeeListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/employees/:id',
    name: 'employee-detail',
    component: () => import('@/view/EmployeeDetailView.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    await auth.tryRestoreSession()

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
