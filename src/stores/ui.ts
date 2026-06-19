import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const publishMenuOpen = ref(false)
  const dramaMenuOpen = ref(false)
  const towaMenuOpen = ref(false)
  const activeCategory = ref('all')

  // 窗口宽度 — 用 ref 才能让 Vue 追踪变化（computed 读 window.innerWidth 不是响应式的）
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  function onResize() { windowWidth.value = window.innerWidth }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize, { passive: true })
  }
  const isMobile = computed(() => windowWidth.value < 768)

  function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
  function closeSidebar() { sidebarOpen.value = false }
  function openSidebar() { sidebarOpen.value = true }
  function togglePublishMenu() { publishMenuOpen.value = !publishMenuOpen.value }
  function toggleDramaMenu() { dramaMenuOpen.value = !dramaMenuOpen.value }

  return { sidebarOpen, publishMenuOpen, dramaMenuOpen, towaMenuOpen, activeCategory, isMobile, toggleSidebar, closeSidebar, openSidebar, togglePublishMenu, toggleDramaMenu }
})
