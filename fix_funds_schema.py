import sqlite3
import os

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Allow overriding via environment variable for Docker volumes
DB_PATH = os.environ.get("DB_FILE_PATH", os.path.join(BASE_DIR, "funds.db"))
# If funds.db not in root but in data/, adjust manually if needed, 
# but this script assumes running from root context usually.
if not os.path.exists(DB_PATH) and os.path.exists(os.path.join(BASE_DIR, "data/funds.db")):
    DB_PATH = os.path.join(BASE_DIR, "data/funds.db")

print(f"Fixing schema for DB: {DB_PATH}")

def fix_schema():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # 1. Check if we need to migrate
        # We check if 'code' is unique. PRAGMA index_list might show it.
        # But easier is just to perform the migration blindly which is safe (re-creating table schema).
        
        print("Beginning migration transaction...")
        c.execute("BEGIN TRANSACTION;")
        
        # 2. Rename old table
        c.execute("ALTER TABLE funds RENAME TO funds_old;")
        
        # 3. Create new table with correct constraints
        # Removed 'UNIQUE' from code
        # Added 'UNIQUE(user_id, code)'
        c.execute('''
            CREATE TABLE funds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                style TEXT,
                focus TEXT,
                pre_market_time TEXT,
                post_market_time TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id),
                UNIQUE(user_id, code)
            )
        ''')
        
        # 4. Copy data
        # We need to list columns to be safe, but SELECT * usually works if order matches.
        # funds_old schema: id, code, name, style, focus, pre, post, active, created, user_id (if added)
        # Check if user_id exists in old table
        c.execute("PRAGMA table_info(funds_old)")
        columns = [col[1] for col in c.fetchall()]
        has_userid = 'user_id' in columns
        
        if has_userid:
            print("Migrating data with user_id...")
            c.execute('''
                INSERT INTO funds (id, code, name, style, focus, pre_market_time, post_market_time, is_active, created_at, user_id)
                SELECT id, code, name, style, focus, pre_market_time, post_market_time, is_active, created_at, user_id
                FROM funds_old
            ''')
        else:
            print("Migrating legacy data (assigning to default user 1)...")
            c.execute('''
                INSERT INTO funds (id, code, name, style, focus, pre_market_time, post_market_time, is_active, created_at, user_id)
                SELECT id, code, name, style, focus, pre_market_time, post_market_time, is_active, created_at, 1
                FROM funds_old
            ''')
            
        # 5. Drop old table
        c.execute("DROP TABLE funds_old;")
        
        conn.commit()
        print("Schema fix successful! 'funds.code' is no longer globally unique.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
