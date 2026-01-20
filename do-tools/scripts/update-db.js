import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

// 兼容 ES Module 的 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据库文件路径: 当前目录(src/scripts) -> 上级 -> 上级 -> data -> do-tools.db
// 但我们将在项目根目录运行它，所以直接指向 data/do-tools.db 比较稳妥
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
    name: 'Add systemPrompt column',
    sql: `ALTER TABLE Settings ADD COLUMN systemPrompt TEXT DEFAULT ''`,
  },
  {
    name: 'Add activeModelIndex column',
    sql: `ALTER TABLE Settings ADD COLUMN activeModelIndex INTEGER DEFAULT 0`,
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
