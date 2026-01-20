<template>
  <div class="fund-detail-container">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$router.back()" class="back-btn">返回列表</button>
    </div>
    <div v-else class="fund-detail">
      <!-- 头部信息 -->
      <div class="detail-header">
        <button @click="$router.back()" class="back-icon">←</button>
        <div class="header-content">
          <div class="fund-badge">{{ fund.fundCode }}</div>
          <h1>{{ fund.fundName }}</h1>
          <p class="fund-type">{{ fund.fundType || '商品型-QDII' }}</p>
        </div>
      </div>

      <!-- 最新净值卡片 -->
      <div class="nav-card">
        <div class="nav-label">最新净值 ({{ fund.details?.nav_date }})</div>
        <div class="nav-value">{{ fund.details?.latest_nav || '---' }}</div>
        <div class="fund-meta-row">
          <div class="meta-item">
            <span class="label">基金经理</span>
            <span class="value">
              {{ fund.details?.manager || fund.details?.['基金经理'] || '---' }}
            </span>
          </div>
          <div class="meta-item">
            <span class="label">基金规模</span>
            <span class="value">
              {{
                fund.details?.fund_size || fund.details?.['基金规模'] || '---'
              }}
            </span>
          </div>
          <div class="meta-item">
            <span class="label">晨星评级</span>
            <span class="value">
              {{ fund.details?.rating || fund.details?.['晨星评级'] || '---' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 业绩分析 -->
      <div class="section">
        <div class="section-header">
          <h2>📈 业绩分析</h2>
          <span class="period">
            日增长率: {{ fund.details?.daily_growth }}%
          </span>
        </div>
        <div class="chart-container" ref="chartRef"></div>
      </div>

      <!-- 持仓信息 -->
      <div v-if="fund.details?.holdings?.length" class="section">
        <div class="section-header">
          <h2>📊 前十大重仓股</h2>
        </div>
        <div class="holdings-list">
          <div
            v-for="(stock, idx) in fund.details.holdings"
            :key="idx"
            class="holding-item">
            <span class="index">{{ idx + 1 }}</span>
            <div class="stock-info">
              <div class="stock-name">{{ stock['股票名称'] }}</div>
              <div class="stock-code">{{ stock['股票代码'] }}</div>
            </div>
            <div class="stock-percent">{{ stock['占净值比例'] }}%</div>
          </div>
        </div>
      </div>

      <!-- 历史参考 -->
      <div class="section">
        <h2>历史参考</h2>
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'nav' }]"
            @click="activeTab = 'nav'">
            净值走势
          </button>
        </div>

        <!-- 净值走势表格 -->
        <div v-if="activeTab === 'nav'" class="data-table">
          <div class="table-row header">
            <div class="cell">日期</div>
            <div class="cell">单位净值</div>
            <div class="cell">日增长率</div>
          </div>
          <div
            v-for="(item, index) in fund.details?.history"
            :key="index"
            class="table-row">
            <div class="cell">{{ item['净值日期'] }}</div>
            <div class="cell">{{ item['单位净值'] }}</div>
            <div
              :class="[
                'cell',
                parseFloat(item['日增长率']) >= 0 ? 'positive' : 'negative',
              ]">
              {{ item['日增长率'] }}%
            </div>
          </div>
          <div v-if="!fund.details?.history?.length" class="empty-text">
            暂无历史数据
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const fund = ref({})
const loading = ref(true)
const error = ref(null)
const activeTab = ref('nav')
const chartRef = ref(null)
let chartInstance = null

onMounted(async () => {
  await loadFundDetail()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  window.addEventListener('resize', handleResize)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || !fund.value.details?.history) return

  const history = [...fund.value.details.history].reverse()
  const dates = history.map((item) => item['净值日期'])
  const values = history.map((item) => item['单位净值'])

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b0}<br />单位净值: {c0}',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666' },
    },
    series: [
      {
        name: '单位净值',
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: '#667eea',
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.2)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0)' },
          ]),
        },
      },
    ],
  }

  chartInstance.setOption(option)
}

const analyzing = ref(false)
const analysisResult = ref('')

const analyzeFund = async () => {
  if (analyzing.value) return

  analyzing.value = true
  analysisResult.value = ''

  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `/api/funds/${route.params.id}/analyze`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    // 简单的格式处理：移除 Markdown 的 bold 标记，或者保留并在 CSS 中处理
    // 这里直接显示原始内容
    analysisResult.value = response.data.result
  } catch (err) {
    console.error('Analysis error:', err)
    alert('分析失败: ' + (err.response?.data?.error || err.message))
  } finally {
    analyzing.value = false
  }
}

const loadFundDetail = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`/api/funds/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    fund.value = response.data
  } catch (err) {
    console.error('Load fund detail error:', err)
    error.value = '加载失败: ' + (err.response?.data?.error || err.message)
  } finally {
    loading.value = false
    // 确保 loading 结束后，DOM 已经更新（显示出 chart-container），再初始化图表
    nextTick(() => {
      initChart()
    })
  }
}
</script>

<style scoped>
.fund-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px 24px;
}

.loading,
.error-state {
  text-align: center;
  padding: 48px 24px;
}

.error-state p {
  color: #dc3545;
  margin-bottom: 16px;
}

.back-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.back-icon {
  background: none;
  border: none;
  font-size: 28px;
  color: #333;
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 8px;
}

.back-icon:hover {
  color: #667eea;
}

.header-content {
  flex: 1;
}

.fund-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.header-content h1 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.fund-type {
  color: #666;
  font-size: 14px;
}

.nav-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.nav-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.nav-value {
  font-size: 48px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
}

.fund-meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-size: 13px;
  color: #999;
}

.meta-item .value {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.period {
  font-size: 13px;
  color: #999;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-info {
  color: #999;
  font-size: 14px;
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.3s;
}

.confirm-btn:hover {
  background: #334155;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.data-table {
  border-radius: 8px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.header {
  background: #f8f9fa;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.cell {
  font-size: 14px;
  color: #333;
}

.holdings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.holding-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.holding-item .index {
  font-size: 12px;
  color: #999;
  font-weight: 600;
  width: 16px;
}

.holding-item .stock-info {
  flex: 1;
}

.stock-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 2px;
}

.stock-code {
  font-size: 12px;
  color: #999;
}

.stock-percent {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.cell.positive {
  color: #dc3545;
  font-weight: 600;
}

.cell.negative {
  color: #28a745;
  font-weight: 600;
}

.analyze-btn {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.analyze-btn:hover {
  background-color: #5a6fd1;
}

.analyze-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.analysis-result {
  margin-top: 16px;
  padding: 16px;
  background-color: #f0f4ff;
  border-radius: 8px;
  border: 1px solid #c3dafe;
}

.result-content {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 15px;
  color: #2d3748;
}

.disclaimer {
  margin-top: 12px;
  font-size: 12px;
  color: #718096;
  text-align: right;
}

.empty-text {
  text-align: center;
  padding: 32px;
  color: #999;
}
</style>
