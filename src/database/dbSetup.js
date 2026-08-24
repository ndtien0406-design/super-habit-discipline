import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { getCurrentMonthKey, isNewMonth } from '../utils/dateHelper.js';

let dbInstance = null;

// In-memory fallback for Web preview if native SQLite is unavailable
class WebMemoryDatabase {
  constructor() {
    this.habits = [
      { id: 1, title: 'Chạy Bộ 5km Buổi Sáng', type: 'build', color_code: '#10B981', reminder_time: '06:00', freezes_left: 3, created_at: new Date().toISOString() },
      { id: 2, title: 'Không Thức Khuya Sau 23:00', type: 'quit', color_code: '#F59E0B', reminder_time: '22:30', freezes_left: 3, created_at: new Date().toISOString() }
    ];
    this.checkins = [];
    this.settings = {};
  }

  async execAsync(sql) { return; }

  async getAllAsync(sql, params = []) {
    if (sql.includes('FROM habits')) {
      return [...this.habits];
    }
    if (sql.includes('FROM checkins c JOIN habits h')) {
      return this.checkins.map(c => {
        const h = this.habits.find(hb => hb.id === c.habit_id);
        return {
          ...c,
          habit_title: h?.title || 'Habit',
          habit_type: h?.type || 'build',
          habit_color: h?.color_code || '#6366F1'
        };
      });
    }
    if (sql.includes('FROM checkins WHERE habit_id = ? AND image_path IS NOT NULL')) {
      return this.checkins.filter(c => c.habit_id === params[0] && c.image_path != null);
    }
    if (sql.includes('FROM checkins WHERE habit_id = ?')) {
      return this.checkins.filter(c => c.habit_id === params[0]);
    }
    if (sql.includes('FROM app_settings')) {
      return Object.entries(this.settings).map(([key, value]) => ({ key, value }));
    }
    return [];
  }

  async getFirstAsync(sql, params = []) {
    if (sql.includes('FROM habits WHERE id = ?')) {
      return this.habits.find(h => h.id === params[0]) || null;
    }
    if (sql.includes('FROM checkins WHERE habit_id = ? AND checkin_date = ?')) {
      return this.checkins.find(c => c.habit_id === params[0] && c.checkin_date === params[1]) || null;
    }
    if (sql.includes('FROM app_settings WHERE key = ?')) {
      const val = this.settings[params[0]];
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }

  async runAsync(sql, params = []) {
    if (sql.includes('INSERT INTO habits')) {
      const newId = this.habits.length > 0 ? Math.max(...this.habits.map(h => h.id)) + 1 : 1;
      this.habits.push({
        id: newId,
        title: params[0],
        type: params[1],
        color_code: params[2] || '#6366F1',
        reminder_time: params[3] || '08:00',
        freezes_left: 3,
        created_at: new Date().toISOString()
      });
      return { lastInsertRowId: newId };
    }
    if (sql.includes('UPDATE habits SET freezes_left = ? WHERE id = ?')) {
      const habit = this.habits.find(h => h.id === params[1]);
      if (habit) habit.freezes_left = params[0];
      return {};
    }
    if (sql.includes('UPDATE habits SET freezes_left = 3')) {
      this.habits.forEach(h => h.freezes_left = 3);
      return {};
    }
    if (sql.includes('DELETE FROM habits WHERE id = ?')) {
      this.habits = this.habits.filter(h => h.id !== params[0]);
      this.checkins = this.checkins.filter(c => c.habit_id !== params[0]);
      return {};
    }
    if (sql.includes('INSERT INTO checkins')) {
      const habitId = params[0];
      const date = params[1];
      const existingIdx = this.checkins.findIndex(c => c.habit_id === habitId && c.checkin_date === date);
      const record = {
        id: existingIdx >= 0 ? this.checkins[existingIdx].id : this.checkins.length + 1,
        habit_id: habitId,
        checkin_date: date,
        image_path: params[2],
        note: params[3] || '',
        day_number: params[4],
        status: params[5],
        created_at: new Date().toISOString()
      };
      if (existingIdx >= 0) {
        this.checkins[existingIdx] = record;
      } else {
        this.checkins.push(record);
      }
      return { lastInsertRowId: record.id };
    }
    if (sql.includes('INSERT OR REPLACE INTO app_settings')) {
      this.settings[params[0]] = String(params[1]);
      return {};
    }
    return {};
  }
}

/**
 * Get or initialize the SQLite database connection
 * @returns {Promise<SQLite.SQLiteDatabase>}
 */
export async function getDatabase() {
  if (dbInstance) return dbInstance;

  if (Platform.OS === 'web') {
    dbInstance = new WebMemoryDatabase();
    return dbInstance;
  }
  
  try {
    dbInstance = await SQLite.openDatabaseAsync('super_habits.db');
    await initDatabase(dbInstance);
    return dbInstance;
  } catch (error) {
    console.warn('[DB] Failed to open native SQLite, falling back to in-memory DB:', error);
    dbInstance = new WebMemoryDatabase();
    return dbInstance;
  }
}

/**
 * Execute schema initialization and migrations
 * @param {SQLite.SQLiteDatabase} db
 */
export async function initDatabase(db) {
  if (Platform.OS === 'web') return;

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('build', 'quit')),
      color_code TEXT NOT NULL DEFAULT '#6366F1',
      reminder_time TEXT NOT NULL DEFAULT '08:00',
      freezes_left INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      checkin_date TEXT NOT NULL,
      image_path TEXT,
      note TEXT,
      day_number INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'frozen')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habit_id, checkin_date)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_checkins_habit_date ON checkins(habit_id, checkin_date);
    CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_date);
  `);

  // Check and run monthly freeze reset
  await checkAndResetMonthlyFreezes(db);
}

/**
 * Reset freezes_left to 3 for all habits if entering a new month
 * @param {SQLite.SQLiteDatabase} db
 */
export async function checkAndResetMonthlyFreezes(db) {
  try {
    const setting = await db.getFirstAsync('SELECT value FROM app_settings WHERE key = ?;', ['last_freeze_reset_month']);
    const lastMonth = setting ? setting.value : null;

    if (isNewMonth(lastMonth)) {
      const currentMonth = getCurrentMonthKey();
      await db.runAsync('UPDATE habits SET freezes_left = 3;');
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);',
        ['last_freeze_reset_month', currentMonth]
      );
    }
  } catch (error) {
    console.error('[DB] Error checking monthly freeze reset:', error);
  }
}
