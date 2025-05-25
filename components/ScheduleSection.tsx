import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Calendar, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface ScheduleEntry {
  time: string;
  name: string;
  available: boolean;
  poster?: string;
  aid?: string;
}

interface DaySchedule {
  day: string;
  entries: ScheduleEntry[];
}

interface ScheduleSectionProps {
  title: string;
  scheduleData: DaySchedule[];
}

export default function ScheduleSection({ title, scheduleData }: ScheduleSectionProps) {
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  
  function getCurrentDay(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }
  
  // Find the schedule for the selected day
  const daySchedule = scheduleData.find(schedule => schedule.day === selectedDay) || { day: selectedDay, entries: [] };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {scheduleData.map((schedule) => (
          <TouchableOpacity
            key={schedule.day}
            style={[
              styles.dayButton,
              selectedDay === schedule.day && styles.selectedDayButton
            ]}
            onPress={() => setSelectedDay(schedule.day)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDay === schedule.day && styles.selectedDayText
              ]}
            >
              {schedule.day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.scheduleContainer}>
        {daySchedule.entries.length > 0 ? (
          daySchedule.entries.map((entry, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text style={styles.timeText}>{entry.time}</Text>
              
              {entry.available && entry.poster && entry.aid ? (
                <Link href={`/anime/${entry.aid}`} asChild>
                  <Pressable style={styles.availableAnime}>
                    <Image
                      source={{ uri: entry.poster }}
                      style={styles.animePoster}
                      contentFit="cover"
                    />
                    <View style={styles.animeInfo}>
                      <Text style={styles.animeName}>{entry.name}</Text>
                      <Text style={styles.availableText}>Available Now</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.dark.primary} />
                  </Pressable>
                </Link>
              ) : (
                <View style={styles.unavailableAnime}>
                  <Calendar size={24} color={Colors.dark.subtext} />
                  <View style={styles.animeInfo}>
                    <Text style={styles.animeName}>{entry.name}</Text>
                    <Text style={styles.unavailableText}>Coming Soon</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noScheduleContainer}>
            <Calendar size={32} color={Colors.dark.subtext} />
            <Text style={styles.noScheduleText}>No anime scheduled for {selectedDay}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  daysContainer: {
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  dayButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  selectedDayButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  dayText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  selectedDayText: {
    fontWeight: 'bold',
  },
  scheduleContainer: {
    paddingHorizontal: Layout.spacing.md,
  },
  scheduleItem: {
    marginBottom: Layout.spacing.md,
  },
  timeText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  availableAnime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  unavailableAnime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    opacity: 0.7,
  },
  animePoster: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
  },
  animeInfo: {
    flex: 1,
  },
  animeName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  availableText: {
    color: Colors.dark.primary,
    fontSize: 12,
  },
  unavailableText: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  noScheduleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  noScheduleText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
  },
});