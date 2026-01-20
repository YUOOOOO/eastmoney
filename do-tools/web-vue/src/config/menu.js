export const menuItems = [
  { path: '/home/dashboard', icon: '📊', title: '仪表盘' },
  { path: '/home/funds', icon: '💰', title: '基金管理' },
  { path: '/home/stocks', icon: '📈', title: '股票管理' },
  { path: '/home/ai-chat', icon: '🤖', title: 'AI 问答' },
  { path: '/home/reports', icon: '📄', title: '报告中心' },
  {
    path: '/home/settings',
    icon: '⚙️',
    title: '系统设置',
    children: [
      { path: '/home/settings/general', title: '通用设置' },
      { path: '/home/settings/prompts', title: '提示词设置' },
      { path: '/home/settings/ai-models', title: 'AI 模型' },
    ],
  },
]
