import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
// Remove the import since we'll use the correct React Native type
import { StyleSheet, View, Text, Pressable, Dimensions, Platform, TouchableOpacity } from 'react-native';
// Use expo-image's Image component with proper type
import { Image as ExpoImage } from 'expo-image';

// Fallback component for web if needed
const Image = ({ source, style, contentFit, transition, ...props }: any) => {
  if (Platform.OS === 'web') {
    return (
      <img 
        src={source?.uri} 
        style={style} 
        alt={props.alt || ''}
        {...props}
      />
    );
  }
  return <ExpoImage source={source} style={style} contentFit={contentFit} transition={transition} {...props} />;
};
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Star, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { LocalAnime } from '@/types/anime';

interface SpotlightCarouselProps {
  animeList: LocalAnime[];
  autoPlay?: boolean;
  interval?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH;
// Calculate a more responsive height based on screen dimensions
// Use a percentage of screen height with a minimum value
const ITEM_HEIGHT = Math.max(350, Math.min(450, SCREEN_HEIGHT * 0.45));

export default function SpotlightCarousel({ 
  animeList, 
  autoPlay = true, 
  interval = 35000 // Increased to 35 seconds as requested
}: SpotlightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(Platform.OS === 'web');
  const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: ITEM_HEIGHT });
  const scrollViewRef = useRef<any>(null);
  const autoPlayTimerRef = useRef<number | null>(null);

  // Handle dimension changes for responsive layout
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      const newItemHeight = Math.max(350, Math.min(450, height * 0.45));
      setDimensions({ width, height: newItemHeight });
    };

    // Set initial dimensions
    updateDimensions();

    // Add event listener for dimension changes (web only)
    if (Platform.OS === 'web') {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  // Setup auto-play
  useEffect(() => {
    if (autoPlay && animeList.length > 1) {
      startAutoPlay();
    }
    
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, animeList.length, activeIndex, interval]);

  const startAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
    
    autoPlayTimerRef.current = setInterval(() => {
      goToNextSlide();
    }, interval);
  };

  const goToNextSlide = () => {
    if (!scrollViewRef.current) return;
    
    const nextIndex = (activeIndex + 1) % animeList.length;
    scrollViewRef.current.scrollTo({
      x: nextIndex * dimensions.width,
      animated: true
    });
    setActiveIndex(nextIndex);
  };

  const goToPrevSlide = () => {
    if (!scrollViewRef.current) return;
    
    const prevIndex = activeIndex === 0 ? animeList.length - 1 : activeIndex - 1;
    scrollViewRef.current.scrollTo({
      x: prevIndex * dimensions.width,
      animated: true
    });
    setActiveIndex(prevIndex);
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / dimensions.width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      
      // Reset auto-play timer when manually scrolled
      if (autoPlay) {
        startAutoPlay();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const AnimatedComponent = Platform.OS === 'web' ? View : Animated.View;

  if (!animeList || animeList.length === 0) {
    return null;
  }

  // Use a wrapper component to avoid transform styles on Link/a tags
  const WatchButtonWrapper = ({ children, animeId }: { children: React.ReactNode, animeId: string }) => (
    <Link href={`/anime/${animeId}`} asChild>
      <Pressable style={styles.watchButton}>
        {children}
      </Pressable>
    </Link>
  );

  return (
    <View style={[styles.container, { height: dimensions.height }]}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[styles.scrollView, { width: dimensions.width }]}
      >
        {animeList.map((anime, index) => {
          const isActive = index === activeIndex;
          
          // Ensure rating is a number
          const ratingValue = typeof anime.rating === 'number' 
            ? anime.rating 
            : typeof anime.rating === 'string' 
              ? parseFloat(anime.rating) || 0 
              : 0;
          
          // Check if we have a trailer URL (in vdo field)
          const hasTrailer = anime.vdo ? (
            anime.vdo.includes('youtube.com') || 
            anime.vdo.includes('youtu.be')
          ) : false;
          
          // Prepare YouTube URL with proper parameters
          const youtubeUrl = anime.vdo && hasTrailer ? 
            `${anime.vdo}${anime.vdo.includes('?') ? '&' : '?'}enablejsapi=1&autoplay=1${isMuted ? '&mute=1' : ''}` : 
            '';
          
          return (
            <AnimatedComponent 
              key={anime.id || index}
              entering={Platform.OS !== 'web' ? FadeIn.duration(500) : undefined}
              style={[styles.itemContainer, { width: dimensions.width, height: dimensions.height }]}
            >
              {/* Show trailer if available and active, otherwise show image */}
              {hasTrailer && isActive && showVideo && Platform.OS === 'web' ? (
                <View style={[styles.videoContainer, { width: dimensions.width, height: dimensions.height }]}>
                  {/* Use iframe for web platform with responsive sizing */}
                  <iframe
                    src={youtubeUrl}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      border: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      objectFit: 'cover'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </View>
              ) : (
                <Image
                  source={{ uri: anime.bannerImage || anime.coverImage }}
                  style={[styles.image, { width: dimensions.width, height: dimensions.height }]}
                  contentFit="cover"
                  transition={500}
                  alt={anime.title}
                />
              )}
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                style={[styles.gradient, { width: dimensions.width }]}
              />
              
              <View style={styles.content}>
                <View style={styles.genreContainer}>
                  {anime.genres.slice(0, 3).map((genre: string, idx: number) => (
                    <View key={idx} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                  {anime.status === "Current" && (
                    <View style={styles.airingTag}>
                      <Text style={styles.airingText}>AIRING</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.title} numberOfLines={2}>{anime.title}</Text>
                <View style={styles.metaContainer}>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color={Colors.dark.accent} fill={Colors.dark.accent} />
                    <Text style={styles.rating}>{ratingValue.toFixed(1)}</Text>
                  </View>
                  {anime.episodes && (
                    <View style={styles.metaItem}>
                      <Text style={styles.episodes}>{anime.episodes} Episodes</Text>
                    </View>
                  )}
                  {anime.duration && (
                    <View style={styles.metaItem}>
                      <Text style={styles.duration}>{anime.duration}</Text>
                    </View>
                  )}
                  {anime.quality && (
                    <View style={styles.qualityTag}>
                      <Text style={styles.qualityText}>{anime.quality}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.synopsis} numberOfLines={2}>
                  {anime.description}
                </Text>
                <View style={styles.buttonContainer}>
                  <WatchButtonWrapper animeId={anime.id}>
                    <Play size={16} color={Colors.dark.text} />
                    <Text style={styles.watchButtonText}>Watch Now</Text>
                  </WatchButtonWrapper>
                  
                  {hasTrailer && Platform.OS === 'web' && (
                    <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                      {isMuted ? (
                        <VolumeX size={20} color={Colors.dark.text} />
                      ) : (
                        <Volume2 size={20} color={Colors.dark.text} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </AnimatedComponent>
          );
        })}
      </Animated.ScrollView>
      
      {/* Navigation arrows */}
      {animeList.length > 1 && (
        <>
          <TouchableOpacity 
            style={styles.navButtonLeft} 
            onPress={goToPrevSlide}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButtonRight} 
            onPress={goToNextSlide}
            activeOpacity={0.7}
          >
            <ChevronRight size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </>
      )}
      
      {/* Pagination dots */}
      <View style={styles.pagination}>
        {animeList.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
            onPress={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  x: index * dimensions.width,
                  animated: true
                });
                setActiveIndex(index);
                
                // Reset auto-play timer when dot is pressed
                if (autoPlay) {
                  startAutoPlay();
                }
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: Layout.spacing.md,
    overflow: 'hidden', // Prevent content from spilling outside
  },
  scrollView: {
    flex: 1,
  },
  itemContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'absolute',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '70%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg, // Add more padding at bottom for pagination dots
  },
  genreContainer: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xs,
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 4,
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  genreText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  airingTag: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 4,
    marginRight: Layout.spacing.xs,
  },
  airingText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  rating: {
    color: Colors.dark.text,
    fontSize: 14,
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  episodes: {
    color: Colors.dark.text,
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  duration: {
    color: Colors.dark.text,
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  qualityTag: {
    backgroundColor: Colors.dark.secondary,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  qualityText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  synopsis: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: Layout.spacing.md,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
  },
  watchButtonText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginLeft: Layout.spacing.xs,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.md,
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
    backgroundColor: Colors.dark.primary,
    opacity: 1,
    width: 16,
  },
  navButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: 10,
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonRight: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});