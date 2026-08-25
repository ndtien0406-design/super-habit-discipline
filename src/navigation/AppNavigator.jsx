import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { DashboardScreen } from '../screens/DashboardScreen.jsx';
import { HabitDetailScreen } from '../screens/HabitDetailScreen.jsx';
import { BuildCheckinScreen } from '../screens/BuildCheckinScreen.jsx';
import { QuitCheckinScreen } from '../screens/QuitCheckinScreen.jsx';
import { CreateHabitScreen } from '../screens/CreateHabitScreen.jsx';
import { SettingsScreen } from '../screens/SettingsScreen.jsx';
import { useAppTheme } from '../theme/index.js';

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'superhabit://'],
  config: {
    screens: {
      Dashboard: 'dashboard',
      HabitDetail: 'habit/:habitId',
      BuildCheckin: 'checkin/build/:habitId',
      QuitCheckin: 'checkin/quit/:habitId',
      CreateHabit: 'create',
      Settings: 'settings',
    },
  },
};

export function AppNavigator() {
  const { colors } = useAppTheme();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
        <Stack.Screen name="BuildCheckin" component={BuildCheckinScreen} />
        <Stack.Screen name="QuitCheckin" component={QuitCheckinScreen} />
        <Stack.Screen name="CreateHabit" component={CreateHabitScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
