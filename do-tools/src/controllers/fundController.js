import { Fund } from '../models/index.js'
import axios from 'axios'

// Python 服务地址
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'

/**
 * 获取用户的基金列表
 */
export async function getFunds(req, res) {
  try {
    const userId = req.user.id

    const funds = await Fund.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    })

    res.json({
      funds: funds.map((f) => ({
        id: f.id,
        fundCode: f.fundCode,
        fundName: f.fundName,
        fundType: f.fundType,
        style: f.style,
        focusBoards: f.focusBoards ? JSON.parse(f.focusBoards) : [],
        scheduleEnabled: f.scheduleEnabled,
        scheduleTime: f.scheduleTime,
        scheduleInterval: f.scheduleInterval,
        createdAt: f.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get funds error:', error)
    res.status(500).json({ error: 'Failed to retrieve funds' })
  }
}

/**
 * 获取基金详情（调用 Python 服务获取净值数据）
 */
export async function getFundDetail(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params

    // 获取基金基本信息
    const fund = await Fund.findOne({
      where: { id, userId },
    })

    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' })
    }

    // 调用 Python 服务获取基金详细数据
    const response = await axios.get(
      `${PYTHON_SERVICE_URL}/api/fund/${fund.fundCode}`,
      { timeout: 30000 },
    )

    res.json({
      ...fund.toJSON(),
      focusBoards: fund.focusBoards ? JSON.parse(fund.focusBoards) : [],
      details: response.data,
    })
  } catch (error) {
    console.error('Get fund detail error:', error)
    res.status(500).json({ error: 'Failed to retrieve fund details' })
  }
}

/**
 * 搜索基金（调用 Python 服务）
 */
export async function searchFunds(req, res) {
  try {
    const { keyword } = req.query

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' })
    }

    console.log(`Searching funds with keyword: ${keyword}`)
    console.log(`Python service URL: ${PYTHON_SERVICE_URL}`)

    // 调用 Python 服务的搜索接口
    const response = await axios.get(`${PYTHON_SERVICE_URL}/api/market/funds`, {
      params: { q: keyword },
      timeout: 30000, // 30 秒超时
    })

    console.log(`Python response status: ${response.status}`)
    console.log(`Python response data:`, response.data)

    // Python 服务返回的是数组，需要包装成对象
    res.json({
      results: Array.isArray(response.data) ? response.data : [],
    })
  } catch (error) {
    console.error('Search funds error:', error.message)
    console.error('Error stack:', error.stack)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    const errorMsg = error.response?.data?.detail || error.message
    res.status(500).json({ error: `Search failed: ${errorMsg}` })
  }
}

/**
 * 添加基金
 */
export async function addFund(req, res) {
  try {
    const userId = req.user.id
    const {
      fundCode,
      fundName,
      fundType,
      style,
      focusBoards,
      scheduleEnabled,
      scheduleTime,
      scheduleInterval,
    } = req.body

    if (!fundCode || !fundName) {
      return res.status(400).json({ error: 'Fund code and name are required' })
    }

    // 检查是否已存在
    const existing = await Fund.findOne({
      where: { userId, fundCode },
    })

    if (existing) {
      return res.status(400).json({ error: 'Fund already exists' })
    }

    const fund = await Fund.create({
      userId,
      fundCode,
      fundName,
      fundType: fundType || '',
      style: style || '',
      focusBoards: focusBoards ? JSON.stringify(focusBoards) : '[]',
      scheduleEnabled: scheduleEnabled || false,
      scheduleTime: scheduleTime || '',
      scheduleInterval: scheduleInterval || '24H',
    })

    res.json({
      message: 'Fund added successfully',
      fund: {
        id: fund.id,
        fundCode: fund.fundCode,
        fundName: fund.fundName,
        fundType: fund.fundType,
        style: fund.style,
        focusBoards: JSON.parse(fund.focusBoards),
        scheduleEnabled: fund.scheduleEnabled,
        scheduleTime: fund.scheduleTime,
        scheduleInterval: fund.scheduleInterval,
      },
    })
  } catch (error) {
    console.error('Add fund error:', error)
    res.status(500).json({ error: 'Failed to add fund' })
  }
}

/**
 * 更新基金
 */
