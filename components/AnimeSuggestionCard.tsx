import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Star, Clock, Tv, PlayCircle } from 'lucide-react-native';
import { Anime } from '@/types/anime';
import { useRouter } from 'expo-router';

interface AnimeSuggestionCardProps {
  anime: Anime;
  onPress?: () => void;
}

export const AnimeSuggestionCard: React.FC<AnimeSuggestionCardProps> = ({ anime, onPress }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/anime/${anime.aid}`);
    }
  };

  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating / 2);
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i < fullStars ? '#FFD700' : 'transparent'} 
          color={i < fullStars ? '#FFD700' : '#666'}
          style={styles.starIcon}
        />
      );
    }
    
    return (
      <View style={styles.ratingContainer}>
        {stars}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <Pressable 
      style={styles.container}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
    >
      <Image 
        source={{ uri: anime.poster || 'https://via.placeholder.com/80x120' }} 
        style={styles.poster}
        resizeMode="cover"
      />
      
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {anime.name}
        </Text>
        
        {anime.jname && (
          <Text style={styles.japaneseTitle} numberOfLines={1}>
            {anime.jname}
          </Text>
        )}
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Tv size={12} color="#888" style={styles.metaIcon} />
            <Text style={styles.metaText}>{anime.type || 'TV'}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <PlayCircle size={12} color="#888" style={styles.metaIcon} />
            <Text style={styles.metaText}>
              {anime.total_episodes || 0} {anime.total_episodes === 1 ? 'episode' : 'episodes'}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Clock size={12} color="#888" style={styles.metaIcon} />
            <Text style={styles.metaText}>{anime.status || 'Unknown'}</Text>
          </View>
        </View>
        
        {renderRating(anime.imdb_rating || 0)}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  japaneseTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    color: '#aaa',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
});
