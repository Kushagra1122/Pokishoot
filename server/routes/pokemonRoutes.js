const express = require('express')
const router = express.Router()
const pokemonController = require('../controllers/pokemonController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', pokemonController.getAll)
router.post('/initiate-purchase', authMiddleware, pokemonController.initiatePurchase)
router.post('/claim', authMiddleware, pokemonController.claim)
router.post('/list-for-sale', authMiddleware, pokemonController.listForSale)
router.get('/listings', authMiddleware.optionalAuth, pokemonController.getListings)
router.post('/buy-from-listing', authMiddleware, pokemonController.buyFromListing)
router.post('/initiate-upgrade', authMiddleware, pokemonController.initiateUpgrade)
router.post('/upgrade-level', authMiddleware, pokemonController.upgradePokemonLevel)
router.get('/my-listings', authMiddleware, pokemonController.getMyListings)
router.post('/cancel-listing', authMiddleware, pokemonController.cancelListing)

// NFT metadata endpoint (ERC721 tokenURI standard)
router.get('/nft/metadata/:pokemonId', pokemonController.getNFTMetadata)

module.exports = router
