<template>
  <div v-if="uiStore.sidebarOpen" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" @click="uiStore.closeSidebar()" />
  <aside class="fixed md:sticky top-0 right-0 h-screen md:h-auto w-[280px] flex-shrink-0 z-50 bg-white/70 backdrop-blur-xl border-l border-dream-100/50
    flex flex-col items-center px-5 py-8 overflow-y-auto transition-transform duration-300 ease-out shadow-dream-lg md:shadow-none"
    :class="{ 'translate-x-0': uiStore.sidebarOpen || !uiStore.isMobile, 'translate-x-full': !uiStore.sidebarOpen && uiStore.isMobile }">
    <button class="md:hidden absolute top-4 left-4 text-gray-400 hover:text-gray-600 text-2xl" @click="uiStore.closeSidebar()">✕</button>

    <div class="relative w-full mb-4">
      <div class="w-full h-24 rounded-dream bg-gradient-to-br from-dream-200 via-purple-200 to-pink-200 flex items-center justify-center overflow-hidden relative" :style="profile.cover_url ? { backgroundImage: 'url('+profile.cover_url+')', backgroundSize: 'cover', backgroundPosition: 'center' } : {}">
        <button v-if="authStore.isLoggedIn" @click="showEdit = true" class="absolute top-2 right-2 text-xs bg-white/70 px-2 py-1 rounded-full hover:bg-white transition-all">✏️</button>
      </div>
      <div class="flex justify-center -mt-8 relative z-10">
        <div class="w-16 h-16 rounded-full border-[3px] border-white shadow-dream flex items-center justify-center text-2xl overflow-hidden" :style="profile.avatar_url ? {} : { background: 'linear-gradient(135deg, #ce93d8, #f48fb1)' }">
          <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
          <span v-else>🌸</span>
        </div>
      </div>
    </div>
    <h2 class="text-lg font-bold text-gray-800">{{ profile.name }}</h2>
    <p class="text-xs text-purple-400 mb-5 text-center">{{ profile.bio }}</p>

    <!-- 编辑侧栏资料弹窗 -->
    <div v-if="showEdit" class="fixed inset-0 z-[130] flex items-center justify-center bg-black/40" @click.self="showEdit = false">
      <div class="bg-white rounded-3xl p-6 w-[320px] shadow-dream-lg relative">
        <button @click="showEdit=false; loadProfile()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h3 class="font-bold text-gray-800 mb-4">编辑个人资料</h3>
        <input v-model="profile.name" placeholder="昵称" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-dream-300" />
        <textarea v-model="profile.bio" placeholder="简介" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-dream-300" rows="2" />

        <!-- 头像上传 -->
        <label class="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer hover:text-dream-600 transition-colors">
          <span class="text-lg">📷</span><span>{{ profile.avatar_url ? '✅ 已设头像（点此更换）' : '上传头像 (1:1 正方形)' }}</span>
          <input type="file" accept="image/*" class="hidden" @change="handleAvatarFile" />
        </label>

        <!-- 背景上传 -->
        <label class="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer hover:text-dream-600 transition-colors">
          <span class="text-lg">🖼️</span><span>{{ profile.cover_url ? '✅ 已设背景（点此更换）' : '上传背景图 (2:1 横幅)' }}</span>
          <input type="file" accept="image/*" class="hidden" @change="handleCoverFile" />
        </label>

        <div class="flex gap-2">
          <button @click="saveProfile" class="flex-1 bg-gradient-to-r from-dream-500 to-purple-500 text-white py-2 rounded-full text-sm font-medium">保存</button>
          <button @click="showEdit=false; loadProfile()" class="flex-1 bg-gray-100 text-gray-600 py-2 rounded-full text-sm">取消</button>
        </div>
      </div>
    </div>

    <!-- 裁剪弹窗 -->
    <ImageCropModal v-if="cropSrc" :src="cropSrc" :title="cropTitle" :aspectRatio="cropRatio" :cropHint="cropHint" @close="cropSrc=''" @cropped="onCropDone" />

    <nav class="w-full flex flex-col gap-2.5">
      <button v-if="authStore.isLoggedIn" @click="nav('/publish')" class="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-dream-500 to-purple-500 shadow-dream-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center text-sm">➕ 增添新内容</button>
      <button v-if="authStore.isLoggedIn" @click="nav('/drafts')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>📋</span>我的草稿</button>

      <!-- 我的发布 -->
      <div class="flex flex-col">
        <button @click="uiStore.togglePublishMenu()" class="dream-btn-ghost text-left flex items-center gap-3 w-full text-sm"><span>📂</span>我的发布<span class="ml-auto transition-transform" :class="{ 'rotate-180': uiStore.publishMenuOpen }">▾</span></button>
        <div v-if="uiStore.publishMenuOpen" class="ml-8 mt-2 flex flex-col gap-1 animate-fade-in">
          <button @click="nav('/?type=日常')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">🌸 日常</button>
          <button @click="nav('/?type=碎碎念')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">💭 碎碎念</button>
          <div>
            <button @click="uiStore.toggleDramaMenu()" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left w-full">🎭 情景剧 <span class="text-[10px]" :class="{ 'rotate-180': uiStore.dramaMenuOpen }">▾</span></button>
            <div v-if="uiStore.dramaMenuOpen" class="ml-4 flex flex-col gap-1 animate-fade-in">
              <button @click="nav('/?type=情景剧&subtype=亲密')" class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 text-left">💕 亲密</button>
              <button @click="nav('/?type=情景剧&subtype=约会')" class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 text-left">💑 约会</button>
              <button @click="nav('/?type=情景剧&subtype=日常')" class="text-xs text-gray-500 hover:text-dream-500 py-1 px-3 rounded hover:bg-dream-50 text-left">🌿 日常</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间线总览（独立板块） -->
      <button @click="nav('/')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>🕐</span>时间线总览</button>

      <!-- Towa 下拉栏 -->
      <div class="flex flex-col">
        <button @click="uiStore.towaMenuOpen = !uiStore.towaMenuOpen" class="dream-btn-ghost text-left flex items-center gap-3 w-full text-sm">
          <span>💖</span>Towa<span class="ml-auto transition-transform" :class="{ 'rotate-180': uiStore.towaMenuOpen }">▾</span>
        </button>
        <div v-if="uiStore.towaMenuOpen" class="ml-8 mt-2 flex flex-col gap-1 animate-fade-in">
          <button @click="nav('/canvas')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">🎨 画板</button>
          <button @click="nav('/towa-posts')" class="text-sm text-gray-600 hover:text-dream-600 py-1.5 px-3 rounded-lg hover:bg-dream-50 text-left">💬 Towa的发布</button>
        </div>
      </div>

      <button v-if="authStore.isLoggedIn" @click="nav('/private')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>🔒</span>私有物</button>
      <button v-if="authStore.isLoggedIn" @click="nav('/trash')" class="dream-btn-ghost text-left flex items-center gap-3 text-sm"><span>🗑️</span>最近删除</button>
    </nav>

    <div class="mt-auto pt-8 w-full">
      <button v-if="authStore.isLoggedIn" @click="handleLogout" class="w-full text-xs text-gray-400 hover:text-dream-500 py-2">退出登录</button>
      <button v-else @click="nav('/login')" class="w-full text-xs text-gray-400 hover:text-dream-500 py-2">🔑 管理员登录</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'; import { useAuthStore } from '@/stores/auth'; import { useUiStore } from '@/stores/ui'
