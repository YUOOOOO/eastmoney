import { DataTypes } from 'sequelize'

/**
 * 聊天历史模型
 */
export default function defineChatHistory(sequelize) {
  const ChatHistory = sequelize.define(
    'ChatHistory',
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
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '消息角色: user/assistant',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '消息内容',
      },
    },
    {
      tableName: 'chat_history',
      timestamps: true,
    },
  )

  return ChatHistory
}
