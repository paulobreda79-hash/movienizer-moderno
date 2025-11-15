const axios = require('axios');
const cheerio = require('cheerio');

class IMDBScraper {
  static async searchMovie(title) {
    try {
      const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(title)}&s=tt`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const firstResult = $('td.result_text a').first().attr('href');

      if (firstResult) {
        const movieUrl = `https://www.imdb.com${firstResult}`;
        return await this.getMovieDetails(movieUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar filme no IMDB:', error.message);
      return null;
    }
  }

  static async getMovieDetails(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrair dados
      const title = $('h1').first().text().trim();
      const year = $('.sc-8c31wf-0').text().match(/\d{4}/)?.[0] || null;
      const rating = $('.sc-bde20123-3').text().trim() || null;
      const genres = [];
      $('.ipc-chip-list__scroller a').each((i, el) => {
        genres.push($(el).text().trim());
      });

      const director = [];
      $('.sc-54924a2e-10 a').each((i, el) => {
        director.push($(el).text().trim());
      });

      const cast = [];
      $('.title-cast-item a').each((i, el) => {
        cast.push($(el).text().trim());
      });

      const plot = $('.sc-15baf78a-0').text().trim() || null;

      return {
        title,
        year: parseInt(year),
        rating_imdb: parseFloat(rating),
        genres,
        director,
        cast,
        plot,
        poster: null // IMDB não fornece poster via scraping
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do filme no IMDB:', error.message);
      return null;
    }
  }

  static async searchPerson(name) {
    try {
      const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(name)}&s=nm`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const firstResult = $('td.result_text a').first().attr('href');

      if (firstResult) {
        const personUrl = `https://www.imdb.com${firstResult}`;
        return await this.getPersonDetails(personUrl);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar pessoa no IMDB:', error.message);
      return null;
    }
  }

  static async getPersonDetails(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const $ = cheerio.load(response.data);

      const name = $('h1').first().text().trim();
      const birthDate = $('.sc-8c31wf-0').text().match(/\d{4}/)?.[0] || null;
      const biography = $('.sc-15baf78a-0').text().trim() || null;

      const knownFor = [];
      $('.knownfor-title a').each((i, el) => {
        knownFor.push($(el).text().trim());
      });

      // Extract awards from IMDB
      const awards = await this.getPersonAwards(url);

      return {
        name,
        full_name: name,
        birth_date: birthDate,
        role: ['Ator'], // Padrão, pode ser melhorado
        biography,
        movies: knownFor,
        awards
      };
    } catch (error) {
      console.error('Erro ao obter detalhes da pessoa no IMDB:', error.message);
      return null;
    }
  }

  static async getPersonAwards(personUrl) {
    try {
      // Extract person ID from URL
      const personIdMatch = personUrl.match(/\/name\/(nm\d+)/);
      if (!personIdMatch) return [];

      const personId = personIdMatch[1];
      const awardsUrl = `https://www.imdb.com/name/${personId}/awards`;
      
      const response = await axios.get(awardsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const awards = [];
      let wonCount = 0;
      let nominatedCount = 0;

      // Parse awards table
      $('.awards-table').each((i, table) => {
        const awardName = $(table).find('.award-title').first().text().trim();
        
        $(table).find('.award-row').each((j, row) => {
          const year = $(row).find('.award-year').text().trim();
          const category = $(row).find('.award-category').text().trim();
          const movie = $(row).find('.award-title-link').text().trim();
          const outcome = $(row).find('.award-outcome').text().trim();
          
          const isWinner = outcome.toLowerCase().includes('won') || 
                          outcome.toLowerCase().includes('ganhou') ||
                          $(row).hasClass('winner');
          
          if (isWinner) {
            wonCount++;
          } else {
            nominatedCount++;
          }

          awards.push({
            award: awardName || 'Unknown Award',
            year: year || 'Unknown',
            category: category || 'Unknown Category',
            movie: movie || '',
            outcome: isWinner ? 'Ganhou' : 'Nomeado'
          });
        });
      });

      // Alternative parsing if the above doesn't work
      if (awards.length === 0) {
        $('table').each((i, table) => {
          $(table).find('tr').each((j, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const year = $(cells[0]).text().trim();
              const description = $(cells[1]).text().trim();
              
              // Check if it's a win or nomination
              const isWinner = description.toLowerCase().includes('won') || 
                              description.toLowerCase().includes('winner') ||
                              $(row).hasClass('award_win');
              
              if (year && description) {
                if (isWinner) wonCount++;
                else nominatedCount++;

                awards.push({
                  award: 'Award',
                  year,
                  category: description.split('\n')[0] || description,
                  movie: '',
                  outcome: isWinner ? 'Ganhou' : 'Nomeado'
                });
              }
            }
          });
        });
      }

      return {
        awards,
        summary: {
          won: wonCount,
          nominated: nominatedCount
        }
      };
    } catch (error) {
      console.error('Erro ao obter prémios da pessoa no IMDB:', error.message);
      return {
        awards: [],
        summary: { won: 0, nominated: 0 }
      };
    }
  }
}

module.exports = IMDBScraper;