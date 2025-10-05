const express = require('express');
const router = express.Router();
const ScraperService = require('../services/scraperService');

// POST /api/scrape/movie
router.post('/movie', async (req, res) => {
  try {
    const { title } = req.body;
    const movie = await ScraperService.updateMovieDetails(title);
    res.json({ success: true, movie });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scrape/person
router.post('/person', async (req, res) => {
  try {
    const { name } = req.body;
    const person = await ScraperService.updatePersonDetails(name);
    res.json({ success: true, person });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scrape/update-all/movies
router.post('/update-all/movies', async (req, res) => {
  try {
    await ScraperService.updateAllMovies();
    res.json({ success: true, message: 'Atualização de filmes iniciada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scrape/update-all/people
router.post('/update-all/people', async (req, res) => {
  try {
    await ScraperService.updateAllPeople();
    res.json({ success: true, message: 'Atualização de pessoas iniciada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scrape/streaming
router.post('/streaming', async (req, res) => {
  try {
    const { title } = req.body;
    const availability = await ScraperService.updateStreamingAvailability(title);
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scrape/fanart
router.post('/fanart', async (req, res) => {
  try {
    const { title } = req.body;
    const artwork = await ScraperService.updateFanart(title);
    res.json({ success: true, artwork });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;