import express from 'express'
import { testConnection, chat } from '../controllers/aiController.js'
import {
  getChatHistory,
  clearChatHistory,
} from '../controllers/chatHistoryController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 所有 AI 路由都需要认证
router.use(authMiddleware)

router.post('/test-connection', testConnection)
router.post('/chat', chat)
router.get('/chat/history', getChatHistory)
router.delete('/chat/history', clearChatHistory)

export default router
