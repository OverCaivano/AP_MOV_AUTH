import { API_KEY, BASE_URL } from '../config/api';

export const getPopularMovies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=${page}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.status_message || 'Error al obtener películas');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

export const searchMovies = async (query, page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=${page}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.status_message || 'Error en la búsqueda');
    }
    
    return data;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

export const getMovieDetails = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=es-ES`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.status_message || 'Error al obtener detalles de la película');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};