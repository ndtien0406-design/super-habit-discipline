import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { getDatabase } from './src/database/dbSetup.js';
import { getAllHabits, createHabit } from './src/database/queries.js';
import { initNotifications, scheduleHabitReminder } from './src/services/notificationManager.js';
import { HabitGlanceWidget } from './src/widget/HabitGlanceWidget.jsx';
import { THEME } from './src/theme/index.js';

// Register Android Widget background task handler
try {
  registerWidgetTaskHandler(async (props) => {
    const { widgetInfo } = props;
    return <HabitGlanceWidget habits={widgetInfo?.habits || []} lastUpdated={widgetInfo?.lastUpdated || ''} />;
  });
} catch (e) {
  // Graceful fallback in environments without widget support
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Initialize SQLite Database
        const db = await getDatabase();

        // 2. Initialize Notifications
        await initNotifications();

        // 3. Seed initial starter habits if database is completely empty
        const existingHabits = await getAllHabits();
        if (existingHabits.length === 0) {
          const habit1Id = await createHabit({
            title: 'Chạy Bộ 5km Buổi Sáng',
            type: 'build',
            color_code: '#10B981',
            reminder_time: '06:00',
          });
          await scheduleHabitReminder({
            id: habit1Id,
            title: 'Chạy Bộ 5km Buổi Sáng',
            type: 'build',
            color_code: '#10B981',
            reminder_time: '06:00',
          });

          const habit2Id = await createHabit({
            title: 'Không Thức Khuya Sau 23:00',
            type: 'quit',
            color_code: '#F59E0B',
            reminder_time: '22:30',
          });
          await scheduleHabitReminder({
            id: habit2Id,
            title: 'Không Thức Khuya Sau 23:00',
            type: 'quit',
            color_code: '#F59E0B',
            reminder_time: '22:30',
          });
        }
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
      } finally {
        setIsReady(true);
      }
    }

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0D14',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
