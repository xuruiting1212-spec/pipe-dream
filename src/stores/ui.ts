// ===== UI 状态管理 =====
// 管理侧栏、菜单、移动端等 UI 状态

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  /** 侧拉栏是否展开（移动端控制） */
  const sidebarOpen = ref(false)
  /** "我的发布"子菜单是否展开 */
  const publishMenuOpen = ref(false)
  /** "情景剧"子菜单是否展开 */
  const dramaMenuOpen = ref(false)
  /** 当前激活的内容分类 */
  const activeCategory = ref<string>('all')
  /** 是否正在加载 */
  const pageLoading = ref(false)

  /** 移动端判断 — 宽度 < 768px */
  const isMobile = computed(() => window.innerWidth < 768)

  /** 切换侧栏 */
  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value
  }
  function closeSidebar(): void {
    sidebarOpen.value = false
  }
  function openSidebar(): void {
    sidebarOpen.value = true
  }

  /** 切换发布子菜单 */
  function togglePublishMenu(): void {
    publishMenuOpen.value = !publishMenuOpen.value
  }

  /** 切换情景剧子菜单 */
  function toggleDramaMenu(): void {
    dramaMenuOpen.value = !dramaMenuOpen.value
  }

  /** 设置当前分类 */
  function setActiveCategory(category: string): void {
    activeCategory.value = category
  }

  return {
    sidebarOpen,
    publishMenuOpen,
    dramaMenuOpen,
    activeCategory,
    pageLoading,
    isMobile,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    togglePublishMenu,
    toggleDramaMenu,
    setActiveCategory,
  }
})
