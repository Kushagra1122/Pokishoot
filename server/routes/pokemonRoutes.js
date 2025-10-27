const express = require('express')
const router = express.Router()
const pokemonController = require('../controllers/pokemonController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/pokemon', pokemonController.getAll)
router.post('/pokemon/claim', authMiddleware, pokemonController.claim)
router.post('/pokemon/list-for-sale', authMiddleware, pokemonController.listForSale)
router.get('/pokemon/listings', authMiddleware.optionalAuth, pokemonController.getListings)
router.post('/pokemon/buy-from-listing', authMiddleware, pokemonController.buyFromListing)
router.post('/pokemon/upgrade-level', authMiddleware, pokemonController.upgradePokemonLevel)
router.get('/pokemon/my-listings', authMiddleware, pokemonController.getMyListings)
router.post('/pokemon/cancel-listing', authMiddleware, pokemonController.cancelListing)

module.exports = router
