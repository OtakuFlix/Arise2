import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, ScrollView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Match the actual AnimeCard dimensions
const CARD_WIDTH = 160;
const CARD_HEIGHT = 240;

// Match the SpotlightCarousel dimensions
const SPOTLIGHT_HEIGHT = Math.max(350, Math.min(450, SCREEN_HEIGHT * 0.45));

// Calculate items per row based on screen width
const ITEMS_PER_ROW = Math.floor((SCREEN_WIDTH - (Layout.spacing.md * 2)) / (CARD_WIDTH + Layout.spacing.md));
const HORIZONTAL_PADDING = (SCREEN_WIDTH - (CARD_WIDTH * ITEMS_PER_ROW + Layout.spacing.md * (ITEMS_PER_ROW - 1))) / 2;

export default function HomeSkeleton() {
  // Animation value
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset to the left
      animatedValue.setValue(0);
      // Animate to the right
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          startAnimation(); // Restart the animation when it completes
        }
      });
    };

    startAnimation();
    
    return () => {
      animatedValue.stopAnimation();
    };
  }, [animatedValue]);

  // Skeleton item component
  const SkeletonItem = ({ width, height, style = {}, radius = 4 }: { 
    width: number | string; 
    height: number | string; 
    style?: any;
    radius?: number;
  }) => {
    // Use screen width for the animation to ensure full width coverage
    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
      <View style={[styles.skeletonItem, { width, height, borderRadius: radius, overflow: 'hidden' }, style]}>
        <View style={styles.skeletonItemInner}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.3, 0.7, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
    );
  };

  // Skeleton section header
  const SectionHeader = () => (
    <View style={styles.sectionHeader}>
      <SkeletonItem width={150} height={24} radius={4} />
      <SkeletonItem width={70} height={20} radius={4} />
    </View>
  );

  // Skeleton anime card
  const AnimeCard = () => (
    <View style={styles.animeCard}>
      <SkeletonItem width="100%" height={CARD_HEIGHT} radius={8} />
      <SkeletonItem width="80%" height={16} radius={4} style={{ marginTop: 8 }} />
      <SkeletonItem width="60%" height={14} radius={4} style={{ marginTop: 4 }} />
    </View>
  );

  // Skeleton spotlight card
  const SpotlightCard = () => (
    <View style={styles.spotlightCard}>
      <SkeletonItem width="100%" height="100%" radius={0} />
      <View style={styles.spotlightOverlay}>
        <View style={styles.spotlightContent}>
          <View style={styles.spotlightTextContainer}>
            <SkeletonItem width="70%" height={28} radius={4} />
            <SkeletonItem width="50%" height={20} radius={4} style={{ marginTop: 8 }} />
            <View style={styles.spotlightMeta}>
              <SkeletonItem width={60} height={20} radius={4} />
              <SkeletonItem width={60} height={20} radius={4} style={{ marginLeft: 8 }} />
              <SkeletonItem width={60} height={20} radius={4} style={{ marginLeft: 8 }} />
            </View>
            <View style={{ marginTop: 12, width: '100%' }}>
              <SkeletonItem width="100%" height={16} radius={4} />
              <SkeletonItem width="80%" height={16} radius={4} style={{ marginTop: 8 }} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Skeleton top 10 card
  const Top10Card = ({ index }: { index: number }) => (
    <View style={styles.top10Card}>
      <SkeletonItem 
        width={24} 
        height={24} 
        radius={4} 
        style={styles.top10Badge} 
      />
      <SkeletonItem width="100%" height={CARD_HEIGHT} radius={8} />
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Spotlight Section */}
      <View style={styles.spotlightContainer}>
        <SpotlightCard />
      </View>

      {/* New On Arise */}
      <View style={styles.section}>
        <SectionHeader />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {[...Array(7)].map((_, i) => (
            <AnimeCard key={`new-${i}`} />
          ))}
        </ScrollView>
      </View>

      {/* Continue Watching */}
      <View style={styles.section}>
        <SectionHeader />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {[...Array(7)].map((_, i) => (
            <AnimeCard key={`continue-${i}`} />
          ))}
        </ScrollView>
      </View>

      {/* Currently Airing */}
      <View style={styles.section}>
        <SectionHeader />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {[...Array(7)].map((_, i) => (
            <AnimeCard key={`airing-${i}`} />
          ))}
        </ScrollView>
      </View>

      {/* Top 10 Section */}
      <View style={styles.section}>
        <SectionHeader />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.horizontalScroll, styles.top10Container]}
        >
          {[...Array(10)].map((_, i) => (
            <Top10Card key={`top10-${i}`} index={i} />
          ))}
        </ScrollView>
      </View>

      {/* Most Popular */}
      <View style={styles.section}>
        <SectionHeader />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {[...Array(7)].map((_, i) => (
            <AnimeCard key={`popular-${i}`} />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  horizontalScroll: {
    paddingLeft: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  skeletonItem: {
    backgroundColor: Colors.dark.card,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 4,
  },
  skeletonItemInner: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    overflow: 'hidden',
    position: 'relative',
  },
  animeCard: {
    width: CARD_WIDTH,
    marginRight: Layout.spacing.md,
  },
  spotlightContainer: {
    height: SPOTLIGHT_HEIGHT,
    marginBottom: Layout.spacing.xl,
  },
  spotlightCard: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  spotlightContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  spotlightTextContainer: {
    maxWidth: '70%',
  },
  spotlightMeta: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  top10Container: {
    paddingRight: 0,
  },
  top10Card: {
    width: CARD_WIDTH * 1.2,
    marginRight: Layout.spacing.md,
    position: 'relative',
  },
  top10Badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: Colors.dark.primary,
  },
});