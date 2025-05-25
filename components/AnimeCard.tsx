import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { LocalAnime } from '@/types/anime';

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface AnimeCardProps {
  anime: LocalAnime;
  size?: 'small' | 'medium' | 'large';
  showRating?: boolean;
}

export default function AnimeCard({ anime, size = 'medium', showRating = true }: AnimeCardProps) {
  const cardStyles = {
    small: {
      width: 120,
      height: 180,
      borderRadius: Layout.borderRadius.sm,
    },
    medium: {
      width: 160,
      height: 240,
      borderRadius: Layout.borderRadius.md,
    },
    large: {
      width: 200,
      height: 300,
      borderRadius: Layout.borderRadius.lg,
    },
  };

  const titleStyles = {
    small: {
      fontSize: 12,
    },
    medium: {
      fontSize: 14,
    },
    large: {
      fontSize: 16,
    },
  };

  // Ensure rating is a number and has a valid value
  const ratingValue = typeof anime.rating === 'number' 
    ? anime.rating 
    : typeof anime.rating === 'string' 
      ? parseFloat(anime.rating) || 0 
      : 0;

  // Use a wrapper component to avoid transform styles on Link/a tags
  const CardWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={[styles.card, cardStyles[size]]}>
      {children}
    </View>
  );

  return (
    <Link href={`/anime/${anime.id}`} asChild>
      <Pressable style={styles.container}>
        <CardWrapper>
          <Image
            source={{ uri: anime.coverImage }}
            style={[styles.image, cardStyles[size]]}
            contentFit="cover"
            transition={300}
            placeholder={blurhash}
            cachePolicy="memory-disk"
            recyclingKey={anime.id}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={[styles.gradient, cardStyles[size]]}
          />
          <View style={styles.content}>
            <Text style={[styles.title, titleStyles[size]]} numberOfLines={2}>
              {anime.title}
            </Text>
            {showRating && (
              <View style={styles.ratingContainer}>
                <Star size={12} color={Colors.dark.accent} fill={Colors.dark.accent} />
                <Text style={styles.rating}>{ratingValue.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </CardWrapper>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: Layout.spacing.xs,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  card: {
    backgroundColor: Colors.dark.card,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  image: {
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.sm,
  },
  title: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  rating: {
    color: Colors.dark.text,
    fontSize: 12,
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
});