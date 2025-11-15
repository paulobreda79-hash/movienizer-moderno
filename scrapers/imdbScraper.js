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
      if (!personIdMatch) {
        return {
          awards: [],
          summary: { won: 0, nominated: 0 }
        };
      }

      const personId = personIdMatch[1];
      const awardsUrl = `https://www.imdb.com/name/${personId}/awards`;
      
      const response = await axios.get(awardsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      
      const $ = cheerio.load(response.data);
      const awards = [];
      let wonCount = 0;
      let nominatedCount = 0;

      // Modern IMDB uses table structures with specific patterns
      // Look for all tables on the awards page
      $('table').each((i, table) => {
        const $table = $(table);
        
        // Get the award name from the heading before the table
        let awardName = $table.prev('h3').text().trim() || 
                        $table.prev('h2').text().trim() || 
                        $table.prevAll('h3').first().text().trim() ||
                        $table.prevAll('h2').first().text().trim() ||
                        'Award';
        
        // Clean up award name
        awardName = awardName.split('\n')[0].trim();
        
        // Process each row in the table
        $table.find('tr').each((j, row) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          if (cells.length >= 2) {
            // First cell usually has the year or outcome
            const firstCellText = $(cells[0]).text().trim();
            const secondCellText = $(cells[1]).text().trim();
            
            // Check if this is a winner row
            const rowClass = $row.attr('class') || '';
            const isWinner = rowClass.includes('award_win') || 
                            rowClass.includes('winner') ||
                            secondCellText.toLowerCase().includes('won') ||
                            secondCellText.toLowerCase().includes('winner') ||
                            $row.find('.award_win').length > 0;
            
            // Extract year (4 digits)
            const yearMatch = firstCellText.match(/\b(19|20)\d{2}\b/) || 
                            secondCellText.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? yearMatch[0] : '';
            
            // Extract category and movie info
            let category = secondCellText;
            let movie = '';
            
            // Try to extract movie name (usually in quotes or after "For")
            const movieMatch = secondCellText.match(/["']([^"']+)["']/) ||
                              secondCellText.match(/For\s+(.+?)(?:\n|$)/i);
            if (movieMatch) {
              movie = movieMatch[1].trim();
            }
            
            // Clean up category
            category = category.split('\n')[0].trim();
            if (category.length > 100) {
              category = category.substring(0, 100) + '...';
            }
            
            // Only add if we have meaningful data
            if (year && category && category.length > 3) {
              if (isWinner) {
                wonCount++;
              } else {
                nominatedCount++;
              }

              awards.push({
                award: awardName,
                year,
                category,
                movie,
                outcome: isWinner ? 'Ganhou' : 'Nomeado'
              });
            }
          }
        });
      });

      // If we didn't find awards in tables, try to extract from page text
      if (awards.length === 0) {
        const pageText = $('body').text();
        
        // Try to find wins and nominations count in page text
        const winsMatch = pageText.match(/(\d+)\s+wins?/i);
        const nomsMatch = pageText.match(/(\d+)\s+nominations?/i);
        
        if (winsMatch) wonCount = parseInt(winsMatch[1]);
        if (nomsMatch) nominatedCount = parseInt(nomsMatch[1]);
        
        console.log(`Extracted from text: ${wonCount} wins, ${nominatedCount} nominations`);
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