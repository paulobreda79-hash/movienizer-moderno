const Movie = require('../models/Movie');
const Person = require('../models/Person');
const Scraper = require('../models/Scraper');
const CacheService = require('./cacheService');

const scrapers = {
  imdb: require('../scrapers/imdbScraper'),
  tmdb: require('../scrapers/tmdbScraper'),
  justwatch: require('../scrapers/justwatchScraper'),
  adorocinema: require('../scrapers/adorocinemaScraper'),
  letterboxd: require('../scrapers/letterboxdScraper'),
  rottentomatoes: require('../scrapers/rottentomatoesScraper'),
  fanart: require('../scrapers/fanartScraper'),
  allmovie: require('../scrapers/allmovieScraper'),
  tvdb: require('../scrapers/tvdbScraper'),
  trakt: require('../scrapers/traktScraper'),
  tvtime: require('../scrapers/tvtimeScraper'),
  mubi: require('../scrapers/mubiScraper'),
  tvmaze: require('../scrapers/tvmazeScraper'),
  filmaffinity: require('../scrapers/filmaffinityScraper'),
  fandom: require('../scrapers/fandomScraper')
};

class ScraperService {
  static async updateMovieDetails(title) {
    const cacheKey = `movie-${title}`;
    let movieData = await CacheService.get(cacheKey);

    if (!movieData) {
      // Buscar em múltiplas fontes
      const sources = [
        'tmdb', 'imdb', 'adorocinema', 'rottentomatoes', 
        'letterboxd', 'allmovie', 'trakt', 'filmaffinity'
      ];
      
      const results = await Promise.allSettled(
        sources.map(async (source) => {
          try {
            return await scrapers[source].searchMovie(title);
          } catch (error) {
            console.log(`Erro ao buscar em ${source}:`, error.message);
            return null;
          }
        })
      );

      // Unificar resultados
      movieData = this.unifyMovieResults(results);
      
      if (movieData) {
        await CacheService.set(cacheKey, movieData, 24 * 60 * 60); // 24h
      }
    }

    if (movieData) {
      const existing = Movie.findByTitle(title);
      if (existing) {
        Movie.update(existing.id, movieData);
      } else {
        Movie.create(movieData);
      }
    }

    return movieData;
  }

  static async updatePersonDetails(name) {
    const cacheKey = `person-${name}`;
    let personData = await CacheService.get(cacheKey);

    if (!personData) {
      // Buscar em múltiplas fontes
      const sources = ['imdb', 'tmdb', 'adorocinema', 'trakt', 'tvmaze'];
      const results = await Promise.allSettled(
        sources.map(async (source) => {
          try {
            return await scrapers[source].searchPerson(name);
          } catch (error) {
            console.log(`Erro ao buscar pessoa em ${source}:`, error.message);
            return null;
          }
        })
      );

      // Unificar resultados
      personData = this.unifyPersonResults(results);
      
      if (personData) {
        await CacheService.set(cacheKey, personData, 24 * 60 * 60); // 24h
      }
    }

    if (personData) {
      const existing = Person.findByName(name);
      if (existing) {
        Person.update(existing.id, personData);
      } else {
        Person.create(personData);
      }
    }

    return personData;
  }

  static async updateAllMovies() {
    try {
      const movies = Movie.findAll();
      Scraper.updateStatus('all-movies', 'running');

      for (const movie of movies) {
        await this.updateMovieDetails(movie.title);
        // Delay para evitar bloqueios
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      Scraper.updateStatus('all-movies', 'completed');
    } catch (error) {
      Scraper.updateStatus('all-movies', 'error');
      console.error('Erro ao atualizar todos os filmes:', error);
    }
  }

  static async updateAllPeople() {
    try {
      const people = Person.findAll();
      Scraper.updateStatus('all-people', 'running');

      for (const person of people) {
        await this.updatePersonDetails(person.name);
        // Delay para evitar bloqueios
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      Scraper.updateStatus('all-people', 'completed');
    } catch (error) {
      Scraper.updateStatus('all-people', 'error');
      console.error('Erro ao atualizar todas as pessoas:', error);
    }
  }

  static async updateStreamingAvailability(title) {
    try {
      const results = await scrapers.justwatch.getStreamingAvailability(title);
      return results;
    } catch (error) {
      console.error('Erro ao buscar disponibilidade de streaming:', error);
      return null;
    }
  }

  static async updateFanart(title) {
    try {
      const results = await scrapers.fanart.getArtwork(title);
      return results;
    } catch (error) {
      console.error('Erro ao buscar fanart:', error);
      return null;
    }
  }

  static unifyMovieResults(results) {
    let unified = {};

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        // Unificar campos
        if (data.title) unified.title = data.title;
        if (data.year) unified.year = data.year;
        if (data.genres) unified.genres = [...new Set([...(unified.genres || []), ...data.genres])];
        if (data.rating_imdb) unified.rating_imdb = data.rating_imdb;
        if (data.rating_rottentomatoes) unified.rating_rottentomatoes = data.rating_rottentomatoes;
        if (data.rating_letterboxd) unified.rating_letterboxd = data.rating_letterboxd;
        if (data.rating_filmaffinity) unified.rating_filmaffinity = data.rating_filmaffinity;
        if (data.poster) unified.poster = data.poster;
        if (data.plot) unified.plot = data.plot;
        if (data.director) unified.director = [...new Set([...(unified.director || []), ...data.director])];
        if (data.cast) unified.cast = [...new Set([...(unified.cast || []), ...data.cast])];
      }
    });

    return unified;
  }

  static unifyPersonResults(results) {
    let unified = {};

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        // Unificar campos
        if (data.name) unified.name = data.name;
        if (data.full_name) unified.full_name = data.full_name;
        if (data.birth_date) unified.birth_date = data.birth_date;
        if (data.role) unified.role = [...new Set([...(unified.role || []), ...data.role])];
        if (data.biography) unified.biography = data.biography;
        if (data.image) unified.image = data.image;
        if (data.movies) unified.movies = [...new Set([...(unified.movies || []), ...data.movies])];
      }
    });

    return unified;
  }
}

module.exports = ScraperService;