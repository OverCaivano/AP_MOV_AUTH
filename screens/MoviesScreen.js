import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { getPopularMovies, searchMovies } from '../services/movieService';
import { IMAGE_BASE_URL } from '../config/api';
import { removeCurrentUserFromStorage } from '../database';

export default function MoviesScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMovies = async (pageNum = 1, search = searchQuery) => {
    if (loading || (pageNum > 1 && !hasMore)) return;
    
    try {
      setLoading(true);
      const data = search.trim()
        ? await searchMovies(search, pageNum)
        : await getPopularMovies(pageNum);
      
      const newMovies = data.results || [];
      if (pageNum === 1) {
        setMovies(newMovies);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }
      
      setHasMore(data.page < data.total_pages);
      setPage(data.page);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMovies(1);
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadMovies(1, searchQuery);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadMovies(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMovies(page + 1);
    }
  };

  const logout = async () => {
    await removeCurrentUserFromStorage();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderMovie = ({ item }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
    >
      <Image
        source={{ uri: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/150' }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.date}>{item.release_date}</Text>
        <Text style={styles.overview} numberOfLines={3}>{item.overview}</Text>
        <View style={styles.rating}>
          <Text style={styles.ratingText}>⭐ {item.vote_average.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar películas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loading && <ActivityIndicator style={styles.loader} />}
        ListEmptyComponent={() => (
          !loading && (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron películas' : 'No hay películas disponibles'}
            </Text>
          )
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8
  },
  logoutButton: {
    padding: 8
  },
  logoutText: {
    color: '#e74c3c'
  },
  list: {
    padding: 16
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  poster: {
    width: 100,
    height: 150,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8
  },
  movieInfo: {
    flex: 1,
    padding: 12
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  overview: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 14,
    color: '#f39c12'
  },
  loader: {
    padding: 16
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#666'
  }
});
