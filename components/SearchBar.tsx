import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet, Pressable, ActivityIndicator, Text, TouchableOpacity, ViewStyle, Animated, Easing } from 'react-native';
import { Anime } from '@/types/anime';
import { AnimeSuggestionCard } from './AnimeSuggestionCard';
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
  const [placeholderText, setPlaceholderText] = useState('');
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const inputRef = React.useRef<TextInput>(null);
  const cursorAnim = React.useRef(new Animated.Value(0)).current;
  const debounceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const animeNames = [
    'Naruto',
    'Attack on Titan',
    'Demon Slayer',
    'Jujutsu Kaisen',
    'One Piece',
    'My Hero Academia',
  ];
  
  React.useEffect(() => {
    let currentNameIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let animationTimeout: ReturnType<typeof setTimeout> | null = null;

    const animateTyping = () => {
      const currentName = animeNames[currentNameIndex];

      if (isDeleting) {
        setPlaceholderText(currentName.substring(0, currentCharIndex - 1));
        currentCharIndex--;

        if (currentCharIndex === 0) {
          isDeleting = false;
          currentNameIndex = (currentNameIndex + 1) % animeNames.length;
        }
      } else {
        setPlaceholderText(currentName.substring(0, currentCharIndex + 1));
        currentCharIndex++;

        if (currentCharIndex === currentName.length) {
          isDeleting = true;
          animationTimeout = setTimeout(animateTyping, 1000); // Pause at full word
          return;
        }
      }

      const typingSpeed = isDeleting ? 50 : Math.random() * 50 + 50; // Vary speed for natural feel
      animationTimeout = setTimeout(animateTyping, typingSpeed);
    };

    animationTimeout = setTimeout(animateTyping, 1000);

    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, []);
  
  // Cursor blink animation
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, []);
  
  const cursorOpacity = cursorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const searchAnime = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
  
    setIsSearching(true);
    setShowSuggestions(true);
    
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/api/trpc/anime.getAllAnime?input=${encodeURIComponent(
          JSON.stringify({
            json: {
              search: searchQuery,
              limit: 5,
              offset: 0,
              random: false
            }
          })
        )}`
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch suggestions: ${response.status} ${response.statusText}`);
      }
  
      const resJson = await response.json();
      const animeList = resJson?.result?.data?.json?.anime ?? [];
  
      const formattedData = animeList.map((anime: any) => ({
        aid: anime.aid || 0,
        name: anime.name || 'Unknown Title',
        jname: anime.jname || '',
        poster: anime.poster || 'https://via.placeholder.com/80x120',
        type: anime.type || 'TV',
        status: anime.status || 'Unknown',
        total_episodes: anime.total_episodes || 0,
        imdb_rating: anime.imdb_rating || 0
      }));      
  
      setSuggestions(formattedData);
  
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };
  

  // Handle search input change with debounce
  const handleSearchChange = (text: string) => {
    setQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (text.trim().length < 2) {
      setShowSuggestions(false);
      return;
    }
    
    // Show loading state immediately
    setIsSearching(true);
    setShowSuggestions(true);
    
    debounceTimeout.current = setTimeout(() => {
      searchAnime(text);
    }, 3000); // 3 second delay before searching
  };

  const handleSelectSuggestion = useCallback(async (anime: Anime) => {
    console.log('handleSelectSuggestion called with:', anime);
    if (!anime?.aid) {
      console.error('Invalid anime data');
      return;
    }
    
    const id = String(anime.aid);
    console.log('Attempting navigation to anime:', id);
    
    // Close suggestions first
    setQuery(anime.name);
    setShowSuggestions(false);
    
    try {
      // Try direct navigation
      await router.push(`/anime/${id}`);
    } catch (err) {
      console.error('Navigation failed, trying alternative:', err);
      // Fallback to window location
      window.location.href = `/anime/${id}`;
    }
  }, [router]);

  const handleSearch = (): void => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(query);
    } else {
      router.push({
        pathname: '/search',
        params: { q: query },
      });
    }
  };

  const clearSearch = (): void => {
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
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={handleSearchChange}
            placeholder=""
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            selectionColor={Colors.dark.primary}
          />
          
          {/* Search Suggestions */}
          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.dark.primary} />
                  <Text style={styles.loadingText}>Searching for anime...</Text>
                </View>
              ) : suggestions.length > 0 ? (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.aid.toString()}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews={false}
                  renderItem={({ item }) => (
                    <Pressable 
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        { opacity: pressed ? 0.7 : 1 }
                      ]}
                      onPress={() => {
                        console.log('Suggestion pressed:', item.aid);
                        handleSelectSuggestion(item);
                      }}
                    >
                      <AnimeSuggestionCard anime={item} />
                    </Pressable>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No anime found</Text>
                  <Text style={styles.noResultsSubtext}>Try different keywords</Text>
                </View>
              )}
            </View>
          )}
          
          {!query && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Search for {placeholderText}
                <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>
                  |
                </Animated.Text>
              </Text>
            </View>
          )}
        </View>
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
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    padding: 12,
    paddingRight: 40,
    backgroundColor: 'transparent',
  },
  placeholderContainer: {
    position: 'absolute',
    left: 12,
    top: 0,
    right: 40,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  cursor: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 400,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionItem: {
    width: '100%',
    backgroundColor: 'transparent',
  } as ViewStyle,
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noResultsSubtext: {
    color: '#888',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 12,
  },
});