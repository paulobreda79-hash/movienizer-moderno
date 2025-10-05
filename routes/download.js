const express = require('express');
const router = express.Router();
const MovieService = require('../services/movieService');
const PersonService = require('../services/personService');

// POST /api/download/movie
router.post('/movie', async (req, res) => {
  try {
    const { title } = req.body;
    const movie = await MovieService.downloadMovieDetails(title);
    res.json({ success: true, movie });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/download/person
router.post('/person', async (req, res) => {
  try {
    const { name } = req.body;
    const person = await PersonService.downloadPersonDetails(name);
    res.json({ success: true, person });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;