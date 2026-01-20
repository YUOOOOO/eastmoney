import { DataTypes } from 'sequelize'

/**
 * 系统设置模型
 */
export default function defineSettings(sequelize) {
  const Settings = sequelize.define(
    'Settings',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      // AI 模型配置
      aiModels: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'AI 模型配置列表',
      },
      // 激活的模型索引
      activeModelIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: '激活的 AI 模型索引',
      },
      systemPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue:
          '你是一个专业的金融数据分析助手,可以帮助用户分析基金、股票等金融数据。请用简洁专业的语言回答问题。',
        comment: 'AI 系统提示词',
      },
      recommendationPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue:
          '你是一个智能理财顾问，请根据市场数据为用户推荐合适的投资产品。',
        comment: '智能推荐提示词',
      },
      marketSentimentPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue:
          '你是一个市场分析师，请根据新闻和数据分析当前的市场情绪。',
        comment: '市场情绪提示词',
      },
      tavilyApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Tavily 搜索 API Key',
      },
    },
    {
      tableName: 'settings',
      timestamps: true,
    },
  )

  return Settings
}
