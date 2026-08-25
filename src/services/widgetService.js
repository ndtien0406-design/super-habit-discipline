import React from 'react';
import { Platform } from 'react-native';
import { getEnrichedHabitsList } from '../database/queries.js';
import { HabitGlanceWidget } from '../widget/HabitGlanceWidget.jsx';

export const WIDGET_NAME = 'HabitGlanceWidget';

/**
 * Push the latest habit status grid to the Android Home Screen Widget (Jetpack Glance)
 */
export async function updateHabitWidget() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const habits = await getEnrichedHabitsList();

    // Prepare serializable payload for the Jetpack Glance Widget Grid
    const widgetData = habits.map(h => ({
      id: h.id,
      title: h.title,
      type: h.type,
      color: h.color_code,
      streak: h.currentStreak,
      isCompleted: h.isTodayCompleted,
      latestImage: h.latestImage,
      deepLink: `superhabit://habit/${h.id}`
    }));

    const lastUpdated = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => <HabitGlanceWidget habits={widgetData} lastUpdated={lastUpdated} />,
      widgetInfo: {
        habits: widgetData,
        lastUpdated
      }
    });

    console.log('[WidgetService] Successfully updated Jetpack Glance widget with', widgetData.length, 'habits');
  } catch (error) {
    console.log('[WidgetService] Widget update info:', error.message || error);
  }
}
