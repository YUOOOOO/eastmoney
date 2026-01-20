import axios from 'axios'
import { Settings, ChatHistory } from '../models/index.js'

export async function testConnection(req, res) {
  try {
    const { apiKey, baseUrl, name } = req.body

    if (!apiKey) {
      return res.status(400).json({ message: 'API Key is required' })
    }

    // 构建请求 URL
    // 如果没有提供 baseUrl，默认为 OpenAI 官方地址
    let url = baseUrl
      ? `${baseUrl}/chat/completions`
      : 'https://api.openai.com/v1/chat/completions'

    // 移除 URL 末尾可能多余的斜杠
    url = url.replace(/([^:]\/)\/+/g, '$1')

    // 默认请求体
    const requestBody = {
      model: name || 'gpt-3.5-turbo', // 使用用户配置的模型名称
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    }

    // Google Gemini 特殊处理 (如果用户填写的是 Gemini 的 OpenAI 兼容 BaseURL)
    // 或者用户自己在模型名称里写了 gemini
    if (
      name &&
      name.toLowerCase().includes('gemini') &&
      !name.includes('gemini')
    ) {
      requestBody.model = 'gemini-pro'
    }

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })

    res.json({
      success: true,
      message: 'Connection successful',
      data: response.data,
    })
  } catch (error) {
    console.error('Test connection error:', error.message)

    // 详细的错误日志
    if (error.response) {
      console.error('API Response Status:', error.response.status)
      console.error(
        'API Response Data:',
        JSON.stringify(error.response.data, null, 2),
      )
    }

    const errorMessage = error.response?.data?.error?.message || error.message

    res.status(500).json({
      success: false,
      message: `Connection failed: ${errorMessage}`,
    })
  }
}

export async function chat(req, res) {
  try {
    const { message } = req.body
    const userId = req.user.id

    // 1. 获取用户设置
    const settings = await Settings.findOne({ where: { userId } })

    if (!settings) {
      return res.status(400).json({ error: 'Settings not found' })
    }

    const { aiModels, activeModelIndex, systemPrompt } = settings

    if (!aiModels || aiModels.length === 0) {
      return res.status(400).json({ error: 'No AI models configured' })
    }

    const activeModel = aiModels[activeModelIndex]

    if (!activeModel) {
      return res.status(400).json({ error: 'Active model not found' })
    }

    if (!activeModel.apiKey) {
      return res
        .status(400)
        .json({ error: 'API Key not configured for active model' })
    }

    // 2. 准备请求
    let baseUrl = activeModel.baseUrl || 'https://api.openai.com/v1'
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    const url = `${baseUrl}/chat/completions`

    // 构建消息列表
    const messages = []
    if (systemPrompt) {
      console.log(systemPrompt)
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: message })

    // 3. 调用 AI API
    const response = await axios.post(
      url,
      {
        model: activeModel.name || 'gpt-3.5-turbo', // 使用配置的模型名称，如果没有则默认
        messages: messages,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${activeModel.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      },
    )

    // 4. 返回结果
    // OpenAI 格式响应处理
    const reply =
      response.data.choices?.[0]?.message?.content || 'No response from AI'

    // 5. 保存聊天历史
    try {
      await ChatHistory.create({
        userId,
        role: 'user',
        content: message,
      })

      await ChatHistory.create({
        userId,
        role: 'assistant',
        content: reply,
      })
    } catch (historyError) {
      console.error('Failed to save chat history:', historyError)
      // 不影响主流程，继续返回结果
    }

    res.json({
      role: 'assistant',
      content: reply,
    })
  } catch (error) {
    console.error('Chat error:', error)

    let errorMsg = 'Chat processing failed'
    if (error.response) {
      console.error('API Response Error:', error.response.data)
      errorMsg = error.response.data?.error?.message || error.message
    } else {
      errorMsg = error.message
    }

    res.status(500).json({
      error: errorMsg,
      details: error.response?.data,
    })
  }
}
