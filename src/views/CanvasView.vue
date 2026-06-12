<!-- CanvasView — 透明墙面画板 + 大型真实玻璃心情瓶 -->
<template>
  <div class="animate-fade-in flex flex-col" style="min-height:calc(100vh - 100px)">
    <h1 class="text-2xl font-bold text-gray-800 mb-3">🎨 画板</h1>

    <!-- 移动端：外层可横向滚动，桌面端正常 -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden rounded-2xl">
    <div class="relative rounded-2xl"
      style="background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(252,228,236,0.08) 50%, rgba(243,229,245,0.12) 100%);
             min-height: 600px; min-width: max(100%, 700px);"
      ref="canvasRef"
      @mousedown="startDraw" @mousemove="drawing" @mouseup="stopDraw" @mouseleave="stopDraw"
      @touchstart.passive="startDrawTouch" @touchmove.passive="drawingTouch" @touchend="stopDraw">

      <!-- 人物卡片（左上角，稍大） -->
      <div class="absolute top-4 left-4 z-20 w-60 rounded-2xl overflow-hidden shadow-dream"
        style="background: rgba(255,255,255,0.75); backdrop-filter: blur(12px);">
        <div class="h-24 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 relative" :style="profile.cover_url ? { backgroundImage: 'url('+profile.cover_url+')', backgroundSize: 'cover', backgroundPosition: 'center' } : {}">
          <button v-if="authStore.isLoggedIn" @click="editingCard = true" class="absolute top-2 right-2 text-xs bg-white/70 px-2 py-1 rounded-full hover:bg-white transition-all">✏️</button>
        </div>
        <div class="px-4 pb-4 -mt-8 text-center relative z-10">
          <div class="w-16 h-16 mx-auto rounded-full border-[3px] border-white shadow flex items-center justify-center text-2xl overflow-hidden relative"
            :style="profile.avatar_url ? {} : { background: 'linear-gradient(135deg, #ce93d8, #f48fb1)' }">
            <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover absolute inset-0" />
            <span v-if="!profile.avatar_url">🌸</span>
          </div>
          <h3 class="font-bold text-base text-gray-800 mt-2">{{ profile.name }}</h3>
          <p class="text-xs text-gray-500 leading-tight mt-1">{{ profile.bio || '暂无简介' }}</p>
        </div>
      </div>

      <!-- 工具栏（右上角浮动，仅登录用户） -->
      <div v-if="authStore.isLoggedIn" class="absolute top-4 right-4 z-20 flex flex-wrap gap-1.5 px-3 py-2 rounded-2xl"
        style="background: rgba(255,255,255,0.55); backdrop-filter: blur(10px);">
        <button v-for="tool in tools" :key="tool.emoji"
          @click="toggleSticker(tool)"
          class="w-8 h-8 rounded-full text-lg flex items-center justify-center transition-all hover:scale-110"
          :class="stickerActive && drawingColor === tool.color ? 'ring-2 ring-gray-600 scale-110' : 'opacity-60 hover:opacity-90'"
          :style="{ background: tool.color }">
          {{ tool.emoji }}
        </button>
        <button @click="stickerActive = false; addText()" class="w-8 h-8 rounded-full bg-white/80 text-gray-600 text-sm font-bold flex items-center justify-center hover:bg-white transition-all">Aa</button>
        <label class="w-8 h-8 rounded-full bg-white/80 text-gray-600 text-sm flex items-center justify-center cursor-pointer hover:bg-white transition-all">
          🖼️<input type="file" accept="image/*" class="hidden" @change="addPhoto" />
        </label>
        <button @click="clearCanvas" class="w-8 h-8 rounded-full bg-red-50 text-red-400 text-sm flex items-center justify-center hover:bg-red-100 transition-all">🗑️</button>
        <!-- 取消选择 -->
        <button v-if="stickerActive" @click="stickerActive = false"
          class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300 transition-all font-bold">✕</button>
      </div>

      <!-- 画板元素 -->
      <div v-for="(item, i) in canvasItems" :key="i"
        class="absolute cursor-move select-none group"
        :style="{ left: item.pos_x + 'px', top: item.pos_y + 'px', width: item.width + 'px', height: item.height + 'px', transform: 'rotate(' + item.rotation + 'deg)' }"
        @mousedown.stop="dragItem(i, $event)" @touchstart.stop="dragItemTouch(i, $event)">
        <img v-if="item.type === 'photo'" :src="item.content" class="w-full h-full object-cover rounded-lg shadow-md" />
        <span v-else-if="item.type === 'sticker'" class="text-4xl drop-shadow-md">{{ item.content }}</span>
        <div v-else-if="item.type === 'text'"
          :style="{ color: item.color, fontSize: (item.font_size || 16) + 'px' }"
          class="whitespace-pre-wrap font-medium drop-shadow-sm">{{ item.content }}</div>
        <button v-if="authStore.isLoggedIn" @click.stop="removeCanvasItem(i)" class="absolute -top-2 -right-2 w-5 h-5 bg-red-400 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
      </div>

      <!-- ===== 大型玻璃心情瓶（左下角，靠近底部） ===== -->
      <div class="absolute left-0 z-10" style="bottom:-20px; width:240px; height:370px;">
        <!-- 日历大圆钮 -->
        <button v-if="authStore.isLoggedIn" @click="showCalendar = !showCalendar"
          class="absolute -top-0 right-0 z-20 w-12 h-12 rounded-full bg-white/70 hover:bg-white shadow-md flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-95"
          title="心情日历">📅</button>

        <div @click.stop="authStore.isLoggedIn ? showMoodPopup = true : null"
          class="hover:scale-[1.02] transition-transform z-10 relative"
          :class="authStore.isLoggedIn ? 'cursor-pointer' : 'cursor-default'">
          <svg viewBox="0 0 240 380" class="w-full h-full drop-shadow-lg pointer-events-none">
            <defs>
              <linearGradient id="jarGlass" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="rgba(220,210,235,0.15)" />
                <stop offset="12%" stop-color="rgba(255,255,255,0.5)" />
                <stop offset="28%" stop-color="rgba(248,244,252,0.3)" />
                <stop offset="65%" stop-color="rgba(240,235,248,0.22)" />
                <stop offset="100%" stop-color="rgba(210,200,225,0.25)" />
              </linearGradient>
            </defs>

            <!-- 瓶底阴影 -->
            <ellipse cx="120" cy="355" rx="90" ry="14" fill="rgba(0,0,0,0.05)" />

            <!-- 矮胖圆柱瓶身（加大） -->
            <rect x="20" y="12" width="200" height="320" rx="20" fill="url(#jarGlass)" stroke="rgba(180,170,200,0.35)" stroke-width="2.5" />

            <!-- 瓶底平弧 -->
            <path d="M20 322 Q120 346 220 322" fill="url(#jarGlass)" stroke="rgba(180,170,200,0.35)" stroke-width="2.5" />

            <!-- 左高光竖条（毛玻璃质感） -->
            <rect x="30" y="30" width="14" height="160" rx="7" fill="rgba(255,255,255,0.35)" />

            <!-- 右环境光 -->
            <rect x="198" y="30" width="6" height="260" rx="3" fill="rgba(255,255,255,0.12)" />

            <!-- 顶部敞口内圈 -->
            <ellipse cx="120" cy="28" rx="90" ry="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />

            <!-- 底部玻璃厚度 -->
            <ellipse cx="120" cy="340" rx="80" ry="7" fill="rgba(255,255,255,0.08)" stroke="rgba(180,170,200,0.2)" stroke-width="1" />
          </svg>

          <!-- 瓶内心情球，堆在瓶身内部底部 -->
          <div class="absolute flex flex-wrap items-end justify-center content-end gap-[2px] overflow-hidden"
            style="left:28px; right:28px; bottom:58px; top:18px;">
            <span v-for="(m, i) in jarMoods" :key="i" class="leading-none inline-flex items-center justify-center"
              :style="{
                fontSize: Math.min(14, Math.max(8, 180 / jarMoods.length)) + 'px',
                borderRadius: m.shape === 'circle' ? '50%' : '5px',
                background: m.color,
                width: Math.min(22, Math.max(12, 300 / jarMoods.length)) + 'px',
                height: Math.min(22, Math.max(12, 300 / jarMoods.length)) + 'px',
                boxShadow: '0 0 2px rgba(0,0,0,0.1)',
              }">
              {{ m.emoji }}
            </span>
          </div>
        </div>
      </div>

      <!-- 记录点滴 + 速写本按钮（瓶子右侧，仅登录用户） -->
      <div v-if="authStore.isLoggedIn" class="absolute bottom-16 left-[252px] z-10 flex flex-col gap-2">
        <button @click="showPublish = true"
          class="px-4 py-2 rounded-full text-sm font-medium shadow-md
                 bg-white/70 hover:bg-white backdrop-blur text-dream-700
                 transition-all hover:scale-105 active:scale-95">
          📝 记录点滴
        </button>
        <button @click="showSketchbook = true"
          class="px-4 py-2 rounded-full text-sm font-medium shadow-md
                 bg-white/70 hover:bg-white backdrop-blur text-purple-600
                 transition-all hover:scale-105 active:scale-95">
          📒 速写本
        </button>
      </div>
    </div>
    </div><!-- 外层滚动容器结束 -->

    <!-- 编辑人物卡片弹窗 -->
    <div v-if="editingCard" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="editingCard = false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-dream-lg mx-4 relative">
        <button @click="editingCard = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h3 class="font-bold text-gray-800 mb-4">编辑人物卡片</h3>
        <input v-model="profile.name" placeholder="名称" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-dream-300" />
        <textarea v-model="profile.bio" placeholder="简介" class="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-dream-300" rows="2" />
        <label class="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer hover:text-dream-600 transition-colors">
          <span class="text-lg">📷</span><span>{{ profile.avatar_url ? '✅ 已设头像（点此更换）' : '上传头像 (1:1 正方形)' }}</span>
          <input type="file" accept="image/*" class="hidden" @change="towaPickAvatar" />
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer hover:text-dream-600 transition-colors">
          <span class="text-lg">🖼️</span><span>{{ profile.cover_url ? '✅ 已设背景（点此更换）' : '上传背景图 (2:1 横幅)' }}</span>
          <input type="file" accept="image/*" class="hidden" @change="towaPickCover" />
        </label>
        <div class="flex gap-2">
          <button @click="saveProfile" class="flex-1 dream-btn-primary text-sm">保存</button>
          <button @click="editingCard = false" class="flex-1 bg-gray-100 text-gray-600 rounded-full py-2 text-sm">取消</button>
        </div>
      </div>
    </div>

    <!-- 心情弹窗（宽版，8个一排） -->
    <div v-if="showMoodPopup" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="closeMoodPopup">
      <div class="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-dream-lg mx-4 relative">
        <button @click="closeMoodPopup" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h3 class="font-bold text-gray-800 mb-4 text-center">今日心情</h3>
        <div class="text-xs text-gray-400 text-center mb-6">{{ todayStr }}</div>
        <!-- 我的今日心情 — 8个一排圆形，文字在图标正下方 -->
        <div class="mb-6">
          <div class="text-sm font-medium text-gray-600 mb-3">💕 我的今日心情</div>
          <div class="flex gap-3 justify-center flex-wrap">
            <div v-for="(cfg, type) in MOOD_CONFIG" :key="'my-'+type" class="flex flex-col items-center gap-1">
              <div @click="myMood = type as string"
                class="w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-110 border-2"
                :style="{ background: cfg.color, borderColor: myMood === type ? '#444' : 'rgba(0,0,0,0.08)' }">
                {{ cfg.emoji }}
              </div>
              <span class="text-[10px] text-gray-400 text-center w-14 leading-tight">{{ cfg.label }}</span>
            </div>
          </div>
        </div>
        <!-- Towa的今日心情 — 8个一排方形，文字在图标正下方 -->
        <div class="mb-6">
          <div class="text-sm font-medium text-gray-600 mb-3">💖 Towa的今日心情</div>
          <div class="flex gap-3 justify-center flex-wrap">
            <div v-for="(cfg, type) in MOOD_CONFIG" :key="'towa-'+type" class="flex flex-col items-center gap-1">
              <div @click="towaMood = type as string"
                class="w-12 h-12 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-110 border-2"
                :style="{ background: cfg.color, borderColor: towaMood === type ? '#444' : 'rgba(0,0,0,0.08)' }">
                {{ cfg.emoji }}
              </div>
              <span class="text-[10px] text-gray-400 text-center w-14 leading-tight">{{ cfg.label }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <button @click="saveMood" class="flex-1 bg-gradient-to-r from-dream-500 to-purple-500 text-white py-2.5 rounded-full font-medium text-sm">确定</button>
          <button @click="closeMoodPopup" class="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-full text-sm">取消</button>
        </div>
      </div>
    </div>

    <!-- 日历弹窗（加高格子，双行显示心情） -->
    <div v-if="showCalendar" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="showCalendar=false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-xl shadow-dream-lg max-h-[90vh] overflow-y-auto mx-4 relative">
        <button @click="showCalendar = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <div class="flex items-center justify-center gap-3 mb-5">
          <button @click="calYear--" class="text-sm w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">◀</button>
          <select v-model="calYear" class="text-sm border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dream-300 bg-white"><option v-for="y in years" :key="y" :value="y">{{ y }}年</option></select>
          <select v-model="calMonth" class="text-sm border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dream-300 bg-white"><option v-for="(m,i) in months" :key="i" :value="i+1">{{ m }}</option></select>
          <button @click="calYear++" class="text-sm w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">▶</button>
        </div>
        <div class="grid grid-cols-7 gap-1.5 text-center">
          <span v-for="d in '日一二三四五六'" :key="d" class="text-gray-400 pt-1 pb-2 font-medium text-xs">{{ d }}</span>
          <div v-for="day in calDays" :key="day.key" class="py-2 cursor-pointer rounded-xl hover:bg-dream-50 flex flex-col items-center justify-center gap-0.5"
            style="min-height:78px"
            :class="{ 'bg-dream-100/50': day.date === todayStr, 'opacity-30': !day.currentMonth }" @click="day.currentMonth ? openDayMood(day.date) : null">
            <div class="text-gray-600 text-xs font-medium leading-none">{{ day.day || '' }}</div>
            <!-- 心情图标：属性名 my / towa（来自 loadMoods 展开） -->
            <template v-if="day.my || day.towa">
              <span v-if="day.my" class="inline-flex items-center justify-center leading-none"
                style="font-size:14px; width:20px; height:20px; border-radius:50%;"
                :style="{ background: getMood(day.my)?.color || '#eee' }">{{ getMood(day.my)?.emoji || '' }}</span>
              <span v-if="day.towa" class="inline-flex items-center justify-center leading-none"
                style="font-size:11px; width:16px; height:16px; border-radius:3px;"
                :style="{ background: getMood(day.towa)?.color || '#eee' }">{{ getMood(day.towa)?.emoji || '' }}</span>
            </template>
          </div>
        </div>
        <div v-if="editDayDate" class="mt-5 p-4 bg-dream-50 rounded-2xl">
          <div class="text-sm font-medium mb-3">📅 {{ editDayDate }}</div>
          <div class="grid grid-cols-2 gap-3">
            <div><div class="text-xs text-gray-500 mb-1">💕 我的</div>
              <select v-model="editMyMood" class="text-xs w-full border rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-dream-300 bg-white"><option value="">—</option><option v-for="(c,t) in MOOD_CONFIG" :key="t" :value="t">{{ c.emoji }} {{ c.label }}</option></select>
            </div>
            <div><div class="text-xs text-gray-500 mb-1">💖 Towa</div>
              <select v-model="editTowaMood" class="text-xs w-full border rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-dream-300 bg-white"><option value="">—</option><option v-for="(c,t) in MOOD_CONFIG" :key="t" :value="t">{{ c.emoji }} {{ c.label }}</option></select>
            </div>
          </div>
          <button @click="saveDayMood" class="w-full bg-gradient-to-r from-dream-500 to-purple-500 text-white py-2.5 rounded-full text-sm font-medium mt-3">保存</button>
        </div>
        <button @click="showCalendar=false" class="w-full mt-4 bg-gray-100 text-gray-600 py-2.5 rounded-full text-sm">关闭</button>
      </div>
    </div>

    <!-- 记录点滴弹窗 -->
    <div v-if="showPublish" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" @click.self="showPublish=false">
      <div class="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-dream-lg mx-4 relative">
        <button @click="showPublish = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h3 class="font-bold text-gray-800 mb-4">📝 记录点滴</h3>
        <input v-model="pubForm.title" placeholder="标题" class="dream-input mb-3" />
        <div class="flex flex-col md:flex-row gap-3 mb-3">
          <textarea v-model="pubForm.content" placeholder="正文 (Markdown)" class="dream-input flex-1 min-h-[200px] font-mono text-sm"></textarea>
          <div class="flex-1 dream-input markdown-body bg-white/60 min-h-[200px] overflow-y-auto" v-html="renderMd(pubForm.content)"></div>
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
      <div class="bg-white rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-dream-lg mx-4 relative">
        <button @click="showSketchbook = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">✕</button>
        <h3 class="font-bold text-gray-800 mb-4">📒 速写本</h3>
        <div v-if="sketchList.length" class="space-y-2">
          <div v-for="s in sketchList" :key="s.id" class="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-dream-50 cursor-pointer">
            <div class="flex-1 min-w-0" @click="editSketch(s)"><div class="text-sm font-medium truncate">{{ s.title || '未命名' }}</div><div class="text-xs text-gray-400">{{ fmtDate(s.created_at) }}</div></div>
            <button @click.stop="delSketch(s.id)" class="text-gray-300 hover:text-red-400">🗑️</button>
          </div>
        </div>
        <p v-else class="text-center text-gray-400 text-sm py-8">速写本是空的</p>
        <button @click="showSketchbook=false" class="w-full mt-4 bg-gray-100 text-gray-600 py-2.5 rounded-full text-sm">关闭</button>
      </div>
    </div>
  <!-- 裁剪弹窗 -->
  <ImageCropModal v-if="towaCropSrc" :src="towaCropSrc" :title="towaCropTitle" :aspectRatio="towaCropRatio" :cropHint="towaCropHint" @close="towaCropSrc=''" @cropped="towaCropDone" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { MOOD_CONFIG, type CanvasItem } from '@/types'
import TagInput from '@/components/publish/TagInput.vue'
import VisibilitySelect from '@/components/publish/VisibilitySelect.vue'
import ImageUploader from '@/components/publish/ImageUploader.vue'
import ImageCropModal from '@/components/common/ImageCropModal.vue'
import { marked } from 'marked'

const authStore = useAuthStore()
const profile = reactive({ name: 'Towa', bio: '', avatar_url: '', cover_url: '' })
const editingCard = ref(false)

// Towa卡片裁剪
const towaCropSrc = ref(''); const towaCropTitle = ref(''); const towaCropRatio = ref(1); const towaCropHint = ref('')
let towaCropTarget: 'avatar' | 'cover' = 'avatar'
function towaPickAvatar(e: Event) { pickFile(e, 'avatar') }
function towaPickCover(e: Event) { pickFile(e, 'cover') }
function pickFile(e: Event, target: 'avatar' | 'cover') {
  const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  const reader = new FileReader()
  reader.onload = () => { towaCropSrc.value = reader.result as string; towaCropTarget = target; towaCropTitle.value = target === 'avatar' ? '裁剪头像' : '裁剪背景'; towaCropRatio.value = target === 'avatar' ? 1 : 2; towaCropHint.value = target === 'avatar' ? '1:1 正方形 · 拖拽移动 · 滚轮缩放' : '2:1 横幅 · 拖拽移动 · 滚轮缩放' }
  reader.readAsDataURL(file)
  input.value = ''
}
async function towaCropDone(blob: Blob) {
  towaCropSrc.value = ''
  const file = new File([blob], `towa-${towaCropTarget}-${Date.now()}.png`, { type: 'image/png' })
  const { data, error } = await supabase.storage.from('posts-media').upload(`profiles/${file.name}`, file, { upsert: true })
  if (error) { alert('上传失败: ' + error.message); return }
  const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
  if (towaCropTarget === 'avatar') profile.avatar_url = urlData.publicUrl
  else profile.cover_url = urlData.publicUrl
  saveProfile()
}
const myMood = ref(''); const towaMood = ref('')
const showMoodPopup = ref(false); const showCalendar = ref(false)
const showPublish = ref(false); const showSketchbook = ref(false)
const todayStr = new Date().toISOString().split('T')[0]
const jarMoods = ref<{ emoji: string; color: string; shape: 'circle'|'square' }[]>([])
const allMoods = ref<Record<string, { my?: string; towa?: string }>>({})

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

const canvasRef = ref<HTMLElement | null>(null)
const canvasItems = ref<CanvasItem[]>([])
const stickerActive = ref(false)
const currentTool = ref<'sticker'|'none'>('none')
const drawingColor = ref('#f8bbd0')
const tools = [
  { emoji: '💗', color: '#f8bbd0' }, { emoji: '🌟', color: '#fdd835' },
  { emoji: '🌸', color: '#f48fb1' }, { emoji: '🍀', color: '#66bb6a' },
  { emoji: '🌈', color: '#ff7043' }, { emoji: '💫', color: '#ce93d8' },
  { emoji: '🔥', color: '#ef5350' }, { emoji: '💧', color: '#29b6f6' },
]

const pubForm = reactive({ title: '', content: '', tags: [] as string[], visibility: 'public' as string, images: [] as string[] })
const sketchList = ref<any[]>([])

const currentMonthLabel = computed(() => `${calYear.value}年${calMonth.value}月`)
function getMood(t: string) { return (MOOD_CONFIG as Record<string, { emoji: string; color: string; label: string }>)[t] }
function renderMd(s: string) { return marked.parse(s || '', { breaks: true, gfm: true }) as string }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('zh-CN') : '' }

