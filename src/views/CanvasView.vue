<!-- CanvasView — Towa画板：人物卡片 + 心情瓶 + 日历 + 自由画板 -->
<template>
  <div class="animate-fade-in">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">🎨 画板</h1>

    <!-- 上半部分：左侧人物卡片+心情瓶，右侧自由画板 -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- 左侧栏 -->
      <div class="w-full lg:w-72 flex-shrink-0 space-y-4">
        <!-- 人物卡片 -->
        <div class="dream-card overflow-hidden">
          <div class="h-24 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 relative">
            <button v-if="authStore.isLoggedIn" @click="editingCard = true" class="absolute top-2 right-2 text-xs bg-white/70 px-2 py-1 rounded-full hover:bg-white">✏️</button>
          </div>
          <div class="px-4 pb-4 -mt-8 text-center">
            <div class="w-16 h-16 mx-auto rounded-full bg-purple-200 border-4 border-white shadow flex items-center justify-center text-2xl overflow-hidden">
              <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
              <span v-else>🌸</span>
            </div>
            <h3 class="font-bold text-gray-800 mt-2">{{ profile.name }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ profile.bio || '暂无简介' }}</p>
          </div>
        </div>

        <!-- 心情瓶 -->
        <div class="dream-card p-4 text-center relative">
          <button v-if="authStore.isLoggedIn" @click="showCalendar = !showCalendar" class="absolute top-3 right-3 text-lg" title="日历">📅</button>
          <div class="text-xs text-gray-400 mb-2">{{ currentMonthLabel }} 心情瓶</div>
          <div @click="showMoodPopup = true" class="cursor-pointer hover:scale-105 transition-transform">
            <div class="relative mx-auto w-24 h-32">
              <svg viewBox="0 0 100 140" class="w-full h-full">
                <path d="M20 40 Q20 100 50 120 Q80 100 80 40 L85 15 Q50 5 15 15 Z" fill="#e8e0f0" stroke="#ccc" stroke-width="1.5" />
              </svg>
              <div class="absolute inset-0 flex flex-wrap items-end justify-center pb-6 px-2 gap-0.5 content-end overflow-hidden" style="bottom:10px">
                <span v-for="(m, i) in jarMoods" :key="i" class="text-xs leading-none">{{ getMood(m)?.emoji || '🔮' }}</span>
              </div>
            </div>
          </div>
          <!-- 记录点滴 + 速写本 -->
          <div class="flex gap-2 mt-3">
            <button @click="showPublish = true" class="flex-1 text-xs bg-dream-100 text-dream-700 py-1.5 rounded-full hover:bg-dream-200">📝 记录点滴</button>
            <button @click="showSketchbook = true" class="flex-1 text-xs bg-purple-50 text-purple-600 py-1.5 rounded-full hover:bg-purple-100">📒 速写本</button>
          </div>
        </div>

        <!-- 编辑人物卡片弹窗 -->
        <div v-if="editingCard" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="editingCard = false">
          <div class="bg-white rounded-dream p-6 w-full max-w-sm shadow-dream-lg">
            <h3 class="font-bold text-gray-800 mb-4">编辑人物卡片</h3>
            <input v-model="profile.name" placeholder="名称" class="dream-input mb-3" />
            <textarea v-model="profile.bio" placeholder="简介" class="dream-input mb-3" rows="2" />
            <input v-model="profile.avatar_url" placeholder="头像URL" class="dream-input mb-3" />
            <input v-model="profile.cover_url" placeholder="背景图URL" class="dream-input mb-4" />
            <div class="flex gap-2">
              <button @click="saveProfile" class="flex-1 dream-btn-primary text-sm">保存</button>
              <button @click="editingCard = false" class="flex-1 bg-gray-100 text-gray-600 rounded-full py-2 text-sm">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：自由画板 -->
      <div class="flex-1 dream-card min-h-[500px] relative overflow-hidden" ref="canvasRef"
        @mousedown="startDraw" @mousemove="drawing" @mouseup="stopDraw" @mouseleave="stopDraw"
        @touchstart.prevent="startDrawTouch" @touchmove.prevent="drawingTouch" @touchend.prevent="stopDraw">
        <div class="absolute top-2 right-2 flex gap-1 z-10">
          <button v-for="tool in tools" :key="tool.type" @click="currentTool = tool.type; drawingColor = tool.color || drawingColor"
            class="text-xs px-2 py-1 rounded-full transition-all"
            :class="currentTool === tool.type ? 'bg-dream-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-dream-50'">
            {{ tool.emoji }}
          </button>
          <button @click="addText" class="text-xs px-2 py-1 rounded-full bg-white/80 text-gray-600 hover:bg-dream-50">Aa</button>
          <label class="text-xs px-2 py-1 rounded-full bg-white/80 text-gray-600 hover:bg-dream-50 cursor-pointer">
            🖼️<input type="file" accept="image/*" class="hidden" @change="addPhoto" />
          </label>
          <button @click="clearCanvas" class="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400 hover:bg-red-100">🗑️</button>
        </div>
        <!-- 画板元素 -->
        <div v-for="(item, i) in canvasItems" :key="i"
          class="absolute cursor-move select-none"
          :style="{ left: item.pos_x + 'px', top: item.pos_y + 'px', width: item.width + 'px', height: item.height + 'px', transform: 'rotate(' + item.rotation + 'deg)' }"
          @mousedown.stop="dragItem(i, $event)" @touchstart.stop="dragItemTouch(i, $event)">
          <img v-if="item.type === 'photo'" :src="item.content" class="w-full h-full object-cover rounded" />
          <span v-else-if="item.type === 'sticker'" class="text-4xl">{{ item.content }}</span>
          <div v-else-if="item.type === 'text'" :style="{ color: item.color, fontSize: (item.font_size || 16) + 'px' }" class="whitespace-pre-wrap">{{ item.content }}</div>
          <button @click.stop="removeCanvasItem(i)" class="absolute -top-2 -right-2 w-5 h-5 bg-red-400 text-white rounded-full text-xs opacity-0 hover:opacity-100 group-hover:opacity-100">✕</button>
        </div>
      </div>
    </div>

    <!-- 心情弹窗 -->
    <div v-if="showMoodPopup" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="closeMoodPopup">
      <div class="bg-white rounded-dream-xl p-6 w-full max-w-lg shadow-dream-lg">
        <h3 class="font-bold text-gray-800 mb-4 text-center">今日心情</h3>
        <div class="text-xs text-gray-400 text-center mb-4">{{ todayStr }}</div>
        <!-- 我的心情行（圆形） -->
        <div class="mb-4">
          <div class="text-sm font-medium text-gray-600 mb-2">💕 我的今日心情</div>
          <div class="flex flex-wrap gap-3 justify-center">
            <div v-for="(cfg, type) in MOOD_CONFIG" :key="'my-'+type" @click="myMood = type as string"
              class="w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-110 border-2"
              :style="{ background: cfg.color, borderColor: myMood === type ? '#333' : 'transparent' }">
              {{ cfg.emoji }}
              <span class="text-[8px] absolute -bottom-4 whitespace-nowrap text-gray-400">{{ cfg.label }}</span>
            </div>
          </div>
        </div>
        <!-- Towa的心情行（方块） -->
        <div class="mb-6">
          <div class="text-sm font-medium text-gray-600 mb-2">💖 Towa的今日心情</div>
          <div class="flex flex-wrap gap-3 justify-center">
            <div v-for="(cfg, type) in MOOD_CONFIG" :key="'towa-'+type" @click="towaMood = type as string"
              class="w-12 h-12 rounded-lg flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-110 border-2"
              :style="{ background: cfg.color, borderColor: towaMood === type ? '#333' : 'transparent' }">
              {{ cfg.emoji }}
              <span class="text-[8px] absolute -bottom-4 whitespace-nowrap text-gray-400">{{ cfg.label }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <button @click="saveMood" class="flex-1 bg-gradient-to-r from-dream-500 to-purple-500 text-white py-2.5 rounded-full font-medium text-sm">确定</button>
          <button @click="closeMoodPopup" class="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-full text-sm">取消</button>
        </div>
      </div>
    </div>

    <!-- 日历弹窗 -->
    <div v-if="showCalendar" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="showCalendar=false">
      <div class="bg-white rounded-dream-xl p-6 w-full max-w-md shadow-dream-lg max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <button @click="calYear--" class="text-sm">◀</button>
          <select v-model="calYear" class="text-xs border rounded px-2 py-1"><option v-for="y in years" :key="y" :value="y">{{ y }}</option></select>
          <select v-model="calMonth" class="text-xs border rounded px-2 py-1"><option v-for="(m,i) in months" :key="i" :value="i+1">{{ m }}</option></select>
          <button @click="calYear++" class="text-sm">▶</button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs">
          <span v-for="d in '日一二三四五六'.split('')" :key="d" class="text-gray-400 py-1">{{ d }}</span>
          <div v-for="day in calDays" :key="day.key" class="py-1 cursor-pointer rounded hover:bg-dream-50 min-h-[44px]"
            :class="{ 'bg-dream-100': day.date === todayStr }" @click="openDayMood(day.date)">
            <div class="text-gray-600" :class="{ 'text-gray-300': !day.currentMonth }">{{ day.day }}</div>
            <div v-if="day.myMood" class="text-[10px]">{{ getMood(day.myMood)?.emoji || '' }}</div>
            <div v-if="day.towaMood" class="text-[8px]">▪</div>
          </div>
        </div>
        <!-- 日历日心情编辑 -->
        <div v-if="editDayDate" class="mt-4 p-4 bg-dream-50 rounded-dream">
          <div class="text-sm font-medium mb-3">📅 {{ editDayDate }}</div>
          <div class="grid grid-cols-2 gap-2">
            <div><div class="text-xs text-gray-500 mb-1">💕 我的</div>
              <select v-model="editMyMood" class="dream-input text-xs"><option value="">—</option><option v-for="(c,t) in MOOD_CONFIG" :key="t" :value="t">{{ c.emoji }} {{ c.label }}</option></select>
            </div>
            <div><div class="text-xs text-gray-500 mb-1">💖 Towa</div>
              <select v-model="editTowaMood" class="dream-input text-xs"><option value="">—</option><option v-for="(c,t) in MOOD_CONFIG" :key="t" :value="t">{{ c.emoji }} {{ c.label }}</option></select>
            </div>
          </div>
          <button @click="saveDayMood" class="dream-btn-primary w-full mt-3 text-sm">保存</button>
        </div>
        <button @click="showCalendar=false" class="w-full mt-4 bg-gray-100 text-gray-600 py-2 rounded-full text-sm">关闭</button>
      </div>
    </div>

    <!-- 记录点滴/发布弹窗 -->
    <div v-if="showPublish" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="showPublish=false">
      <div class="bg-white rounded-dream-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-dream-lg">
        <h3 class="font-bold text-gray-800 mb-4">📝 记录点滴</h3>
        <input v-model="pubForm.title" placeholder="标题" class="dream-input mb-3" />
        <div class="flex flex-col md:flex-row gap-3 mb-3">
          <textarea v-model="pubForm.content" placeholder="正文 (Markdown)" class="dream-input flex-1 min-h-[200px] font-mono text-sm" />
          <div class="flex-1 dream-input markdown-body bg-white/60 min-h-[200px] overflow-y-auto" v-html="renderMd(pubForm.content)" />
        </div>
        <TagInput :tags="pubForm.tags" @update:tags="pubForm.tags = $event" />
        <div class="mb-3"><VisibilitySelect v-model="pubForm.visibility" /></div>
        <ImageUploader :images="pubForm.images" @update:images="pubForm.images = $event" />
        <div class="flex gap-2 mt-4">
          <button @click="saveTowaDraft" class="dream-btn-ghost text-sm">📒 存速写本</button>
          <button @click="publishTowa" class="flex-1 bg-gradient-to-r from-dream-500 to-purple-500 text-white py-2.5 rounded-full font-medium text-sm">💖 发布</button>
        </div>
      </div>
    </div>

    <!-- 速写本 -->
    <div v-if="showSketchbook" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="showSketchbook=false">
      <div class="bg-white rounded-dream-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-dream-lg">
        <h3 class="font-bold text-gray-800 mb-4">📒 速写本</h3>
        <div v-if="sketchList.length" class="space-y-2">
          <div v-for="s in sketchList" :key="s.id" class="flex items-center gap-2 p-3 rounded-dream-sm bg-gray-50 hover:bg-dream-50 cursor-pointer">
            <div class="flex-1 min-w-0" @click="editSketch(s)">
              <div class="text-sm font-medium truncate">{{ s.title || '未命名' }}</div>
              <div class="text-xs text-gray-400">{{ fmtDate(s.created_at) }}</div>
            </div>
            <button @click.stop="delSketch(s.id)" class="text-gray-300 hover:text-red-400">🗑️</button>
          </div>
        </div>
        <p v-else class="text-center text-gray-400 text-sm py-8">速写本是空的</p>
        <button @click="showSketchbook=false" class="w-full mt-4 bg-gray-100 text-gray-600 py-2 rounded-full text-sm">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { MOOD_CONFIG, type MoodType, type CanvasItem } from '@/types'
import TagInput from '@/components/publish/TagInput.vue'
import VisibilitySelect from '@/components/publish/VisibilitySelect.vue'
import ImageUploader from '@/components/publish/ImageUploader.vue'
import { marked } from 'marked'

const authStore = useAuthStore()
const profile = reactive({ name: 'Towa', bio: '', avatar_url: '', cover_url: '' })
const editingCard = ref(false)
const myMood = ref(''); const towaMood = ref('')
const showMoodPopup = ref(false); const showCalendar = ref(false); const showPublish = ref(false); const showSketchbook = ref(false)
const todayStr = new Date().toISOString().split('T')[0]
const jarMoods = ref<string[]>([])
const allMoods = ref<Record<string, { my?: string; towa?: string }>>({})

// 日历
const calYear = ref(new Date().getFullYear()); const calMonth = ref(new Date().getMonth() + 1)
const years = computed(() => Array.from({ length: 5 }, (_, i) => calYear.value - 2 + i))
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const calDays = computed(() => {
  const first = new Date(calYear.value, calMonth.value - 1, 1)
  const last = new Date(calYear.value, calMonth.value, 0)
  const days: any[] = []
  for (let i = 0; i < first.getDay(); i++) days.push({ day: '', key: 'pad-' + i, currentMonth: false })
  for (let d = 1; d <= last.getDate(); d++) {
    const ds = `${calYear.value}-${String(calMonth.value).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ day: d, key: ds, currentMonth: true, date: ds, ...(allMoods.value[ds] || {}) })
  }
  return days
})
const editDayDate = ref(''); const editMyMood = ref(''); const editTowaMood = ref('')

// 画板
const canvasRef = ref<HTMLElement | null>(null)
const canvasItems = ref<CanvasItem[]>([])
const currentTool = ref('sticker')
const drawingColor = ref('#e91e63')
const isDrawing = ref(false)
const tools = [
  { type: 'sticker', emoji: '💗', color: '#f8bbd0' }, { type: 'sticker', emoji: '🌟', color: '#fdd835' },
  { type: 'sticker', emoji: '🌸', color: '#f48fb1' }, { type: 'sticker', emoji: '🍀', color: '#66bb6a' },
  { type: 'sticker', emoji: '🌈', color: '#42a5f5' }, { type: 'sticker', emoji: '💫', color: '#ce93d8' },
  { type: 'sticker', emoji: '🔥', color: '#ef5350' }, { type: 'sticker', emoji: '💧', color: '#42a5f5' },
]

// 发布表单
const pubForm = reactive({ title: '', content: '', tags: [] as string[], visibility: 'public' as string, images: [] as string[] })
const sketchList = ref<any[]>([])

const currentMonthLabel = computed(() => `${calYear.value}年${calMonth.value}月`)
function getMood(t: string) { return (MOOD_CONFIG as Record<string, { emoji: string; color: string; label: string }>)[t] }

function renderMd(s: string) { return marked.parse(s || '', { breaks: true, gfm: true }) as string }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('zh-CN') : '' }

// ===== 心情相关 =====
async function loadMoods() {
  const { data } = await supabase.from('moods').select('*').order('date')
  if (data) {
    allMoods.value = {}
    for (const m of data) allMoods.value[m.date] = { my: (m as any).my_mood || undefined, towa: (m as any).towa_mood || undefined }
    // 填充当月 jar
    const prefix = `${calYear.value}-${String(calMonth.value).padStart(2,'0')}`
    jarMoods.value = data.filter((m: any) => m.date.startsWith(prefix) && m.my_mood).map((m: any) => m.my_mood)
  }
}

async function saveMood() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('moods').upsert({ user_id: user.id, date: todayStr, my_mood: myMood.value || undefined, towa_mood: towaMood.value || undefined } as any, { onConflict: 'user_id,date' })
  showMoodPopup.value = false
  await loadMoods()
}

function closeMoodPopup() { showMoodPopup.value = false }

function openDayMood(date: string) {
  if (!date) return
  editDayDate.value = date
  editMyMood.value = allMoods.value[date]?.my || ''
  editTowaMood.value = allMoods.value[date]?.towa || ''
}

async function saveDayMood() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('moods').upsert({ user_id: user.id, date: editDayDate.value, my_mood: editMyMood.value || undefined, towa_mood: editTowaMood.value || undefined } as any, { onConflict: 'user_id,date' })
  editDayDate.value = ''
  await loadMoods()
}

// ===== 画板相关 =====
async function loadCanvas() {
  const { data } = await supabase.from('canvas_items').select('*').order('created_at')
  if (data) canvasItems.value = data as CanvasItem[]
}

async function saveCanvas() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('canvas_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const items: any[] = canvasItems.value.map(i => ({ type: i.type, content: i.content, pos_x: i.pos_x, pos_y: i.pos_y, width: i.width, height: i.height, rotation: i.rotation, color: i.color, font_size: i.font_size, user_id: user.id }))
  if (items.length) await supabase.from('canvas_items').insert(items as any)
}

let dragIdx = -1, dragOffX = 0, dragOffY = 0
function dragItem(i: number, e: MouseEvent) { dragIdx = i; dragOffX = e.offsetX; dragOffY = e.offsetY }
function dragItemTouch(i: number, e: TouchEvent) { dragIdx = i; dragOffX = e.touches[0].clientX - canvasItems.value[i].pos_x; dragOffY = e.touches[0].clientY - canvasItems.value[i].pos_y }
function startDraw(e: MouseEvent) { if (currentTool.value === 'sticker') addSticker(e) }
function startDrawTouch(e: TouchEvent) { if (currentTool.value === 'sticker') addStickerTouch(e) }
function drawing(e: MouseEvent) { if (dragIdx < 0) return; e.preventDefault(); canvasItems.value[dragIdx].pos_x = e.offsetX - dragOffX; canvasItems.value[dragIdx].pos_y = e.offsetY - dragOffY }
function drawingTouch(e: TouchEvent) { if (dragIdx < 0) return; const rect = canvasRef.value?.getBoundingClientRect(); if (!rect) return; canvasItems.value[dragIdx].pos_x = e.touches[0].clientX - rect.left - dragOffX; canvasItems.value[dragIdx].pos_y = e.touches[0].clientY - rect.top - dragOffY }
function stopDraw() { if (dragIdx >= 0) { saveCanvas(); dragIdx = -1 } }

function addSticker(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect(); if (!rect) return
  const tool = tools.find(t => t.type === 'sticker' && t.color === drawingColor.value) || tools[0]
  canvasItems.value.push({ type: 'sticker', content: tool.emoji, pos_x: e.clientX - rect.left - 20, pos_y: e.clientY - rect.top - 20, width: 48, height: 48, rotation: 0, color: tool.color })
  saveCanvas()
}
function addStickerTouch(e: TouchEvent) {
  const rect = canvasRef.value?.getBoundingClientRect(); if (!rect) return
  const tool = tools.find(t => t.type === 'sticker' && t.color === drawingColor.value) || tools[0]
  canvasItems.value.push({ type: 'sticker', content: tool.emoji, pos_x: e.touches[0].clientX - rect.left - 20, pos_y: e.touches[0].clientY - rect.top - 20, width: 48, height: 48, rotation: 0, color: tool.color })
  saveCanvas()
}
function addText() {
  const txt = prompt('输入文字:')
  if (!txt) return
  canvasItems.value.push({ type: 'text', content: txt, pos_x: 100, pos_y: 100, width: 200, height: 40, rotation: 0, color: drawingColor.value, font_size: 20 })
  saveCanvas()
}
async function addPhoto(e: Event) {
  const input = e.target as HTMLInputElement; if (!input.files?.[0]) return
  const file = input.files[0]; const ext = file.name.split('.').pop()
  const name = `canvas-${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from('posts-media').upload(`canvas/${name}`, file, { cacheControl: '31536000', upsert: false })
  if (error) { alert('上传失败'); return }
  const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
  canvasItems.value.push({ type: 'photo', content: urlData.publicUrl, pos_x: 50, pos_y: 50, width: 200, height: 200, rotation: 0 })
  saveCanvas()
  input.value = ''
}
function removeCanvasItem(i: number) { canvasItems.value.splice(i, 1); saveCanvas() }
async function clearCanvas() { if (!confirm('清除所有画板内容？')) return; canvasItems.value = []; await supabase.from('canvas_items').delete().neq('id', '00000000-0000-0000-0000-000000000000') }

// ===== 人物卡片 =====
async function loadProfile() {
  const { data } = await supabase.from('towa_profile').select('*').limit(1).single()
  if (data) { const d = data as any; profile.name = d.name; profile.bio = d.bio || ''; profile.avatar_url = d.avatar_url || ''; profile.cover_url = d.cover_url || '' }
}
async function saveProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const existing = await supabase.from('towa_profile').select('id').limit(1).single()
  if (existing.data) await supabase.from('towa_profile').update({ name: profile.name, bio: profile.bio, avatar_url: profile.avatar_url || null, cover_url: profile.cover_url || null } as any).eq('id', existing.data.id)
  else await supabase.from('towa_profile').insert({ name: profile.name, bio: profile.bio, avatar_url: profile.avatar_url || null, cover_url: profile.cover_url || null, user_id: user.id } as any)
  editingCard.value = false
}

// ===== 记录点滴 =====
async function publishTowa() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return
  const { error } = await supabase.from('posts').insert({ title: pubForm.title, content: pubForm.content, type: '日常', tags: pubForm.tags, visibility: pubForm.visibility, images: pubForm.images, is_draft: false, author_type: 'towa', user_id: user.id })
  if (error) { alert('发布失败'); return }
  showPublish.value = false; pubForm.title = ''; pubForm.content = ''; pubForm.tags = []; pubForm.images = []
}
async function saveTowaDraft() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return
  const existing = sketchList.value.find(s => !s.title)
  if (existing) await supabase.from('sketchbook').update({ title: pubForm.title, content: pubForm.content, tags: pubForm.tags, visibility: pubForm.visibility, images: pubForm.images }).eq('id', existing.id)
  else await supabase.from('sketchbook').insert({ title: pubForm.title, content: pubForm.content, tags: pubForm.tags, visibility: pubForm.visibility, images: pubForm.images, user_id: user.id, is_draft: true })
  showPublish.value = false
}

// ===== 速写本 =====
async function loadSketchbook() {
  const { data } = await supabase.from('sketchbook').select('*').eq('is_draft', true).is('deleted_at', null).order('created_at', { ascending: false })
  if (data) sketchList.value = data
}
function editSketch(s: any) { pubForm.title = s.title; pubForm.content = s.content; pubForm.tags = s.tags || []; pubForm.visibility = s.visibility; pubForm.images = s.images || []; showSketchbook.value = false; showPublish.value = true }
async function delSketch(id: string) { await supabase.from('sketchbook').update({ deleted_at: new Date().toISOString() }).eq('id', id); await loadSketchbook() }

onMounted(async () => {
  await Promise.all([loadMoods(), loadCanvas(), loadProfile(), loadSketchbook()])
})
</script>
