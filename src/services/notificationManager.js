import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initialize notification channels and request permissions
 */
export async function initNotifications() {
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
        name: 'Nhắc Nhở Kỷ Luật',
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
  if (!habit || !habit.reminder_time) return null;

  try {
    // First cancel any existing scheduled notification for this habit
    await cancelHabitReminder(habit.id);

    const [hourStr, minStr] = habit.reminder_time.split(':');
    const hour = parseInt(hourStr, 10) || 8;
    const minute = parseInt(minStr, 10) || 0;

    const identifier = `habit_reminder_${habit.id}`;
    const habitTypeLabel = habit.type === 'build' ? '📸 Chụp ảnh kỷ luật' : '🛡️ Vượt qua cám dỗ';

    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'habit-discipline-reminders'
    };

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `🔥 Kỷ Luật: ${habit.title}`,
        body: `Đã đến giờ điểm danh [${habitTypeLabel}]! Hãy giữ vững streak của bạn hôm nay.`,
        data: { habitId: habit.id, type: habit.type },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: habit.color_code || '#6366F1',
      },
      trigger,
    });

    console.log(`[NotificationManager] Scheduled daily reminder for Habit #${habit.id} at ${hour}:${minute}`);
    return identifier;
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
  try {
    const identifier = `habit_reminder_${habitId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`[NotificationManager] Cancelled reminder for Habit #${habitId}`);
  } catch (error) {
    console.error(`[NotificationManager] Failed to cancel reminder for Habit #${habitId}:`, error);
  }
}

/**
 * Reschedule reminders for all active habits
 * @param {Array<object>} habits
 */
export async function rescheduleAllHabitReminders(habits = []) {
  for (const habit of habits) {
    await scheduleHabitReminder(habit);
  }
}
