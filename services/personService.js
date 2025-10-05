const Person = require('../models/Person');
const { scrapeIMDbPerson } = require('../scrapers/imdbScraper');

class PersonService {
  static async getAllPeople() {
    return Person.findAll();
  }

  static async getPersonById(id) {
    return Person.findById(id);
  }

  static async createPerson(personData) {
    // Se não tiver imagem, tentar buscar via scraper
    if (!personData.image) {
      try {
        const scraped = await scrapeIMDbPerson(personData.name);
        personData.image = scraped.image || personData.image;
      } catch (e) {
        console.log('Erro ao buscar imagem:', e.message);
      }
    }

    return Person.create(personData);
  }

  static async updatePerson(id, personData) {
    return Person.update(id, personData);
  }

  static async deletePerson(id) {
    return Person.delete(id);
  }

  static async searchPeople(filters) {
    return Person.search(filters);
  }

  static async toggleWatched(id) {
    return Person.toggleWatched(id);
  }

  static async toggleFavorite(id) {
    return Person.toggleFavorite(id);
  }

  static async toggleFollowed(id) {
    return Person.toggleFollowed(id);
  }

  static async downloadPersonDetails(name) {
    try {
      const scraped = await scrapeIMDbPerson(name);
      const personData = {
        name: scraped.name,
        full_name: scraped.fullName,
        birth_date: scraped.birthDate,
        role: scraped.role,
        biography: scraped.biography,
        image: scraped.image,
        links: {
          imdb: scraped.url
        },
        movies: scraped.movies
      };

      return this.createPerson(personData);
    } catch (error) {
      console.error('Erro ao baixar detalhes da pessoa:', error);
      throw error;
    }
  }
}

module.exports = PersonService;