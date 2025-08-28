import { createApp } from 'vue'
import App from './App.vue'
import { setupStore } from './store'
import 'virtual:uno.css'
import '@/styles/global.css'

const app = createApp(App)

setupStore(app)

app.mount('#app')
