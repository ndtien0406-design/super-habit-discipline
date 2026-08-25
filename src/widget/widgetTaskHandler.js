import React from 'react';
import { widgetTaskHandler as defaultWidgetTaskHandler } from 'react-native-android-widget';
import { HabitGlanceWidget } from './HabitGlanceWidget.jsx';
import { getEnrichedHabitsList } from '../database/queries.js';
import { WIDGET_NAME } from '../services/widgetService.js';

export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;
  const widgetAction = props.widgetAction;

  if (
    widgetAction === 'WIDGET_ADDED' ||
    widgetAction === 'WIDGET_UPDATE' ||
    widgetAction === 'WIDGET_RESIZED'
  ) {
    let habits = widgetInfo?.habits || [];
    let lastUpdated = widgetInfo?.lastUpdated || '';

    // If no info passed, fetch it (e.g. background update)
    if (habits.length === 0) {
      const rawHabits = await getEnrichedHabitsList();
      habits = rawHabits.map(h => ({
        id: h.id,
        title: h.title,
        type: h.type,
        color: h.color_code,
        streak: h.currentStreak,
        isCompleted: h.isTodayCompleted,
        latestImage: h.latestImage,
        deepLink: `superhabit://habit/${h.id}`
      }));
      lastUpdated = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    props.renderWidget(
      <HabitGlanceWidget habits={habits} lastUpdated={lastUpdated} />
    );
  }
}
