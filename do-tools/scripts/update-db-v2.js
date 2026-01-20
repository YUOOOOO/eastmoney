import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 指向根目录下的 data/do-tools.db
const dbPath = path.resolve(process.cwd(), 'data/do-tools.db')

console.log('Using database:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
    process.exit(1)
  }
  console.log('Connected to the database.')
})

const migrations = [
  {
    name: 'Add recommendationPrompt column',
    sql: `ALTER TABLE Settings ADD COLUMN recommendationPrompt TEXT DEFAULT '你是一个智能理财顾问，请根据市场数据为用户推荐合适的投资产品。'`,
  },
  {
    name: 'Add marketSentimentPrompt column',
    sql: `ALTER TABLE Settings ADD COLUMN marketSentimentPrompt TEXT DEFAULT '你是一个市场分析师，请根据新闻和数据分析当前的市场情绪。'`,
  },
]

db.serialize(() => {
  migrations.forEach((migration) => {
    db.run(migration.sql, (err) => {
      if (err) {
        if (err.message.includes('duplicate column')) {
          console.log(`[SKIP] ${migration.name} (column exists)`)
        } else {
          console.error(`[FAIL] ${migration.name}:`, err.message)
        }
      } else {
        console.log(`[OK] ${migration.name}`)
      }
    })
  })
})

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message)
  } else {
    console.log('Database connection closed.')
  }
})