import { supabase } from '@/composables/useSupabase'
import ImageCropModal from '@/components/common/ImageCropModal.vue'
const router = useRouter(); const authStore = useAuthStore(); const uiStore = useUiStore()
function nav(path: string): void { router.push(path); uiStore.closeSidebar() }
async function handleLogout(): Promise<void> { await authStore.logout(); uiStore.closeSidebar() }

const showEdit = ref(false)
const profile = reactive({ name: 'XRT', bio: '✨ Pipe Dream · 白日梦收集者', avatar_url: '', cover_url: '' })

// 裁剪相关
const cropSrc = ref(''); const cropTitle = ref(''); const cropRatio = ref(1); const cropHint = ref('')
let cropTarget: 'avatar' | 'cover' = 'avatar'

function handleAvatarFile(e: Event) { pickFile(e, 'avatar') }
function handleCoverFile(e: Event) { pickFile(e, 'cover') }

function pickFile(e: Event, target: 'avatar' | 'cover') {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    cropSrc.value = reader.result as string
    cropTarget = target
    if (target === 'avatar') { cropTitle.value = '裁剪头像'; cropRatio.value = 1; cropHint.value = '1:1 正方形 · 拖拽移动 · 滚轮缩放' }
    else { cropTitle.value = '裁剪背景'; cropRatio.value = 2; cropHint.value = '2:1 横幅 · 拖拽移动 · 滚轮缩放' }
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function onCropDone(blob: Blob) {
  cropSrc.value = ''
  const file = new File([blob], `${cropTarget}-${Date.now()}.png`, { type: 'image/png' })
  const { data, error } = await supabase.storage.from('posts-media').upload(`profiles/${file.name}`, file, { upsert: true })
  if (error) { alert('上传失败: ' + error.message); return }
  const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
  if (cropTarget === 'avatar') profile.avatar_url = urlData.publicUrl
  else profile.cover_url = urlData.publicUrl
  saveProfile()
}

async function loadProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('profile_type', 'side').limit(1).single()
  if (data) { const d = data as any; profile.name = d.name || 'XRT'; profile.bio = d.bio || '✨ Pipe Dream · 白日梦收集者'; profile.avatar_url = d.avatar_url || ''; profile.cover_url = d.cover_url || '' }
  else { try { const saved = localStorage.getItem('pipe-dream-profile'); if (saved) Object.assign(profile, JSON.parse(saved)) } catch {} }
}
async function saveProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  const existing = await supabase.from('profiles').select('id').eq('profile_type', 'side').limit(1).single()
  const row = { name: profile.name, bio: profile.bio, avatar_url: profile.avatar_url || null, cover_url: profile.cover_url || null, profile_type: 'side', user_id: user?.id } as any
  if (existing.data) await supabase.from('profiles').update(row).eq('id', existing.data.id)
  else await supabase.from('profiles').insert(row)
  showEdit.value = false
}
onMounted(() => loadProfile())
</script>
