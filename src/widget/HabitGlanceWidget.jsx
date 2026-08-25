import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';

/**
 * Android Home Screen Widget (Jetpack Glance Grid)
 * Shows a glance of all active habits and their streak counters.
 */
export function HabitGlanceWidget({ habits = [], lastUpdated = '' }) {
  const displayHabits = habits.slice(0, 6); // Up to 6 in the compact glance grid

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0A0D14',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="⚡ PERSONAL DISCIPLINE"
          style={{
            color: '#F8FAFC',
            fontSize: 13,
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={lastUpdated ? `Updated ${lastUpdated}` : 'Super Client'}
          style={{
            color: '#64748B',
            fontSize: 10,
          }}
        />
      </FlexWidget>

      {/* Grid of habits */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          width: 'match_parent',
          flex: 1,
        }}
      >
        {displayHabits.length === 0 ? (
          <FlexWidget
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: 'match_parent',
              height: 'match_parent',
            }}
          >
            <TextWidget
              text="No habits yet. Open app to create!"
              style={{
                color: '#94A3B8',
                fontSize: 12,
              }}
            />
          </FlexWidget>
        ) : (
          displayHabits.map((habit) => (
            <FlexWidget
              key={habit.id}
              clickAction="OPEN_URI"
              clickActionData={{ uri: habit.deepLink || `superhabit://habit/${habit.id}` }}
              style={{
                width: '48%',
                backgroundColor: '#141A26',
                borderRadius: 12,
                padding: 8,
                marginBottom: 6,
                borderLeftWidth: 3,
                borderLeftColor: habit.color || '#6366F1',
              }}
            >
              {habit.latestImage && (
                <ImageWidget
                  image={
                    habit.latestImage.startsWith('http')
                      ? { uri: habit.latestImage }
                      : { uri: habit.latestImage } // Local uri should work if accessible
                  }
                  style={{
                    width: 'match_parent',
                    height: 40,
                    borderRadius: 6,
                    marginBottom: 4,
                  }}
                  imageStyle={{
                    width: 'match_parent',
                    height: 40,
                  }}
                  resizeMode="cover"
                />
              )}
              <TextWidget
                text={habit.title}
                maxLines={1}
                style={{
                  color: '#F8FAFC',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
              <FlexWidget
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <TextWidget
                  text={`🔥 ${habit.streak} days`}
                  style={{
                    color: '#F59E0B',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                />
                <TextWidget
                  text={habit.isCompleted ? '✓ Done' : 'Pending'}
                  style={{
                    color: habit.isCompleted ? '#10B981' : '#64748B',
                    fontSize: 10,
                  }}
                />
              </FlexWidget>
            </FlexWidget>
          ))
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
