const express = require('express')
const router = express.Router()
const lobbyController = require('../controllers/lobbyController')

// Create a lobby
router.post('/', lobbyController.create)

// Validate/join a lobby
router.get('/:code', lobbyController.validate)

// Get lobby details
router.get('/:code/details', lobbyController.getLobby)

// Delete a lobby
router.delete('/:code', lobbyController.deleteLobby)

module.exports = router