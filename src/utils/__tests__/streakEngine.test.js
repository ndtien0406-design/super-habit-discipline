import { calculateStreakMetrics, detectAndProcessMissedDays, isMilestone } from '../streakEngine.js';
import { getTodayDateString, addDays, isNewMonth } from '../dateHelper.js';

console.log('🧪 RUNNING SUPER CLIENT STREAK ENGINE TESTS...');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failCount++;
  }
}

// 1. Test consecutive checkins streak calculation
const today = '2026-08-24';
const checkinsConseq = [
  { checkin_date: '2026-08-20', status: 'completed' },
  { checkin_date: '2026-08-21', status: 'completed' },
  { checkin_date: '2026-08-22', status: 'completed' },
  { checkin_date: '2026-08-23', status: 'completed' },
  { checkin_date: '2026-08-24', status: 'completed' },
];

const metrics1 = calculateStreakMetrics(checkinsConseq, today);
assert(metrics1.currentStreak === 5, 'Consecutive 5 days should give currentStreak = 5');
assert(metrics1.bestStreak === 5, 'Best streak should be 5');
assert(metrics1.isTodayCompleted === true, 'isTodayCompleted should be true');

// 2. Test freeze preservation
const checkinsWithFreeze = [
  { checkin_date: '2026-08-20', status: 'completed' },
  { checkin_date: '2026-08-21', status: 'frozen' },
  { checkin_date: '2026-08-22', status: 'completed' },
  { checkin_date: '2026-08-23', status: 'completed' },
  { checkin_date: '2026-08-24', status: 'completed' },
];
const metrics2 = calculateStreakMetrics(checkinsWithFreeze, today);
assert(metrics2.currentStreak === 5, 'Frozen day preserves streak length');

// 3. Test failed day break
const checkinsWithFailed = [
  { checkin_date: '2026-08-10', status: 'completed' },
  { checkin_date: '2026-08-11', status: 'completed' },
  { checkin_date: '2026-08-12', status: 'failed' },
  { checkin_date: '2026-08-23', status: 'completed' },
  { checkin_date: '2026-08-24', status: 'completed' },
];
const metrics3 = calculateStreakMetrics(checkinsWithFailed, today);
assert(metrics3.currentStreak === 2, 'Failed day breaks previous streak, current is 2');
assert(metrics3.bestStreak === 2, 'Best streak is 2');

// 4. Test detectAndProcessMissedDays with 3 freezes limit
const habit = {
  id: 1,
  title: 'Chạy bộ 5km',
  freezes_left: 3,
  created_at: '2026-08-18'
};
// User only checked in on 18 and 19. Missed 20, 21, 22, 23 (4 missed days)
const userCheckins = [
  { checkin_date: '2026-08-18', status: 'completed' },
  { checkin_date: '2026-08-19', status: 'completed' },
];

const processed = detectAndProcessMissedDays(habit, userCheckins, '2026-08-24');
assert(processed.newCheckins.length === 4, 'Should detect 4 missed days (20, 21, 22, 23)');
assert(processed.newCheckins[0].status === 'frozen', '1st miss (day 20) should be frozen');
assert(processed.newCheckins[1].status === 'frozen', '2nd miss (day 21) should be frozen');
assert(processed.newCheckins[2].status === 'frozen', '3rd miss (day 22) should be frozen');
assert(processed.newCheckins[3].status === 'failed', '4th miss (day 23) exceeds 3 freezes limit -> failed');
assert(processed.remainingFreezes === 0, 'Remaining freezes should be 0');

// 5. Test Milestones
assert(isMilestone(7) === true, '7 days is a milestone');
assert(isMilestone(21) === true, '21 days is a milestone');
assert(isMilestone(90) === true, '90 days is a milestone');
assert(isMilestone(15) === false, '15 days is not a milestone');

// 6. Test Month Reset
assert(isNewMonth('2026-07') === true, 'Previous month triggers new month reset');
assert(isNewMonth('2026-08') === false, 'Current month does not trigger new month reset');

console.log(`\n🏁 Test Results: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) process.exit(1);
