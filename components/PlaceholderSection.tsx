import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface PlaceholderSectionProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function PlaceholderSection({ 
  title, 
  message, 
  icon 
}: PlaceholderSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholderContainer}>
        {icon || <Calendar size={32} color={Colors.dark.subtext} />}
        <Text style={styles.placeholderText}>{message}</Text>
        <Text style={styles.comingSoonText}>Yet to come</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  placeholderContainer: {
    marginHorizontal: Layout.spacing.md,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    height: 150,
  },
  placeholderText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  comingSoonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    marginTop: Layout.spacing.sm,
    fontWeight: '500',
  },
});