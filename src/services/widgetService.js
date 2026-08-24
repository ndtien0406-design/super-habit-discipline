import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { getEnrichedHabitsList } from '../database/queries.js';

export const WIDGET_NAME = 'HabitGlanceWidget';

/**
 * Push the latest habit status grid to the Android Home Screen Widget (Jetpack Glance)
 */
export async function updateHabitWidget() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const habits = await getEnrichedHabitsList();

    // Prepare serializable payload for the Jetpack Glance Widget Grid
    const widgetData = habits.map(h => ({
      id: h.id,
      title: h.title,
      type: h.type,
      color: h.color_code,
      streak: h.currentStreak,
      isCompleted: h.isTodayCompleted,
      deepLink: `superhabit://habit/${h.id}`
    }));

    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => null, // The layout component is registered in widget/HabitGlanceWidget
      widgetInfo: {
        habits: widgetData,
        lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    });

    console.log('[WidgetService] Successfully updated Jetpack Glance widget with', widgetData.length, 'habits');
  } catch (error) {
    // Graceful handling if widget is not placed on home screen or in dev environment
    console.log('[WidgetService] Widget update info:', error.message || error);
  }
}
