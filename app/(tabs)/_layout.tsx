import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Bookmark, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { View } from 'react-native';
import Header from '@/components/Header';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.dark.tabBar,
          borderTopColor: Colors.dark.border,
        },
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTitleStyle: {
          color: Colors.dark.text,
        },
        header: (props) => {
          const routeName = props.route.name;
          let title = '';
          let showSearch = true;
          
          switch (routeName) {
            case 'index':
              title = '';
              break;
            case 'explore':
              title = 'Explore';
              break;
            case 'watchlist':
              title = 'My Watchlist';
              showSearch = false;
              break;
            case 'profile':
              title = 'Profile';
              showSearch = false;
              break;
          }
          
          return <Header title={title} showSearch={showSearch} />;
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}