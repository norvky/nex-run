// import { invoke } from '@tauri-apps/api/core'

export interface AppStore {
  isDark: boolean
}

export const useAppStore = defineStore('app', {
  state: () => ({
    isDark: false,
  }),
  actions: {
    toggleDark() {
      this.isDark = !this.isDark
    },
    // async initFromDB() {
    //   try {
    //     const appStore: AppStore = await invoke('get_app_store')
    //     this.isDark = appStore.isDark
    //   } catch (error) {
    //     console.error('Failed to initialize app store from DB:', error)
    //   }
    // },
  },
})
