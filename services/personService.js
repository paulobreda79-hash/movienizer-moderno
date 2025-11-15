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

  static async updatePersonAwards(id, name) {
    try {
      const IMDBScraper = require('../scrapers/imdbScraper');
      const axios = require('axios');
      const cheerio = require('cheerio');
      
      console.log(`Searching IMDB for: ${name}`);
      
      // Search for person on IMDB
      const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(name)}&s=nm`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple selectors for IMDB search results (their structure changes)
      let firstResult = $('td.result_text a').first().attr('href') ||
                        $('.ipc-metadata-list-summary-item__t').first().attr('href') ||
                        $('a[href*="/name/nm"]').first().attr('href');

      if (!firstResult) {
        console.error('No search results found on IMDB');
        throw new Error('Pessoa não encontrada no IMDB');
      }

      // Ensure we have a full URL
      const personUrl = firstResult.startsWith('http') ? firstResult : `https://www.imdb.com${firstResult}`;
      console.log(`Found person URL: ${personUrl}`);
      
      // Get awards
      console.log('Fetching awards...');
      const awardsData = await IMDBScraper.getPersonAwards(personUrl);
      
      console.log(`Awards fetched: ${awardsData.summary.won} wins, ${awardsData.summary.nominated} nominations, ${awardsData.awards.length} detailed awards`);
      
      // Update person with awards
      const person = await this.getPersonById(id);
      person.awards = awardsData;
      
      await Person.update(id, person);
      
      console.log('Awards updated in database');
      
      return awardsData;
    } catch (error) {
      console.error('Erro ao atualizar prémios da pessoa:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
}

module.exports = PersonService;