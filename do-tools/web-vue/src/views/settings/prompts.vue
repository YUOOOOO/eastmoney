<template>
  <div class="prompts-settings-container">
    <!-- 成功/错误提示 -->
    <div v-if="showSuccess" class="success-message">✅ 设置保存成功!</div>
    <div v-if="error" class="error-message">❌ {{ error }}</div>

    <h1 class="page-title">提示词设置</h1>

    <!-- AI 问答提示词 -->
    <div class="setting-section">
      <h3>AI 问答提示词配置</h3>
      <p class="section-desc">配置 AI 助手在通用问答场景下的角色和行为。</p>
      <div class="form-group">
        <textarea
          v-model="settings.systemPrompt"
          rows="6"
          placeholder="例如: 你是一个专业的金融分析师..."></textarea>
      </div>
    </div>

    <!-- 智能推荐提示词 -->
    <!-- <div class="setting-section">
      <h3>智能推荐提示词配置</h3>
      <p class="section-desc">配置 AI 在为用户推荐投资产品时的逻辑和语气。</p>
      <div class="form-group">
        <textarea
          v-model="settings.recommendationPrompt"
          rows="6"
          placeholder="例如: 你是一个智能理财顾问..."></textarea>
      </div>
    </div> -->

    <!-- 市场情绪提示词 -->
    <!-- <div class="setting-section">
      <h3>市场情绪提示词配置</h3>
      <p class="section-desc">配置 AI 分析新闻和市场数据时关注的情绪维度。</p>
      <div class="form-group">
        <textarea
          v-model="settings.marketSentimentPrompt"
          rows="6"
          placeholder="例如: 你是一个市场分析师..."></textarea>
      </div>
    </div> -->

    <!-- 保存按钮 -->
    <div class="actions">
      <button @click="saveSettings" class="save-btn" :disabled="saving">
        {{ saving ? '保存中...' : '保存更改' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const settings = ref({
  systemPrompt: '',
  recommendationPrompt: '',
  marketSentimentPrompt: '',
})

const loading = ref(true)
const saving = ref(false)
const showSuccess = ref(false)
const error = ref('')

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = response.data.settings
    settings.value.systemPrompt = data.systemPrompt
    settings.value.recommendationPrompt = data.recommendationPrompt
    settings.value.marketSentimentPrompt = data.marketSentimentPrompt
  } catch (err) {
    console.error('Load settings error:', err)
    error.value = '加载设置失败'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  error.value = ''
  showSuccess.value = false

  try {
    const token = localStorage.getItem('token')
    await axios.put(
      '/api/settings',
      {
        systemPrompt: settings.value.systemPrompt,
        recommendationPrompt: settings.value.recommendationPrompt,
        marketSentimentPrompt: settings.value.marketSentimentPrompt,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('Save settings error:', err)
    error.value = err.response?.data?.message || '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.prompts-settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 32px;
}

.setting-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.setting-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.setting-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.form-group textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s;
  font-family: inherit;
  box-sizing: border-box; /* 关键: 防止 padding 导致超出 */
}

.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.save-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(118, 75, 162, 0.5);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 提示信息 */
.success-message,
.error-message {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  animation: slideDown 0.3s;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