async function loadMoods() {
  const { data } = await supabase.from('moods').select('*').order('date')
  if (data) {
    allMoods.value = {}; jarMoods.value = []
    for (const m of data) {
      const mood = m as any
      allMoods.value[m.date] = { my: mood.my_mood || undefined, towa: mood.towa_mood || undefined }
      const prefix = `${calYear.value}-${String(calMonth.value).padStart(2,'0')}`
      if (m.date.startsWith(prefix)) {
        if (mood.my_mood) {
          const cfg = getMood(mood.my_mood)
          if (cfg) jarMoods.value.push({ emoji: cfg.emoji, color: cfg.color, shape: 'circle' })
        }
        if (mood.towa_mood) {
          const cfg = getMood(mood.towa_mood)
          if (cfg) jarMoods.value.push({ emoji: cfg.emoji, color: cfg.color, shape: 'square' })
        }
      }
    }
  }
}
async function saveMood() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return
  await supabase.from('moods').upsert({ user_id: user.id, date: todayStr, my_mood: myMood.value || undefined, towa_mood: towaMood.value || undefined } as any, { onConflict: 'user_id,date' })
  showMoodPopup.value = false; await loadMoods()
}
function closeMoodPopup() { showMoodPopup.value = false }
function openDayMood(date: string) { if (!date) return; editDayDate.value = date; editMyMood.value = allMoods.value[date]?.my || ''; editTowaMood.value = allMoods.value[date]?.towa || '' }
async function saveDayMood() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return
  await supabase.from('moods').upsert({ user_id: user.id, date: editDayDate.value, my_mood: editMyMood.value || undefined, towa_mood: editTowaMood.value || undefined } as any, { onConflict: 'user_id,date' })
  editDayDate.value = ''; await loadMoods()
}

