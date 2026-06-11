import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const publishMenuOpen = ref(false)
  const dramaMenuOpen = ref(false)
  const towaMenuOpen = ref(false)
  const activeCategory = ref('all')

  const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 768)

  function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
  function closeSidebar() { sidebarOpen.value = false }
  function openSidebar() { sidebarOpen.value = true }
  function togglePublishMenu() { publishMenuOpen.value = !publishMenuOpen.value }
  function toggleDramaMenu() { dramaMenuOpen.value = !dramaMenuOpen.value }

  return { sidebarOpen, publishMenuOpen, dramaMenuOpen, towaMenuOpen, activeCategory, isMobile, toggleSidebar, closeSidebar, openSidebar, togglePublishMenu, toggleDramaMenu }
})
