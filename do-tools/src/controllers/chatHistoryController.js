import { ChatHistory } from '../models/index.js'

/**
 * 获取聊天历史
 */
export async function getChatHistory(req, res) {
  try {
    const userId = req.user.id
    const { limit = 100 } = req.query

    const history = await ChatHistory.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
    })

    res.json({
      history: history.map((h) => ({
        role: h.role,
        content: h.content,
        createdAt: h.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get chat history error:', error)
    res.status(500).json({ error: 'Failed to retrieve chat history' })
  }
}

/**
 * 清空聊天历史
 */
export async function clearChatHistory(req, res) {
  try {
    const userId = req.user.id

    await ChatHistory.destroy({
      where: { userId },
    })

    res.json({ message: 'Chat history cleared successfully' })
  } catch (error) {
    console.error('Clear chat history error:', error)
    res.status(500).json({ error: 'Failed to clear chat history' })
  }
}