async function loadCanvas() {
  const { data } = await supabase.from('canvas_items').select('*').order('created_at')
  if (data) canvasItems.value = data as CanvasItem[]
}
async function saveCanvas() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return
  await supabase.from('canvas_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const items: any[] = canvasItems.value.map(i => ({ type: i.type, content: i.content, pos_x: i.pos_x, pos_y: i.pos_y, width: i.width, height: i.height, rotation: i.rotation, color: i.color, font_size: i.font_size, user_id: user.id }))
  if (items.length) await supabase.from('canvas_items').insert(items as any)
}

let dragIdx = -1, dragOffX = 0, dragOffY = 0
function dragItem(i: number, e: MouseEvent) { dragIdx = i; dragOffX = e.offsetX; dragOffY = e.offsetY }
function dragItemTouch(i: number, e: TouchEvent) { dragIdx = i; dragOffX = e.touches[0].clientX - canvasItems.value[i].pos_x; dragOffY = e.touches[0].clientY - canvasItems.value[i].pos_y }
function startDraw(e: MouseEvent) { if (stickerActive.value) addSticker(e) }
function startDrawTouch(e: TouchEvent) { if (stickerActive.value) addStickerTouch(e) }
function drawing(e: MouseEvent) { if (dragIdx < 0) return; e.preventDefault(); canvasItems.value[dragIdx].pos_x = e.offsetX - dragOffX; canvasItems.value[dragIdx].pos_y = e.offsetY - dragOffY }
function drawingTouch(e: TouchEvent) { if (dragIdx < 0) return; const rect = canvasRef.value?.getBoundingClientRect(); if (!rect) return; canvasItems.value[dragIdx].pos_x = e.touches[0].clientX - rect.left - dragOffX; canvasItems.value[dragIdx].pos_y = e.touches[0].clientY - rect.top - dragOffY }
function stopDraw() { if (dragIdx >= 0) { saveCanvas(); dragIdx = -1 } }

