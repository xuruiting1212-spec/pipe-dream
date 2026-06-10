// ===== 路由配置 =====
// Vue Router 4 路由定义

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Pipe Dream — 首页' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录 — Pipe Dream' },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetail.vue'),
      meta: { title: '帖子详情 — Pipe Dream' },
    },
    {
      path: '/publish',
      name: 'publish',
      component: () => import('@/views/PublishView.vue'),
      meta: { title: '发布新帖 — Pipe Dream', requiresAuth: true },
    },
    {
      path: '/publish/:id',
      name: 'edit-post',
      component: () => import('@/views/PublishView.vue'),
      meta: { title: '编辑帖子 — Pipe Dream', requiresAuth: true },
    },
    {
      path: '/drafts',
      name: 'drafts',
      component: () => import('@/views/DraftsView.vue'),
      meta: { title: '草稿箱 — Pipe Dream', requiresAuth: true },
    },
    {
      path: '/private',
      name: 'private',
      component: () => import('@/views/PrivateView.vue'),
      meta: { title: '私有物 — Pipe Dream', requiresAuth: true },
    },
    {
      // 404 页面
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Pipe Dream' },
    },
  ],
  // 页面切换时滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  },
})

/**
 * 全局前置守卫 — 设置页面标题
 */
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
