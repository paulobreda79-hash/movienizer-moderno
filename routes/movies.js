const express = require('express');
const router = express.Router();
const MovieService = require('../services/movieService');

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    const movies = await MovieService.getAllMovies();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movie = await MovieService.getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Filme não encontrado' });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/movies
router.post('/', async (req, res) => {
  try {
    const movie = await MovieService.createMovie(req.body);
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/movies/:id
router.put('/:id', async (req, res) => {
  try {
    await MovieService.updateMovie(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/movies/:id
router.delete('/:id', async (req, res) => {
  try {
    await MovieService.deleteMovie(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/movies/:id/watched
router.patch('/:id/watched', async (req, res) => {
  try {
    await MovieService.toggleWatched(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/movies/:id/favorite
router.patch('/:id/favorite', async (req, res) => {
  try {
    await MovieService.toggleFavorite(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/movies/search
router.get('/search', async (req, res) => {
  try {
    const filters = req.query;
    const movies = await MovieService.searchMovies(filters);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;