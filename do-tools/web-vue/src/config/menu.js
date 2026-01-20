// 菜单配置
export const menuItems = [
  {
    path: '/home/dashboard',
    title: '仪表盘',
    icon: '📊',
  },
  {
    path: '/home/ai-chat',
    title: 'AI 助手',
    icon: '🤖',
  },
  {
    path: '/home/settings',
    title: '系统设置',
    icon: '⚙️',
    children: [
      {
        path: '/home/settings/general',
        title: '通用设置',
      },
      {
        path: '/home/settings/ai-models',
        title: '模型管理',
      },
      {
        path: '/home/settings/prompts',
        title: '提示词管理',
      },
    ],
  },
]
