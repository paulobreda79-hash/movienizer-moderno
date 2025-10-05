const Movie = require('../models/Movie');
const { scrapeIMDbMovie } = require('../scrapers/imdbScraper');

class MovieService {
  static async getAllMovies() {
    return Movie.findAll();
  }

  static async getMovieById(id) {
    return Movie.findById(id);
  }

  static async createMovie(movieData) {
    // Se não tiver poster, tentar buscar via scraper
    if (!movieData.poster) {
      try {
        const scraped = await scrapeIMDbMovie(movieData.title);
        movieData.poster = scraped.poster || movieData.poster;
      } catch (e) {
        console.log('Erro ao buscar poster:', e.message);
      }
    }

    return Movie.create(movieData);
  }

  static async updateMovie(id, movieData) {
    return Movie.update(id, movieData);
  }

  static async deleteMovie(id) {
    return Movie.delete(id);
  }

  static async searchMovies(filters) {
    return Movie.search(filters);
  }

  static async toggleWatched(id) {
    return Movie.toggleWatched(id);
  }

  static async toggleFavorite(id) {
    return Movie.toggleFavorite(id);
  }

  static async downloadMovieDetails(title) {
    try {
      const scraped = await scrapeIMDbMovie(title);
      const movieData = {
        title: scraped.title,
        year: scraped.year,
        genres: scraped.genres,
        director: scraped.director,
        cast: scraped.cast,
        rating_imdb: scraped.rating,
        plot: scraped.plot,
        poster: scraped.poster,
        links: {
          imdb: scraped.url
        }
      };

      return this.createMovie(movieData);
    } catch (error) {
      console.error('Erro ao baixar detalhes do filme:', error);
      throw error;
    }
  }
}

module.exports = MovieService;