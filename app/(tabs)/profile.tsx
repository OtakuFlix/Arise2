import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, LogOut, Moon, Bell, Shield, HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

const MenuItem = ({ icon, title, onPress }: MenuItemProps) => (
  <Pressable style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIcon}>{icon}</View>
    <Text style={styles.menuTitle}>{title}</Text>
  </Pressable>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }}
              style={styles.profileImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.username}>AnimeUser</Text>
          <Text style={styles.email}>user@example.com</Text>
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Watching</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>On Hold</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Settings</Text>
          <MenuItem
            icon={<Settings size={20} color={Colors.dark.text} />}
            title="App Settings"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Moon size={20} color={Colors.dark.text} />}
            title="Appearance"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Bell size={20} color={Colors.dark.text} />}
            title="Notifications"
            onPress={() => {}}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <MenuItem
            icon={<HelpCircle size={20} color={Colors.dark.text} />}
            title="Help Center"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Shield size={20} color={Colors.dark.text} />}
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        <Pressable style={styles.logoutButton}>
          <LogOut size={20} color={Colors.dark.text} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: Layout.spacing.md,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  username: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  email: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: Layout.spacing.md,
  },
  editButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  editButtonText: {
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.dark.card,
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  statLabel: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  menuSection: {
    marginBottom: Layout.spacing.lg,
  },
  menuSectionTitle: {
    color: Colors.dark.subtext,
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Colors.dark.card,
    marginBottom: 1,
  },
  menuIcon: {
    marginRight: Layout.spacing.md,
  },
  menuTitle: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  logoutText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Layout.spacing.sm,
  },
});