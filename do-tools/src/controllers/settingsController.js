import { Settings } from '../models/index.js'

/**
 * 获取用户设置
 */
export async function getSettings(req, res) {
  try {
    const userId = req.user.id

    let settings = await Settings.findOne({
      where: { userId },
    })

    // 如果没有设置,创建默认设置
    if (!settings) {
      settings = await Settings.create({
        userId,
        aiModels: [],
        tavilyApiKey: '',
      })
    }

    res.json({
      settings: {
        id: settings.id,
        aiModels: settings.aiModels || [],
        activeModelIndex: settings.activeModelIndex || 0,
        systemPrompt: settings.systemPrompt || '',
        recommendationPrompt: settings.recommendationPrompt || '',
        marketSentimentPrompt: settings.marketSentimentPrompt || '',
        tavilyApiKey: settings.tavilyApiKey || '',
      },
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    })
  }
}

/**
 * 更新用户设置
 */
export async function updateSettings(req, res) {
  try {
    const userId = req.user.id
    const {
      aiModels,
      activeModelIndex,
      systemPrompt,
      recommendationPrompt,
      marketSentimentPrompt,
      tavilyApiKey,
    } = req.body

    let settings = await Settings.findOne({
      where: { userId },
    })

    if (!settings) {
      // 创建新设置
      settings = await Settings.create({
        userId,
        aiModels: aiModels || [],
        activeModelIndex: activeModelIndex || 0,
        systemPrompt: systemPrompt || '',
        recommendationPrompt: recommendationPrompt || '',
        marketSentimentPrompt: marketSentimentPrompt || '',
        tavilyApiKey: tavilyApiKey || '',
      })
    } else {
      // 更新现有设置
      if (aiModels !== undefined) settings.aiModels = aiModels
      if (activeModelIndex !== undefined)
        settings.activeModelIndex = activeModelIndex
      if (systemPrompt !== undefined) settings.systemPrompt = systemPrompt
      if (recommendationPrompt !== undefined)
        settings.recommendationPrompt = recommendationPrompt
      if (marketSentimentPrompt !== undefined)
        settings.marketSentimentPrompt = marketSentimentPrompt
      if (tavilyApiKey !== undefined) settings.tavilyApiKey = tavilyApiKey

      await settings.save()
    }

    res.json({
      message: 'Settings updated successfully',
      settings: {
        id: settings.id,
        aiModels: settings.aiModels || [],
        activeModelIndex: settings.activeModelIndex || 0,
        systemPrompt: settings.systemPrompt || '',
        tavilyApiKey: settings.tavilyApiKey || '',
      },
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    })
  }
}
