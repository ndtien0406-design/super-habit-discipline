import { getTodayDateString, addDays, getDaysDifference, generateDateRange } from './dateHelper.js';

export const MILESTONES = [7, 21, 90];

export const MILESTONE_INFO = {
  7: {
    title: 'Khởi Đầu Tốc Độ',
    badge: '⚡',
    description: 'Bạn đã vượt qua tuần đầu tiên đầy thử thách! Não bộ đang dần hình thành phản xạ mới.',
    accent: '#10B981',
  },
  21: {
    title: 'Đột Phá Kỷ Luật',
    badge: '🔥',
    description: 'Chỉ chút nữa là bạn sẽ có người yêu',
    accent: '#F59E0B',
  },
  90: {
    title: 'Bậc Thầy Kỷ Luật',
    badge: '👑',
    description: '90 ngày để thay đổi hoàn toàn phong cách sống! Bạn đã làm chủ được kỷ luật bản thân.',
    accent: '#A855F7',
  }
};

/**
 * Check if the streak count hits a defined milestone
 * @param {number} streakCount
 * @returns {boolean}
 */
export function isMilestone(streakCount) {
  return MILESTONES.includes(streakCount);
}

/**
 * Get detailed milestone info for a given streak
 * @param {number} streakCount
 * @returns {object|null}
 */
export function getMilestoneDetails(streakCount) {
  return MILESTONE_INFO[streakCount] || null;
}

/**
 * Calculate the streak statistics for a habit from its check-in records
 * @param {Array<{checkin_date: string, status: 'completed'|'failed'|'frozen'}>} checkins - Chronological checkins
 * @param {string} [today=getTodayDateString()]
 * @returns {{
 *   currentStreak: number,
 *   bestStreak: number,
 *   todayStatus: 'completed'|'frozen'|'failed'|'pending',
 *   isTodayCompleted: boolean
 * }}
 */
export function calculateStreakMetrics(checkins = [], today = getTodayDateString()) {
  if (!checkins || checkins.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalCompletedDays: 0,
      todayStatus: 'pending',
      isTodayCompleted: false
    };
  }

  // Create a fast lookup map for checkin records
  const checkinMap = new Map();
  checkins.forEach(c => {
    checkinMap.set(c.checkin_date, c.status);
  });

  const todayRecord = checkinMap.get(today);
  const isTodayCompleted = todayRecord === 'completed';
  const todayStatus = todayRecord || 'pending';

  // Calculate current streak backwards from today or yesterday
  let currentStreak = 0;
  let cursorDate = today;

  // If today is not checked in yet, start checking from yesterday
  if (!todayRecord) {
    cursorDate = addDays(today, -1);
  }

  while (true) {
    const status = checkinMap.get(cursorDate);
    if (status === 'completed' || status === 'frozen') {
      currentStreak++;
      cursorDate = addDays(cursorDate, -1);
    } else {
      // Missing or failed breaks the active chain
      break;
    }
  }

  // Calculate best streak across all chronological records
  // Sort distinct dates
  const sortedDates = Array.from(checkinMap.keys()).sort();
  let bestStreak = 0;
  let runningStreak = 0;
  let prevDate = null;

  for (const date of sortedDates) {
    const status = checkinMap.get(date);

    if (status === 'completed' || status === 'frozen') {
      if (prevDate === null) {
        runningStreak = 1;
      } else {
        const diff = getDaysDifference(prevDate, date);
        if (diff === 1) {
          runningStreak++;
        } else {
          // Gap without frozen record breaks the chain
          runningStreak = 1;
        }
      }
      prevDate = date;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else {
      // Failed status resets running streak
      runningStreak = 0;
      prevDate = null;
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak);

  // Calculate total completed days (including frozen days which count towards goal)
  const totalCompletedDays = Array.from(checkinMap.values()).filter(status => status === 'completed' || status === 'frozen').length;

  return {
    currentStreak,
    bestStreak,
    totalCompletedDays,
    todayStatus,
    isTodayCompleted
  };
}

/**
 * Determine which missed past dates need to be auto-filled as 'frozen' or 'failed'
 * @param {object} habit - { id, freezes_left, created_at }
 * @param {Array<{checkin_date: string, status: string}>} existingCheckins
 * @param {string} [today=getTodayDateString()]
 * @returns {{
 *   newCheckins: Array<{habit_id: number, checkin_date: string, status: string, day_number: number}>,
 *   remainingFreezes: number
 * }}
 */
export function detectAndProcessMissedDays(habit, existingCheckins = [], today = getTodayDateString()) {
  const existingMap = new Map();
  existingCheckins.forEach(c => existingMap.set(c.checkin_date, c));

  let freezesLeft = habit.freezes_left ?? 3;
  const habitStartDate = habit.created_at ? habit.created_at.substring(0, 10) : today;
  
  // We only inspect dates up to yesterday
  const yesterday = addDays(today, -1);
  if (yesterday < habitStartDate) {
    return { newCheckins: [], remainingFreezes: freezesLeft };
  }

  const allDates = generateDateRange(habitStartDate, yesterday);
  const newCheckins = [];

  let runningDayNumber = 0;

  for (const date of allDates) {
    const existing = existingMap.get(date);
    if (existing) {
      if (existing.status === 'completed' || existing.status === 'frozen') {
        runningDayNumber++;
      } else {
        runningDayNumber = 0;
      }
    } else {
      // Missing day detected!
      if (freezesLeft > 0) {
        // Protected by Freeze card (max 3 per month)
        freezesLeft--;
        runningDayNumber++;
        newCheckins.push({
          habit_id: habit.id,
          checkin_date: date,
          status: 'frozen',
          day_number: runningDayNumber,
          note: 'Auto-protected by Freeze Card',
          image_path: null
        });
      } else {
        // Freeze quota exhausted -> Failed -> reset streak
        runningDayNumber = 0;
        newCheckins.push({
          habit_id: habit.id,
          checkin_date: date,
          status: 'failed',
          day_number: 0,
          note: 'Missed check-in (Monthly quota of 3 Freezes exhausted)',
          image_path: null
        });
      }
    }
  }

  return {
    newCheckins,
    remainingFreezes: freezesLeft
  };
}
