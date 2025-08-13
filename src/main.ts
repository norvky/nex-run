import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import 'virtual:uno.css'

const app = createApp(App)

app.use(store)

app.mount('#app')
