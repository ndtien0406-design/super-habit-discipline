import { getDatabase } from './dbSetup.js';
import { getTodayDateString } from '../utils/dateHelper.js';
import { calculateStreakMetrics, detectAndProcessMissedDays } from '../utils/streakEngine.js';

// ==========================================
// HABITS CRUD
// ==========================================

export async function getAllHabits() {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM habits ORDER BY id ASC;');
}

export async function getHabitById(id) {
  const db = await getDatabase();
  return await db.getFirstAsync('SELECT * FROM habits WHERE id = ?;', [id]);
}

export async function createHabit({ title, type, color_code = '#6366F1', reminder_time = '08:00', target_streak = 21, target_type = 'streak', target_date = null, notes = '', tag = '', latitude = null, longitude = null }) {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO habits (title, type, color_code, reminder_time, target_streak, target_type, target_date, notes, tag, latitude, longitude, freezes_left) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3);',
    [title.trim(), type, color_code, reminder_time, target_streak, target_type, target_date, notes.trim(), tag.trim(), latitude, longitude]
  );
  return result.lastInsertRowId;
}

export async function updateHabit(id, { title, color_code, reminder_time, notes, tag, latitude, longitude, freezes_left }) {
  const db = await getDatabase();
  return await db.runAsync(
    'UPDATE habits SET title = ?, color_code = ?, reminder_time = ?, notes = ?, tag = ?, latitude = ?, longitude = ?, freezes_left = ? WHERE id = ?;',
    [title.trim(), color_code, reminder_time, notes?.trim() || '', tag?.trim() || '', latitude || null, longitude || null, freezes_left, id]
  );
}

export async function deleteHabit(id) {
  const db = await getDatabase();
  return await db.runAsync('DELETE FROM habits WHERE id = ?;', [id]);
}

export async function updateHabitFreezes(habitId, freezesLeft) {
  const db = await getDatabase();
  return await db.runAsync('UPDATE habits SET freezes_left = ? WHERE id = ?;', [freezesLeft, habitId]);
}

// ==========================================
// CHECKINS CRUD
// ==========================================

export async function getCheckinsByHabitId(habitId) {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM checkins WHERE habit_id = ? ORDER BY checkin_date ASC;',
    [habitId]
  );
}

export async function getCheckinByHabitAndDate(habitId, dateStr) {
  const db = await getDatabase();
  return await db.getFirstAsync(
    'SELECT * FROM checkins WHERE habit_id = ? AND checkin_date = ?;',
    [habitId, dateStr]
  );
}

export async function insertOrUpdateCheckin({ habit_id, checkin_date, image_path = null, note = '', day_number, status }) {
  const db = await getDatabase();
  return await db.runAsync(`
    INSERT INTO checkins (habit_id, checkin_date, image_path, note, day_number, status)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(habit_id, checkin_date) DO UPDATE SET
      image_path = excluded.image_path,
      note = excluded.note,
      day_number = excluded.day_number,
      status = excluded.status;
  `, [habit_id, checkin_date, image_path, note, day_number, status]);
}

export async function getHabitImages(habitId) {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT id, checkin_date, image_path, day_number, note FROM checkins WHERE habit_id = ? AND image_path IS NOT NULL ORDER BY checkin_date ASC;',
    [habitId]
  );
}

export async function getAllCheckinsWithHabitInfo() {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT c.*, h.title AS habit_title, h.type AS habit_type, h.color_code AS habit_color
    FROM checkins c
    JOIN habits h ON c.habit_id = h.id
    ORDER BY c.checkin_date DESC, c.id DESC;
  `);
}

// ==========================================
// SETTINGS
// ==========================================

export async function getSetting(key, defaultValue = null) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT value FROM app_settings WHERE key = ?;', [key]);
  return row ? row.value : defaultValue;
}

export async function setSetting(key, value) {
  const db = await getDatabase();
  return await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);',
    [key, String(value)]
  );
}

export async function getAllSettings() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM app_settings;');
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

// ==========================================
// GAMIFICATION
// ==========================================

export async function addExp(amount) {
  const currentExpStr = await getSetting('user_exp', '0');
  const currentLevelStr = await getSetting('user_level', '1');
  
  let exp = parseInt(currentExpStr, 10);
  let level = parseInt(currentLevelStr, 10);
  
  exp += amount;
  
  // Calculate level ups. Base formula: next_level_exp = level * 100
  let expNeeded = level * 100;
  while (exp >= expNeeded) {
    exp -= expNeeded;
    level += 1;
    expNeeded = level * 100;
  }
  
  // Update HP slightly on level up or exp gain
  const maxHpStr = await getSetting('user_max_hp', '100');
  let maxHp = parseInt(maxHpStr, 10);
  maxHp = 100 + (level - 1) * 10;
  
  await setSetting('user_exp', exp.toString());
  await setSetting('user_level', level.toString());
  await setSetting('user_max_hp', maxHp.toString());
  await setSetting('user_hp', maxHp.toString()); // heal on level up/gain
  
  return { exp, level, maxHp };
}

export async function deductHp(amount) {
  const hpStr = await getSetting('user_hp', '100');
  let hp = parseInt(hpStr, 10);
  hp -= amount;
  if (hp < 0) hp = 0;
  await setSetting('user_hp', hp.toString());
  return hp;
}

// ==========================================
// DASHBOARD COMPOSITE SYNC & STATS
// ==========================================

/**
 * Load all habits enriched with real-time streak calculations,
 * automatically processing missed days and applying freeze cards.
 */
export async function getEnrichedHabitsList(today = getTodayDateString()) {
  const db = await getDatabase();
  const habits = await getAllHabits();
  const enriched = [];

  for (const habit of habits) {
    let checkins = await getCheckinsByHabitId(habit.id);

    // Auto-detect and record missed days with freeze cards
    const { newCheckins, remainingFreezes } = detectAndProcessMissedDays(habit, checkins, today);
    
    if (newCheckins.length > 0) {
      for (const item of newCheckins) {
        await insertOrUpdateCheckin(item);
      }
      if (remainingFreezes !== habit.freezes_left) {
        await updateHabitFreezes(habit.id, remainingFreezes);
        habit.freezes_left = remainingFreezes;
      }
      // Re-fetch updated checkins
      checkins = await getCheckinsByHabitId(habit.id);
    }

    const metrics = calculateStreakMetrics(checkins, today);
    const latestImageObj = checkins.slice().reverse().find(c => c.image_path);

    enriched.push({
      ...habit,
      ...metrics,
      checkinsCount: checkins.length,
      recentCheckins: checkins.slice(-30), // last 30 for calendar preview
      latestImage: latestImageObj ? latestImageObj.image_path : null
    });
  }

  return enriched;
}
