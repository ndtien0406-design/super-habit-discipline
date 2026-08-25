import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior when app is in foreground (Native only)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // Ignore in unsupported environments
  }
}

/**
 * Initialize notification channels and request permissions
 */
export async function initNotifications() {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationManager] Permission for notifications was not granted.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habit-discipline-reminders', {
        name: 'Discipline Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return true;
  } catch (error) {
    console.error('[NotificationManager] Error initializing notifications:', error);
    return false;
  }
}

/**
 * Schedule a daily recurring reminder for a specific habit
 * @param {object} habit - { id, title, type, reminder_time }
 */
export async function scheduleHabitReminder(habit) {
  if (Platform.OS === 'web' || !habit || !habit.reminder_time) return null;

  try {
    // First cancel any existing scheduled notification for this habit
    await cancelHabitReminder(habit.id);

    const times = habit.reminder_time.split(',').map(t => t.trim()).filter(Boolean);
    const identifiers = [];

    for (let i = 0; i < times.length; i++) {
      const [hourStr, minStr] = times[i].split(':');
      const hour = parseInt(hourStr, 10) || 8;
      const minute = parseInt(minStr, 10) || 0;

      const identifier = `habit_reminder_${habit.id}_${i}`;
      const habitTypeLabel = habit.type === 'build' ? '📸 Chụp Ảnh' : '🛡️ Đã Vượt Qua';

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'habit-discipline-reminders'
      };

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `🔥 Kỷ luật: ${habit.title}`,
          body: `Đã đến giờ [${habitTypeLabel}]! Hãy giữ vững chuỗi kỷ lục của bạn nhé.`,
          data: { habitId: habit.id, type: habit.type },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: habit.color_code || '#6366F1',
        },
        trigger,
      });
      identifiers.push(identifier);
    }

    return identifiers;
  } catch (error) {
    console.error(`[NotificationManager] Failed to schedule reminder for Habit #${habit.id}:`, error);
    return null;
  }
}

/**
 * Cancel the scheduled reminder for a specific habit
 * @param {number} habitId
 */
export async function cancelHabitReminder(habitId) {
  if (Platform.OS === 'web') return;

  try {
    // Cancel up to 20 possible reminders for this habit
    for (let i = 0; i < 20; i++) {
      const identifier = `habit_reminder_${habitId}_${i}`;
      await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    // Cancel the legacy single identifier just in case
    await Notifications.cancelScheduledNotificationAsync(`habit_reminder_${habitId}`);
  } catch (error) {
    console.error(`[NotificationManager] Failed to cancel reminder for Habit #${habitId}:`, error);
  }
}

/**
 * Reschedule reminders for all active habits
 * @param {Array<object>} habits
 */
export async function rescheduleAllHabitReminders(habits = []) {
  if (Platform.OS === 'web') return;

  for (const habit of habits) {
    await scheduleHabitReminder(habit);
  }
}
