import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, queryClient, trpcClient } from '@/lib/trpc';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '@/constants/colors';

export default function RootLayout() {
  // Remove font loading since the files don't exist
  // and are causing bundling errors

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: Colors.dark.background,
                },
                headerTintColor: Colors.dark.text,
                headerTitleStyle: {
                  fontFamily: 'System',
                },
                contentStyle: {
                  backgroundColor: Colors.dark.background,
                },
                animation: 'slide_from_right',
              }}
            />
          </SafeAreaProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}