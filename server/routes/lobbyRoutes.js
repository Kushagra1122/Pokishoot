const express = require('express')
const router = express.Router()
const lobbyController = require('../controllers/lobbyController')

// Create a lobby
router.post('/lobby', lobbyController.create)

// Validate/join a lobby
router.get('/lobby/:code', lobbyController.validate)

// Get lobby details
router.get('/lobby/:code/details', lobbyController.getLobby)

// Delete a lobby
router.delete('/lobby/:code', lobbyController.deleteLobby)

module.exports = router