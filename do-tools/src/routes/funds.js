import express from 'express'
import {
  getFunds,
  getFundDetail,
  searchFunds,
  addFund,
  updateFund,
  deleteFund,
  analyzeFund,
} from '../controllers/fundController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 所有基金路由都需要认证
router.use(authMiddleware)

router.get('/', getFunds)
router.get('/search', searchFunds)
router.get('/:id', getFundDetail)
router.post('/', addFund)
router.put('/:id', updateFund)
router.delete('/:id', deleteFund)
router.post('/:id/analyze', analyzeFund)

export default router
