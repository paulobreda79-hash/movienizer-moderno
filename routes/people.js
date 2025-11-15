const express = require('express');
const router = express.Router();
const PersonService = require('../services/personService');

// GET /api/people
router.get('/', async (req, res) => {
  try {
    const people = await PersonService.getAllPeople();
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/people/:id
router.get('/:id', async (req, res) => {
  try {
    const person = await PersonService.getPersonById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/people
router.post('/', async (req, res) => {
  try {
    const person = await PersonService.createPerson(req.body);
    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/people/:id
router.put('/:id', async (req, res) => {
  try {
    await PersonService.updatePerson(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/people/:id
router.delete('/:id', async (req, res) => {
  try {
    await PersonService.deletePerson(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/people/:id/watched
router.patch('/:id/watched', async (req, res) => {
  try {
    await PersonService.toggleWatched(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/people/:id/favorite
router.patch('/:id/favorite', async (req, res) => {
  try {
    await PersonService.toggleFavorite(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/people/:id/followed
router.patch('/:id/followed', async (req, res) => {
  try {
    await PersonService.toggleFollowed(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/people/search
router.get('/search', async (req, res) => {
  try {
    const filters = req.query;
    const people = await PersonService.searchPeople(filters);
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/people/:id/update-awards
router.post('/:id/update-awards', async (req, res) => {
  try {
    const person = await PersonService.getPersonById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    
    const updatedAwards = await PersonService.updatePersonAwards(req.params.id, person.name);
    res.json({ success: true, awards: updatedAwards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;