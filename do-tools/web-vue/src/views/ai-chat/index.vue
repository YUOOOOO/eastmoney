<template>
  <div class="chat-container">
    <div class="chat-main">
      <!-- 消息列表 -->
      <div class="messages-area" ref="messagesRef">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="welcome-icon">🤖</div>
          <h2>AI 智能助手</h2>
          <p>有什么我可以帮你的吗?</p>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-wrapper', msg.role]">
          <div class="message-content">
            <div class="message-avatar">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-bubble">
              <div v-if="msg.error" class="error-text">
                {{ msg.content }}
              </div>
              <div v-else class="markdown-body">
                {{ msg.content }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="message-wrapper assistant">
          <div class="message-content">
            <div class="message-avatar">🤖</div>
            <div class="message-bubble loading">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="action-bar">
          <button
            @click="clearHistory"
            class="clear-btn"
            :disabled="messages.length === 0">
            🗑️ 清空历史
          </button>
        </div>
        <div class="input-wrapper">
          <textarea
            v-model="inputMessage"
            @keydown.enter.prevent="sendMessage"
            placeholder="输入您的问题...(Shift + Enter 换行)"
            rows="1"
            ref="textareaRef"></textarea>
          <button
            @click="sendMessage"
            :disabled="!inputMessage.trim() || loading"
            class="send-btn">
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import axios from 'axios'

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesRef = ref(null)
const textareaRef = ref(null)

// 页面加载时获取历史记录
onMounted(async () => {
  await loadHistory()
})

// 加载聊天历史
const loadHistory = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/ai/chat/history', {
      headers: { Authorization: `Bearer ${token}` },
    })

    messages.value = response.data.history.map((h) => ({
      role: h.role,
      content: h.content,
    }))

    await scrollToBottom()
  } catch (err) {
    console.error('Failed to load chat history:', err)
  }
}

// 清空聊天历史
const clearHistory = async () => {
  if (!confirm('确定要清空所有对话记录吗？')) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete('/api/ai/chat/history', {
      headers: { Authorization: `Bearer ${token}` },
    })

    messages.value = []
  } catch (err) {
    console.error('Failed to clear chat history:', err)
    alert('清空失败: ' + (err.response?.data?.error || err.message))
  }
}

// 自动调整文本框高度
watch(inputMessage, () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
    }
  })
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content,
  })
  await scrollToBottom()

  loading.value = true

  try {
    const token = localStorage.getItem('token')

    const response = await axios.post(
      '/api/ai/chat',
      { message: content },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    messages.value.push(response.data)
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content:
        '抱歉,发生了错误: ' + (err.response?.data?.message || err.message),
      error: true,
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 120px); /* 减去顶部导航和内边距 */
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 100px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.message-wrapper {
  margin-bottom: 24px;
  display: flex;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message-wrapper.user .message-content {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-wrapper.user .message-bubble {
  background: #667eea;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-wrapper.assistant .message-bubble {
  background: #f8f9fa;
  color: #333;
  border-bottom-left-radius: 4px;
}

.error-text {
  color: #dc3545;
}

/* 加载动画 */
.loading {
  display: flex;
  gap: 4px;
  padding: 16px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #ccc;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 输入区域 */
.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px 24px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.clear-btn {
  padding: 6px 12px;
  background: transparent;
  color: #999;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-btn:hover:not(:disabled) {
  color: #dc3545;
  border-color: #dc3545;
  background: #fff5f5;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  background: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

textarea {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  max-height: 120px;
}

textarea:focus {
  outline: none;
}

.send-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-end;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
}
</style>