function toggleSticker(tool: typeof tools[0]) {
  // 再次点击同一个已选中的贴纸 → 取消选中
  if (stickerActive.value && drawingColor.value === tool.color) {
    stickerActive.value = false; return
  }
  stickerActive.value = true; drawingColor.value = tool.color
}
function addSticker(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect(); if (!rect) return
  const tool = tools.find(t => t.color === drawingColor.value) || tools[0]
  canvasItems.value.push({ type: 'sticker', content: tool.emoji, pos_x: e.clientX - rect.left - 20, pos_y: e.clientY - rect.top - 20, width: 48, height: 48, rotation: 0, color: tool.color })
  stickerActive.value = false; saveCanvas()
}
function addStickerTouch(e: TouchEvent) {
  const rect = canvasRef.value?.getBoundingClientRect(); if (!rect) return
  const tool = tools.find(t => t.color === drawingColor.value) || tools[0]
  canvasItems.value.push({ type: 'sticker', content: tool.emoji, pos_x: e.touches[0].clientX - rect.left - 20, pos_y: e.touches[0].clientY - rect.top - 20, width: 48, height: 48, rotation: 0, color: tool.color })
  stickerActive.value = false; saveCanvas()
}
function addText() { const txt = prompt('输入文字:'); if (!txt) return; canvasItems.value.push({ type: 'text', content: txt, pos_x: 100, pos_y: 100, width: 200, height: 40, rotation: 0, color: drawingColor.value, font_size: 20 }); saveCanvas() }
async function addPhoto(e: Event) {
  const input = e.target as HTMLInputElement; if (!input.files?.[0]) return; const file = input.files[0]
  const { data, error } = await supabase.storage.from('posts-media').upload(`canvas/${Date.now()}.${file.name.split('.').pop()}`, file, { upsert: false })
  if (error) { alert('上传失败'); return }
  const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(data.path)
  canvasItems.value.push({ type: 'photo', content: urlData.publicUrl, pos_x: 50, pos_y: 50, width: 200, height: 200, rotation: 0 }); saveCanvas(); input.value = ''
}
function removeCanvasItem(i: number) { canvasItems.value.splice(i, 1); saveCanvas() }
async function clearCanvas() { if (!confirm('清除所有画板内容？')) return; canvasItems.value = []; await supabase.from('canvas_items').delete().neq('id', '00000000-0000-0000-0000-000000000000') }

