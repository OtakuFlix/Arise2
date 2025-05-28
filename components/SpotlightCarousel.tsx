import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Star, Volume2, VolumeX, ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { LocalAnime } from '@/types/anime';

interface SpotlightCarouselProps {
  animeList: LocalAnime[];
  autoPlay?: boolean;
  interval?: number;
  onPlayEpisode?: (animeId: string, episodeNumber: number) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = Math.max(400, Math.min(600, SCREEN_HEIGHT * 0.65));

export default function SpotlightCarousel({ 
  animeList, 
  autoPlay = true, 
  interval = 35000
}: SpotlightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(Platform.OS === 'web');
  const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: ITEM_HEIGHT });
  const [isHovered, setIsHovered] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const autoPlayTimerRef = useRef<number | null>(null);
  const fadeAnim = useSharedValue(1);
  const { width } = useWindowDimensions();

  const truncateSynopsis = (text: string, wordLimit: number = 40) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
  };

  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      const newItemHeight = Math.max(400, Math.min(600, height * 0.65));
      setDimensions({ width, height: newItemHeight });
    };

    updateDimensions();

    if (Platform.OS === 'web') {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  useEffect(() => {
    if (autoPlay && animeList.length > 1 && !isHovered) {
      startAutoPlay();
    }
    
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, animeList.length, activeIndex, interval, isHovered]);

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
    
    fadeAnim.value = withTiming(0.7, { duration: 300 });
    setTimeout(() => {
      const nextIndex = (activeIndex + 1) % animeList.length;
      scrollViewRef.current.scrollTo({
        x: nextIndex * dimensions.width,
        animated: true
      });
      setActiveIndex(nextIndex);
      fadeAnim.value = withTiming(1, { duration: 300 });
    }, 150);
  };

  const goToPrevSlide = () => {
    if (!scrollViewRef.current) return;
    
    fadeAnim.value = withTiming(0.7, { duration: 300 });
    setTimeout(() => {
      const prevIndex = activeIndex === 0 ? animeList.length - 1 : activeIndex - 1;
      scrollViewRef.current.scrollTo({
        x: prevIndex * dimensions.width,
        animated: true
      });
      setActiveIndex(prevIndex);
      fadeAnim.value = withTiming(1, { duration: 300 });
    }, 150);
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / dimensions.width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      if (autoPlay && !isHovered) startAutoPlay();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  if (!animeList?.length) return null;

  // Web-specific props
  const webProps = Platform.select({
    web: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false)
    },
    default: {}
  });

  return (
    <View 
      style={[styles.container, { height: dimensions.height }]}
      {...webProps}
    >
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
          const isActive = index === activeIndex;
          const ratingValue = typeof anime.rating === 'number' 
            ? anime.rating 
            : typeof anime.rating === 'string' 
              ? parseFloat(anime.rating) || 0 
              : 0;
          
          const hasTrailer = anime.vdo && (anime.vdo.includes('youtube.com') || anime.vdo.includes('youtu.be'));
          const youtubeUrl = hasTrailer && anime.vdo 
            ? `${anime.vdo}${anime.vdo.includes('?') ? '&' : '?'}enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&fs=0&disablekb=1&iv_load_policy=3&playsinline=1&showinfo=0&origin=${window.location.origin}` 
            : '';

          return (
            <Animated.View 
              key={anime.id}
              style={[styles.slide, { width: dimensions.width }, animatedStyle]}
            >
              {hasTrailer && isActive && showVideo && Platform.OS === 'web' ? (
                <View style={[styles.videoContainer, StyleSheet.absoluteFill]}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    backgroundColor: 'black'
                  }}>
                    <iframe
                      key={`youtube-${anime.id}-${isMuted ? 'muted' : 'unmuted'}`}
                      src={youtubeUrl}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '56.25vw',
                        minHeight: '100%',
                        minWidth: '177.77vh',
                        transform: 'translate(-50%, -50%)',
                        border: 'none',
                        pointerEvents: 'none',
                        objectFit: 'cover'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen={false}
                      frameBorder="0"
                    />
                  </div>
                  <View style={styles.videoOverlay} />
                </View>
              ) : (
                <Image
                  source={{ uri: anime.bannerImage || anime.coverImage }}
                  style={[styles.image, StyleSheet.absoluteFill]}
                  contentFit="cover"
                  transition={500}
                />
              )}
              
              <LinearGradient
                colors={[
                  'transparent', 
                  'rgba(14, 15, 26, 0.1)', 
                  'rgba(14, 15, 26, 0.4)', 
                  'rgba(14, 15, 26, 0.8)', 
                  Colors.dark.background
                ]}
                locations={[0, 0.3, 0.6, 0.8, 1]}
                style={[styles.gradient, StyleSheet.absoluteFill]}
              />

              {/* Spotlight Number Badge */}
              <Animated.View 
                entering={FadeInUp.delay(200)}
                style={styles.spotlightBadge}
              >
                <Text style={styles.spotlightNumber}>#{index + 1}</Text>
                <Text style={styles.spotlightText}>Spotlight</Text>
              </Animated.View>
              
              <Animated.View 
                entering={FadeInUp.delay(400)}
                style={styles.content}
              >
                <View style={styles.genreContainer}>
                  {anime.genres.slice(0, 3).map((genre, idx) => (
                    <Animated.View 
                      key={idx} 
                      entering={FadeIn.delay(600 + idx * 100)}
                      style={styles.genreTag}
                    >
                      <Text style={styles.genreText}>{genre}</Text>
                    </Animated.View>
                  ))}
                  {anime.status === "Current" && (
                    <Animated.View 
                      entering={FadeIn.delay(900)}
                      style={styles.airingTag}
                    >
                      <View style={styles.liveDot} />
                      <Text style={styles.airingText}>AIRING</Text>
                    </Animated.View>
                  )}
                </View>

                <Animated.Text 
                  entering={FadeInUp.delay(500)}
                  style={styles.title} 
                  numberOfLines={2}
                >
                  {anime.title}
                </Animated.Text>

                <Animated.Text 
                  entering={FadeInUp.delay(600)}
                  style={[
                    styles.synopsis,
                    {
                      fontSize: dimensions.width > 1024 ? 18 : dimensions.width > 768 ? 16 : 14,
                      lineHeight: dimensions.width > 1024 ? 28 : dimensions.width > 768 ? 24 : 20,
                      maxWidth: dimensions.width > 768 ? '80%' : '100%',
                    }
                  ]}
                  numberOfLines={4}
                  ellipsizeMode="tail"
                >
                  {truncateSynopsis(anime.description || '')}
                </Animated.Text>

                <Animated.View 
                  entering={FadeInUp.delay(600)}
                  style={styles.metaContainer}
                >
                  <View style={styles.ratingContainer}>
                    <Star size={16} color={Colors.dark.accent} fill={Colors.dark.accent} />
                    <Text style={styles.rating}>{ratingValue.toFixed(1)}</Text>
                  </View>
                  {anime.episodes && (
                    <View style={styles.metaItem}>
                      <View style={styles.metaDot} />
                      <Text style={styles.episodes}>{anime.episodes} Episodes</Text>
                    </View>
                  )}
                  {anime.duration && (
                    <View style={styles.metaItem}>
                      <View style={styles.metaDot} />
                      <Text style={styles.duration}>{anime.duration}</Text>
                    </View>
                  )}
                  {anime.quality && (
                    <View style={styles.qualityTag}>
                      <Text style={styles.qualityText}>{anime.quality}</Text>
                    </View>
                  )}
                </Animated.View>

                <Animated.View 
                  entering={FadeInUp.delay(700)}
                  style={styles.buttonContainer}
                >
                  <Link href={`/player/${anime.id}/${anime.id}-episode-1`} asChild>
                    <Pressable style={styles.watchButton}>
                      <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.watchButtonText}>Watch Now</Text>
                    </Pressable>
                  </Link>
                  
                  <Link href={`/anime/${anime.id}`} asChild>
                    <Pressable style={styles.detailsButton}>
                      <Info size={18} color="#FFFFFF" />
                      <Text style={styles.detailsButtonText}>More Details</Text>
                    </Pressable>
                  </Link>
                  
                  {hasTrailer && Platform.OS === 'web' && (
                    <TouchableOpacity 
                      style={styles.muteButton} 
                      onPress={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX size={20} color={Colors.dark.text} />
                      ) : (
                        <Volume2 size={20} color={Colors.dark.text} />
                      )}
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </Animated.View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      
      {animeList.length > 1 && (
        <>
          <TouchableOpacity 
            style={styles.navButtonLeft} 
            onPress={goToPrevSlide}
          >
            <ChevronLeft size={28} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButtonRight} 
            onPress={goToNextSlide}
          >
            <ChevronRight size={28} color={Colors.dark.text} />
          </TouchableOpacity>

          <View style={styles.pagination}>
            {animeList.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
                onPress={() => {
                  scrollViewRef.current?.scrollTo({
                    x: index * dimensions.width,
                    animated: true
                  });
                  setActiveIndex(index);
                  if (autoPlay && !isHovered) startAutoPlay();
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
    borderRadius: Layout.borderRadius.md,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    position: 'relative',
    height: '100%',
  },
  videoContainer: {
    backgroundColor: Colors.dark.background,
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'auto',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    height: '100%',
  },
  spotlightBadge: {
    position: 'absolute',
    top: Layout.spacing.lg,
    left: Layout.spacing.md,
    zIndex: 10,
  },
  spotlightNumber: {
    color: Colors.dark.text,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 32,
    opacity: 0.7,
  },
  spotlightText: {
    color: Colors.dark.subtext,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  genreContainer: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.sm,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  genreTag: {
    backgroundColor: 'rgba(229, 231, 240, 0.1)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 6,
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 240, 0.2)',
  },
  genreText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  airingTag: {
    top: Layout.spacing.xxs,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 6,
    marginRight: Layout.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  airingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: Layout.spacing.sm,
    lineHeight: 42,
    opacity: 0.9,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  rating: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    textShadowColor: 'rgba(14, 15, 26, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.subtext,
    marginRight: Layout.spacing.xs,
  },
  episodes: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(14, 15, 26, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  duration: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(14, 15, 26, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  qualityTag: {
    backgroundColor: 'rgba(14, 15, 26, 0.6)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 240, 0.3)',
  },
  qualityText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  synopsis: {
    color: Colors.dark.text,
    marginBottom: Layout.spacing.lg,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  watchButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.sm,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  watchButtonText: {
    color: Colors.dark.text,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: Layout.spacing.xs,
  },
  detailsButton: {
    backgroundColor: 'rgba(41, 41, 47, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 240, 0.2)',
  },
  detailsButtonText: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: Layout.spacing.xs,
  },
  muteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 15, 26, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 240, 0.2)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: Layout.spacing.md,
    right: Layout.spacing.lg,
  },
  paginationDot: {
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(229, 231, 240, 0.4)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: Colors.dark.primary,
    width: 24,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonLeft: {
    position: 'absolute',
    top: '80%',
    right: Layout.spacing.md,
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(14, 15, 26, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 240, 0.2)',
    shadowColor: Colors.dark.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navButtonRight: {
    position: 'absolute',
    top: '60%',
    right: Layout.spacing.md,
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(14, 15, 26, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 240, 0.2)',
    shadowColor: Colors.dark.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});