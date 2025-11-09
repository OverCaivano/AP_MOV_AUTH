import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { getMovieDetails } from '../services/movieService';
import { IMAGE_BASE_URL } from '../config/api';

export default function MovieDetailScreen({ route }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const movieId = route.params?.movieId;

  useEffect(() => {
    loadMovieDetails();
  }, []);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      const details = await getMovieDetails(movieId);
      setMovie(details);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text>No se pudo cargar la información de la película</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {movie.backdrop_path && (
        <Image
          source={{ uri: `${IMAGE_BASE_URL}${movie.backdrop_path}` }}
          style={styles.backdrop}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{movie.title}</Text>
        <View style={styles.metadata}>
          <Text style={styles.date}>{movie.release_date}</Text>
          <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)}</Text>
        </View>
        
        {movie.tagline && (
          <Text style={styles.tagline}>{movie.tagline}</Text>
        )}

        <Text style={styles.sectionTitle}>Sinopsis</Text>
        <Text style={styles.overview}>{movie.overview}</Text>

        {movie.genres && movie.genres.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Géneros</Text>
            <View style={styles.genreContainer}>
              {movie.genres.map(genre => (
                <View key={genre.id} style={styles.genre}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duración</Text>
            <Text style={styles.statValue}>{movie.runtime} min</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Popularidad</Text>
            <Text style={styles.statValue}>{Math.round(movie.popularity)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Votos</Text>
            <Text style={styles.statValue}>{movie.vote_count}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  backdrop: {
    width: '100%',
    height: 200
  },
  content: {
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  date: {
    color: '#666'
  },
  rating: {
    color: '#f39c12',
    fontWeight: 'bold'
  },
  tagline: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8
  },
  overview: {
    lineHeight: 24,
    color: '#444'
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  genre: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  genreText: {
    color: '#666'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  stat: {
    alignItems: 'center'
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});