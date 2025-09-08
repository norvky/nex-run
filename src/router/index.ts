import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: async () => import('../views/home/index.vue'),
    },
  ],
})

export async function setupRouter(app: App) {
  app.use(router)
}
