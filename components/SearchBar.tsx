import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { Router } from 'expo-router';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}

export default function SearchBar({ 
  initialQuery = '', 
  onSearch, 
  isLoading = false,
  autoFocus = false,
  placeholder = "Search anime...",
  onBlur
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const inputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    } else {
      router.push({
        pathname: '/search',
        params: { q: query },
      });
    }
  };

  const clearSearch = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.dark.primary} style={styles.searchIcon} />
        ) : (
          <Search size={20} color={Colors.dark.subtext} style={styles.searchIcon} />
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.subtext}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          onBlur={onBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
        {query.length > 0 && (
          <Pressable onPress={clearSearch} style={styles.clearButton}>
            <X size={16} color={Colors.dark.subtext} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    height: '100%',
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none' as any, // Using any to bypass the type error
    } : {}),
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
});