export async function updateFund(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params
    const {
      style,
      focusBoards,
      scheduleEnabled,
      scheduleTime,
      scheduleInterval,
    } = req.body

    const fund = await Fund.findOne({
      where: { id, userId },
    })

    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' })
    }

    if (style !== undefined) fund.style = style
    if (focusBoards !== undefined)
      fund.focusBoards = JSON.stringify(focusBoards)
    if (scheduleEnabled !== undefined) fund.scheduleEnabled = scheduleEnabled
    if (scheduleTime !== undefined) fund.scheduleTime = scheduleTime
    if (scheduleInterval !== undefined) fund.scheduleInterval = scheduleInterval

    await fund.save()

    res.json({
      message: 'Fund updated successfully',
      fund: {
        id: fund.id,
        fundCode: fund.fundCode,
        fundName: fund.fundName,
        fundType: fund.fundType,
        style: fund.style,
        focusBoards: JSON.parse(fund.focusBoards),
        scheduleEnabled: fund.scheduleEnabled,
        scheduleTime: fund.scheduleTime,
        scheduleInterval: fund.scheduleInterval,
      },
    })
  } catch (error) {
    console.error('Update fund error:', error)
    res.status(500).json({ error: 'Failed to update fund' })
  }
}

/**
 * 删除基金
 */
/**
 * 删除基金
 */
export async function deleteFund(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params

    const fund = await Fund.findOne({
      where: { id, userId },
    })

    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' })
    }

    await fund.destroy()

    res.json({ message: 'Fund deleted successfully' })
  } catch (error) {
    console.error('Delete fund error:', error)
    res.status(500).json({ error: 'Failed to delete fund' })
  }
}

/**
 * 基金 AI 分析
 */
export async function analyzeFund(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params

    // 1. 获取用户设置 (API Key 和 AI 配置)
    // 动态导入 Settings 以避免循环依赖或确保加载
    const { Settings } = await import('../models/index.js')
    const settings = await Settings.findOne({ where: { userId } })

    if (!settings || !settings.tavilyApiKey) {
      return res.status(400).json({
        error:
          'Missing Tavily API Key. Please configure it in General Settings.',
      })
    }

    const { aiModels, activeModelIndex } = settings
    if (!aiModels || aiModels.length === 0) {
      return res.status(400).json({ error: 'No AI models configured' })
    }
    const activeModel = aiModels[activeModelIndex]
    if (!activeModel || !activeModel.apiKey) {
      return res.status(400).json({ error: 'Active AI model invalid' })
    }

    // 2. 获取基金基本信息
    const fund = await Fund.findOne({ where: { id, userId } })
    if (!fund) return res.status(404).json({ error: 'Fund not found' })

    // 3. 调用 Python 服务获取基金详细数据
    const detailRes = await axios.get(
      `${PYTHON_SERVICE_URL}/api/fund/${fund.fundCode}`,
      { timeout: 30000 },
    )
    const fundDetails = detailRes.data

    // 4. 调用 Python 服务搜索相关新闻
    let newsList = []
    try {
      const searchRes = await axios.post(
        `${PYTHON_SERVICE_URL}/api/search/news`,
        {
          query: `${fund.fundName} 基金 净值 基金经理 观点`,
          api_key: settings.tavilyApiKey,
          limit: 5,
        },
        { timeout: 60000 },
      )
      newsList = searchRes.data
    } catch (searchErr) {
      console.error('Search news failed:', searchErr.message)
      // 搜索失败不中断流程，只是没有新闻上下文
    }

    // 5. 构建 Prompt
    const prompt = `
请作为一位专业的基金分析师，分析以下基金：
**基本信息**:
- 名称: ${fund.fundName} (${fund.fundCode})
- 经理: ${fundDetails.manager}
- 规模: ${fundDetails.fund_size}
- 评级: ${fundDetails.rating}
- 最新净值: ${fundDetails.latest_nav} (日期: ${fundDetails.nav_date})
- 日增长率: ${fundDetails.daily_growth}%

**近期相关新闻/观点**:
${newsList.map((n, i) => `${i + 1}. [${n.title}](${n.url}): ${n.content}`).join('\n')}

**分析要求**:
1. 评估该基金近期的表现和风险。
2. 结合新闻信息，分析市场情绪对该基金的影响。
3. 给出简短的投资建议（持有/观望/买入/卖出）并说明理由。
请使用 Markdown 格式输出，重点突出关键信息。
    `

    // 6. 调用 AI 服务 (复制 aiController 的逻辑)
    let baseUrl = activeModel.baseUrl || 'https://api.openai.com/v1'
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)

    // 兼容 Gemini 路径
    if (
      activeModel.name.toLowerCase().includes('gemini') &&
      !baseUrl.includes('goog')
    ) {
      // 处理不同厂商的 baseUrl 差异
    }

    const aiRes = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: activeModel.name || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${activeModel.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      },
    )

    const report = aiRes.data.choices?.[0]?.message?.content || 'AI 未返回内容'

    res.json({ result: report })
  } catch (error) {
    console.error('Analyze fund error:', error)
    const msg = error.response?.data?.error?.message || error.message
    res.status(500).json({ error: `Analysis failed: ${msg}` })
  }
}
