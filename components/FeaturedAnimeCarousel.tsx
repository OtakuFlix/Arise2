import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Star } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { Anime } from '@/types/anime';

interface FeaturedAnimeCarouselProps {
  animeList: Anime[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH;
const ITEM_HEIGHT = 240;

export default function FeaturedAnimeCarousel({ animeList }: FeaturedAnimeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / ITEM_WIDTH);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const AnimatedComponent = Platform.OS === 'web' ? View : Animated.View;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {animeList.map((anime, index) => {
          // Ensure rating is a number
          const ratingValue = typeof anime.imdb_rating === 'number' 
            ? anime.imdb_rating 
            : typeof anime.imdb_rating === 'string' 
              ? parseFloat(anime.imdb_rating) || 0 
              : 0;
              
          return (
            <AnimatedComponent 
              key={anime.aid}
              entering={Platform.OS !== 'web' ? FadeIn.duration(500) : undefined}
              style={styles.itemContainer}
            >
              <Image
                source={{ uri: anime.banners?.[0] || anime.banner.split(", ")[0] }}
                style={styles.image}
                contentFit="cover"
                transition={500}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
              />
              <View style={styles.content}>
                <View style={styles.genreContainer}>
                  {(anime.genres || anime.genre.split(", ")).slice(0, 3).map((genre: string, idx: number) => (
                    <View key={idx} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.title}>{anime.name}</Text>
                <View style={styles.metaContainer}>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color={Colors.dark.accent} fill={Colors.dark.accent} />
                    <Text style={styles.rating}>{ratingValue.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.episodes}>{anime.total_episodes} Episodes</Text>
                </View>
                <Link href={`/anime/${anime.aid}`} asChild>
                  <Pressable style={styles.watchButton}>
                    <Play size={16} color={Colors.dark.text} />
                    <Text style={styles.watchButtonText}>Watch Now</Text>
                  </Pressable>
                </Link>
              </View>
            </AnimatedComponent>
          );
        })}
      </Animated.ScrollView>
      <View style={styles.pagination}>
        {animeList.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT,
    marginBottom: Layout.spacing.md,
  },
  scrollView: {
    width: SCREEN_WIDTH,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    position: 'relative',
  },
  image: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.md,
  },
  genreContainer: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xs,
  },
  genreTag: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 4,
    marginRight: Layout.spacing.xs,
  },
  genreText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  rating: {
    color: Colors.dark.text,
    fontSize: 14,
    marginLeft: 4,
  },
  episodes: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginRight: Layout.spacing.md,
  },
  watchButton: {
    backgroundColor: Colors.dark.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  watchButtonText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginLeft: Layout.spacing.xs,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: Layout.spacing.sm,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.subtext,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  paginationDotActive: {
    backgroundColor: Colors.dark.accent,
    opacity: 1,
    width: 16,
  },
});