async function loadProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('profile_type', 'canvas').limit(1).single()
  if (data) { const d = data as any; profile.name = d.name || 'Towa'; profile.bio = d.bio || ''; profile.avatar_url = d.avatar_url || ''; profile.cover_url = d.cover_url || '' }
}
async function saveProfile() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return
  const existing = await supabase.from('profiles').select('id').eq('profile_type', 'canvas').limit(1).single()
  const row = { name: profile.name, bio: profile.bio, avatar_url: profile.avatar_url || null, cover_url: profile.cover_url || null, profile_type: 'canvas', user_id: user?.id } as any
  if (existing.data) await supabase.from('profiles').update(row).eq('id', existing.data.id)
  else await supabase.from('profiles').insert(row)
  editingCard.value = false
}

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
async function loadSketchbook() { const { data } = await supabase.from('sketchbook').select('*').eq('is_draft', true).is('deleted_at', null).order('created_at', { ascending: false }); if (data) sketchList.value = data }
function editSketch(s: any) { pubForm.title = s.title; pubForm.content = s.content; pubForm.tags = s.tags || []; pubForm.visibility = s.visibility; pubForm.images = s.images || []; showSketchbook.value = false; showPublish.value = true }
async function delSketch(id: string) { await supabase.from('sketchbook').update({ deleted_at: new Date().toISOString() }).eq('id', id); await loadSketchbook() }

onMounted(async () => { await Promise.all([loadMoods(), loadCanvas(), loadProfile(), loadSketchbook()]) })
</script>

<style scoped>
.dream-input { @apply w-full px-4 py-3 rounded-lg border border-gray-200 bg-white/80 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dream-300 transition-all; }
</style>
