import { createApp } from 'vue'
import App from './App.vue'
import { setupRouter } from './router'
import { setupStore } from './store'
import 'virtual:uno.css'
import '@/styles/global.css'

const app = createApp(App)

async function setupApp() {
  // 挂载状态管理器
  setupStore(app)
  // 挂载路由
  await setupRouter(app)

  app.mount('#app')
}

setupApp()
  .catch((error) => {
    console.error('Error in setup:', error)
  })
