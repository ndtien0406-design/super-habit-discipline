/**
 * Date helper utilities for habit tracking, streak calculations,
 * and monthly freeze limit resets.
 */

/**
 * Format a Date object to YYYY-MM-DD in local time
 * @param {Date} [date]
 * @returns {string} 'YYYY-MM-DD'
 */
export function getTodayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current year and month formatted as YYYY-MM
 * @param {Date} [date]
 * @returns {string} 'YYYY-MM'
 */
export function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse DD/MM/YYYY to YYYY-MM-DD
 * @param {string} dateStr 
 * @returns {string|null}
 */
export function parseVietnameseDateToIso(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 * @param {string} isoStr 
 * @returns {string}
 */
export function formatIsoToVietnameseDate(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Check if the given last reset month is older than the current month
 * @param {string|null} lastResetMonth - 'YYYY-MM'
 * @returns {boolean}
 */
export function isNewMonth(lastResetMonth) {
  if (!lastResetMonth) return true;
  return getCurrentMonthKey() !== lastResetMonth;
}

/**
 * Add or subtract days from a YYYY-MM-DD date string
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} days - Number of days to add (or subtract if negative)
 * @returns {string} 'YYYY-MM-DD'
 */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getTodayDateString(date);
}

/**
 * Calculate the difference in calendar days between two YYYY-MM-DD dates (d2 - d1)
 * @param {string} dateStr1 - 'YYYY-MM-DD'
 * @param {string} dateStr2 - 'YYYY-MM-DD'
 * @returns {number}
 */
export function getDaysDifference(dateStr1, dateStr2) {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Generate an inclusive array of YYYY-MM-DD dates between start and end
 * @param {string} startDateStr - 'YYYY-MM-DD'
 * @param {string} endDateStr - 'YYYY-MM-DD'
 * @returns {string[]}
 */
export function generateDateRange(startDateStr, endDateStr) {
  const dates = [];
  let current = startDateStr;
  const diff = getDaysDifference(startDateStr, endDateStr);
  
  if (diff < 0) return [startDateStr];

  while (current <= endDateStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function formatDisplayDate(dateStr, style = 'full') {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  
  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');

  if (style === 'dayMonth') {
    return `${dStr}/${mStr}`;
  }
  if (style === 'short') {
    return `${monthName} ${dStr}, ${y}`;
  }
  return `${dayOfWeek}, ${monthName} ${dStr}, ${y}`;
}

/**
 * Get the list of last N days ending today
 * @param {number} count
 * @returns {string[]}
 */
export function getRecentDays(count = 30) {
  const today = getTodayDateString();
  const startDate = addDays(today, -(count - 1));
  return generateDateRange(startDate, today);
}
