const useSettingsStore = defineStore('settings', {
  state: () => ({
    isDark: false,
  }),
  actions: {
    toggleDark() {
      this.isDark = !this.isDark
    },
  },
})

export default useSettingsStore
