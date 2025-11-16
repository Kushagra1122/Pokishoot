const Pokemon = require('../models/Pokemon')
const User = require('../models/User')
const Listing = require('../models/Listing')
const nftService = require('../services/nftService')

/**
 * Calculate Pokemon stats based on base stats and level
 * Formula: finalStat = baseStat * (1 + (level - 1) * 0.02)
 * This gives 2% increase per level (level 1 = 100%, level 50 = 198%)
 * 
 * @param {Object} baseStats - Base stats object with shootRange, shootPerMin, hitPoints, speed
 * @param {Number} level - Pokemon level (1-50)
 * @returns {Object} Calculated stats object
 */
function calculateStatsFromLevel(baseStats, level) {
  if (!baseStats || level < 1) {
    throw new Error('Invalid baseStats or level')
  }
  const multiplier = 1 + (level - 1) * 0.02
  return {
    shootRange: Math.round(baseStats.shootRange * multiplier),
    shootPerMin: Math.round(baseStats.shootPerMin * multiplier),
    hitPoints: Math.round(baseStats.hitPoints * multiplier),
    speed: Math.round(baseStats.speed * multiplier),
  }
}

/**
 * Ensure Pokemon has stats initialized (for backward compatibility)
 * If stats are missing or null, calculate them from base stats and level
 */
async function ensurePokemonStats(userPokemon, pokemonBase) {
  if (!userPokemon.stats || 
      !userPokemon.stats.shootRange || 
      !userPokemon.stats.shootPerMin || 
      !userPokemon.stats.hitPoints || 
      !userPokemon.stats.speed) {
    // Stats missing, calculate them
    userPokemon.stats = calculateStatsFromLevel(pokemonBase.baseStats, userPokemon.level || 1)
    return true // Indicates stats were updated
  }
  return false
}

// GET /api/pokemon
exports.getAll = async (req, res) => {
  try {
    const pokemon = await Pokemon.find({})
    res.json({ pokemon })
  } catch (err) {
    console.error('getAll pokemon error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/initiate-purchase
// body: { pokemonId }
// protected route - get payment details for purchasing a pokemon
exports.initiatePurchase = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const pokemon = await Pokemon.findById(pokemonId)
    if (!pokemon) return res.status(404).json({ message: 'Pokemon not found' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Check if user already has this pokemon
    const already = user.pokemon.find(p => String(p.pokemonId) === String(pokemon._id))
    if (already) return res.status(409).json({ message: 'User already has this Pokémon' })

    // Get payment address from NFT service (server's wallet address)
    const paymentAddress = nftService.isReady() ? nftService.signer?.address : null
    if (!paymentAddress) {
      return res.status(503).json({ message: 'Payment service not available' })
    }

    // Get price (default 0.5 GLMR or from pokemon data)
    const paymentAmount = pokemon.price || 0.5

    res.json({
      paymentAddress,
      paymentAmount,
      pokemonId: pokemon._id
    })
  } catch (err) {
    console.error('initiate purchase error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/claim
// body: { pokemonId, paymentTxHash (optional), paymentAmount (optional), nftTokenId (optional), nftTxHash (optional) }
// protected route
exports.claim = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId, paymentTxHash, paymentAmount, nftTokenId, nftTxHash } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const pokemon = await Pokemon.findById(pokemonId)
    if (!pokemon) return res.status(404).json({ message: 'Pokemon not found' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // If user already has this pokemon, return conflict
    const already = user.pokemon.find(p => String(p.pokemonId) === String(pokemon._id))
    if (already) return res.status(409).json({ message: 'User already has this Pokémon' })

    // If paymentTxHash is provided, verify the payment transaction
    if (paymentTxHash && paymentAmount) {
      try {
        const { ethers } = require('ethers')
        const provider = nftService.provider
        if (provider) {
          const receipt = await provider.getTransactionReceipt(paymentTxHash)
          if (!receipt || receipt.status !== 1) {
            return res.status(400).json({ message: 'Payment transaction not found or failed' })
          }

          // Verify payment amount and recipient
          const tx = await provider.getTransaction(paymentTxHash)
          const expectedAmount = ethers.parseEther(paymentAmount.toString())
          const paymentAddress = nftService.signer?.address

          if (tx.to?.toLowerCase() !== paymentAddress?.toLowerCase()) {
            return res.status(400).json({ message: 'Invalid payment recipient' })
          }

          if (tx.value.toString() !== expectedAmount.toString()) {
            return res.status(400).json({ message: 'Payment amount mismatch' })
          }

          console.log(`✅ Payment verified: ${paymentAmount} GLMR from ${tx.from} to ${tx.to}`)
        }
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError)
        return res.status(400).json({ message: 'Failed to verify payment transaction' })
      }
    }

    // Mint NFT on blockchain (server-side as contract owner)
    let finalNftTokenId = nftTokenId || null;
    let finalNftTxHash = nftTxHash || null;

    if (!finalNftTokenId && !finalNftTxHash && user.walletAddress && nftService.isReady()) {
      try {
        // Mint NFT on blockchain
        const nftResult = await nftService.mintPokemon(
          user.walletAddress,
          {
            _id: pokemon._id,
            name: pokemon.name,
            type: pokemon.type,
            baseStats: pokemon.baseStats,
            sprite: pokemon.sprite,
          }
        );

        finalNftTokenId = nftResult.tokenId;
        finalNftTxHash = nftResult.txHash;

        console.log(`✅ NFT minted for ${pokemon.name}: Token ID ${finalNftTokenId}`);
      } catch (nftError) {
        console.error('⚠️  NFT minting failed (continuing with off-chain):', nftError.message);
        // Continue without NFT - user still gets the Pokemon
      }
    } else if (finalNftTokenId && finalNftTxHash) {
      console.log(`✅ Using provided NFT for ${pokemon.name}: Token ID ${finalNftTokenId}, TX: ${finalNftTxHash}`);
    } else {
      console.log('ℹ️  NFT minting skipped - wallet not connected or NFT service not ready');
    }

    // Calculate initial stats for level 1
    const initialStats = calculateStatsFromLevel(pokemon.baseStats, 1)

    // Add pokemon to user's collection (with or without NFT)
    user.pokemon.push({
      pokemonId: pokemon._id,
      level: 1,
      stats: initialStats,
      nftTokenId: finalNftTokenId,
      nftTxHash: finalNftTxHash,
    })
    await user.save()

    // return populated user object
    const populated = await User.findById(user._id).populate('pokemon.pokemonId')
    res.json({
      user: populated,
      nftTokenId: finalNftTokenId,
      nftTxHash: finalNftTxHash,
      nftMinted: !!finalNftTokenId,
    })
  } catch (err) {
    console.error('claim pokemon error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/list-for-sale
// body: { pokemonId, price }
// protected route - create a marketplace listing
exports.listForSale = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId, price } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId || price === undefined || price === null) return res.status(400).json({ message: 'pokemonId and price required' })

    const normalizedPrice = Number(price)
    if (Number.isNaN(normalizedPrice)) return res.status(400).json({ message: 'Invalid price' })
    if (normalizedPrice <= 0) return res.status(400).json({ message: 'Price must be greater than 0' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (!user.walletAddress) {
      return res.status(400).json({ message: 'Connect your wallet before listing Pokémon for sale' })
    }

    // Find the pokemon in user's collection
    const userPokemon = user.pokemon.find(p => String(p.pokemonId) === String(pokemonId))
    if (!userPokemon) return res.status(404).json({ message: 'Pokemon not found in your collection' })

    // Check if this pokemon is already listed
    const existingListing = await Listing.findOne({
      sellerId: userId,
      'pokemon.pokemonId': pokemonId,
      status: 'active'
    })
    if (existingListing) {
      return res.status(400).json({ message: 'This Pokémon is already listed for sale' })
    }

    // Create a listing
    const listing = new Listing({
      sellerId: userId,
      pokemon: {
        pokemonId: userPokemon.pokemonId,
        level: userPokemon.level,
      },
      price: normalizedPrice,
      status: 'active'
    })

    await listing.save()

    // Remove the pokemon from user's active collection while listed
    user.pokemon = user.pokemon.filter(p => String(p._id) !== String(userPokemon._id))
    user.markModified('pokemon')
    await user.save()

    // Populate listing with pokemon details
    const populatedListing = await Listing.findById(listing._id)
      .populate('sellerId', 'name')
      .populate('pokemon.pokemonId')

    res.json({ listing: populatedListing })
  } catch (err) {
    console.error('list for sale error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/pokemon/listings
// Get all active marketplace listings (excluding own listings if logged in)
exports.getListings = async (req, res) => {
  try {
    const userId = req.user?.id
    
    // If no user (guest), show all listings
    // If user is logged in, filter out their own listings
    const filter = userId 
      ? { status: 'active', sellerId: { $ne: userId } }
      : { status: 'active' }
    
    const listings = await Listing.find(filter)
      .populate('sellerId', 'name walletAddress')
      .populate('pokemon.pokemonId')
      .sort({ createdAt: -1 })

    res.json({ listings })
  } catch (err) {
    console.error('get listings error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/buy-from-listing
// body: { listingId }
// protected route - buy a listed pokemon
exports.buyFromListing = async (req, res) => {
  try {
    const buyerId = req.user?.id
    const { listingId, paymentTxHash, paymentAmount } = req.body

    if (!buyerId) return res.status(401).json({ message: 'Unauthorized' })
    if (!listingId) return res.status(400).json({ message: 'listingId required' })

    const listing = await Listing.findById(listingId)
      .populate('sellerId', 'name walletAddress')
      .populate('pokemon.pokemonId')

    if (!listing) return res.status(404).json({ message: 'Listing not found' })
    if (listing.status !== 'active') return res.status(400).json({ message: 'Listing is no longer active' })

    const listingPrice = Number(listing.price)
    if (Number.isNaN(listingPrice) || listingPrice <= 0) {
      return res.status(400).json({ message: 'Listing has an invalid price' })
    }

    const buyer = await User.findById(buyerId)
    if (!buyer) return res.status(404).json({ message: 'Buyer not found' })

    if (String(listing.sellerId?._id || listing.sellerId) === String(buyerId)) {
      return res.status(400).json({ message: 'Cannot buy your own listing' })
    }

    // Check if buyer already has this pokemon (by pokemonId, not by specific instance)
    const alreadyHas = buyer.pokemon.find(p => String(p.pokemonId) === String(listing.pokemon.pokemonId._id || listing.pokemon.pokemonId))
    if (alreadyHas) return res.status(409).json({ message: 'You already own this Pokémon' })

    const sellerWallet = listing.sellerId?.walletAddress
    if (!sellerWallet) {
      return res.status(400).json({ message: 'Seller wallet not available' })
    }

    const normalizedPaymentAmount = Number(paymentAmount)
    if (Number.isNaN(normalizedPaymentAmount) || normalizedPaymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' })
    }

    if (Math.abs(normalizedPaymentAmount - listingPrice) > 0.0000001) {
      return res.status(400).json({ message: 'Payment amount does not match listing price' })
    }

    if (!paymentTxHash) {
      return res.status(400).json({ message: 'Payment transaction hash required' })
    }

    const provider = nftService.provider
    if (!provider) {
      return res.status(503).json({ message: 'Payment verification service unavailable' })
    }

    try {
      const { ethers } = require('ethers')
      const receipt = await provider.getTransactionReceipt(paymentTxHash)
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ message: 'Payment transaction not found or failed' })
      }

      const tx = await provider.getTransaction(paymentTxHash)
      if (!tx) {
        return res.status(400).json({ message: 'Unable to locate payment transaction' })
      }

      const expectedAmount = ethers.parseEther(listingPrice.toString())

      if (tx.to?.toLowerCase() !== sellerWallet.toLowerCase()) {
        return res.status(400).json({ message: 'Payment recipient mismatch' })
      }

      if (tx.value.toString() !== expectedAmount.toString()) {
        return res.status(400).json({ message: 'Payment amount mismatch' })
      }

      listing.transactionHash = paymentTxHash
      listing.blockNumber = receipt.blockNumber ?? null
    } catch (paymentError) {
      console.error('Listing payment verification error:', paymentError)
      return res.status(400).json({ message: 'Failed to verify payment transaction' })
    }

    // Note: Actual payment happens on-chain (verified above)
    // Off-chain balance is used for in-game utilities and accounting
    // Update off-chain balances to reflect the transaction
    buyer.balance = Number((buyer.balance - listingPrice).toFixed(4))
    
    // Fetch the full seller object to ensure we have all properties including pokemon array
    const sellerId = listing.sellerId?._id || listing.sellerId
    const seller = await User.findById(sellerId)
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' })
    }
    
    seller.balance = Number((Number(seller.balance || 0) + listingPrice).toFixed(4))

    // Calculate stats for the transferred Pokemon based on its level
    const pokemonBase = listing.pokemon.pokemonId
    const transferredStats = calculateStatsFromLevel(pokemonBase.baseStats, listing.pokemon.level)

    // Add pokemon to buyer's collection with preserved level and calculated stats
    buyer.pokemon.push({
      pokemonId: listing.pokemon.pokemonId,
      level: listing.pokemon.level,
      stats: transferredStats,
    })

    // Update listing status
    listing.status = 'sold'
    listing.soldTo = buyerId

    // Ensure pokemon removed from seller's collection if still present (should already be removed when listed, but safety check)
    const initialSellerPokemonCount = seller.pokemon ? seller.pokemon.length : 0
    const pokemonIdToRemove = listing.pokemon.pokemonId._id || listing.pokemon.pokemonId
    if (seller.pokemon && Array.isArray(seller.pokemon)) {
      seller.pokemon = seller.pokemon.filter(p => String(p.pokemonId) !== String(pokemonIdToRemove))
      if (seller.pokemon.length !== initialSellerPokemonCount) {
        seller.markModified('pokemon')
      }
    }

    // Save all changes
    await buyer.save()
    await seller.save()
    await listing.save()

    // Return updated buyer info
    const updatedBuyer = await User.findById(buyerId).populate('pokemon.pokemonId')
    res.json({ user: updatedBuyer, listing: listing._id, message: 'Purchase successful!' })
  } catch (err) {
    console.error('buy from listing error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/initiate-upgrade
// body: { pokemonId }
// protected route - get payment details for upgrading a pokemon
exports.initiateUpgrade = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const userPokemon = user.pokemon.find(p => String(p.pokemonId) === String(pokemonId))
    if (!userPokemon) return res.status(404).json({ message: 'Pokemon not found in your collection' })

    // Check max level (cap at 50)
    if (userPokemon.level >= 50) {
      return res.status(400).json({ message: 'Pokemon is already at max level' })
    }

    // Get payment address from NFT service (server's wallet address)
    const paymentAddress = nftService.isReady() ? nftService.signer?.address : null
    if (!paymentAddress) {
      return res.status(503).json({ message: 'Payment service not available' })
    }

    // Calculate upgrade cost (0.1 GLMR per level)
    const upgradeCost = 0.1

    res.json({
      paymentAddress,
      paymentAmount: upgradeCost,
      pokemonId: pokemonId,
      currentLevel: userPokemon.level,
      newLevel: userPokemon.level + 1
    })
  } catch (err) {
    console.error('initiate upgrade error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/pokemon/upgrade-level
// body: { pokemonId, paymentTxHash, paymentAmount }
// protected route - upgrade pokemon level with on-chain payment verification
exports.upgradePokemonLevel = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId, paymentTxHash, paymentAmount } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const userPokemon = user.pokemon.find(p => String(p.pokemonId) === String(pokemonId))
    if (!userPokemon) return res.status(404).json({ message: 'Pokemon not found in your collection' })

    // Check max level (cap at 50)
    if (userPokemon.level >= 50) {
      return res.status(400).json({ message: 'Pokemon is already at max level' })
    }

    // Calculate upgrade cost (0.1 GLMR per level)
    const upgradeCost = 0.1
    const normalizedPaymentAmount = Number(paymentAmount)
    
    if (Number.isNaN(normalizedPaymentAmount) || normalizedPaymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' })
    }

    if (Math.abs(normalizedPaymentAmount - upgradeCost) > 0.0000001) {
      return res.status(400).json({ message: 'Payment amount does not match upgrade cost' })
    }

    if (!paymentTxHash) {
      return res.status(400).json({ message: 'Payment transaction hash required' })
    }

    // Verify payment transaction on-chain
    const provider = nftService.provider
    if (!provider) {
      return res.status(503).json({ message: 'Payment verification service unavailable' })
    }

    try {
      const { ethers } = require('ethers')
      const receipt = await provider.getTransactionReceipt(paymentTxHash)
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ message: 'Payment transaction not found or failed' })
      }

      const tx = await provider.getTransaction(paymentTxHash)
      if (!tx) {
        return res.status(400).json({ message: 'Unable to locate payment transaction' })
      }

      const expectedAmount = ethers.parseEther(upgradeCost.toString())
      const paymentAddress = nftService.signer?.address

      if (tx.to?.toLowerCase() !== paymentAddress?.toLowerCase()) {
        return res.status(400).json({ message: 'Payment recipient mismatch' })
      }

      if (tx.value.toString() !== expectedAmount.toString()) {
        return res.status(400).json({ message: 'Payment amount mismatch' })
      }

      console.log(`✅ Upgrade payment verified: ${upgradeCost} GLMR from ${tx.from} to ${tx.to}`)
    } catch (paymentError) {
      console.error('Upgrade payment verification error:', paymentError)
      return res.status(400).json({ message: 'Failed to verify payment transaction' })
    }

    // Get base stats from Pokemon model
    const pokemonBase = await Pokemon.findById(pokemonId)
    if (!pokemonBase) {
      return res.status(404).json({ message: 'Base Pokemon data not found' })
    }

    // Store old stats for response
    const oldLevel = userPokemon.level
    const oldStats = calculateStatsFromLevel(pokemonBase.baseStats, oldLevel)

    // Perform upgrade
    const newLevel = userPokemon.level + 1
    userPokemon.level = newLevel
    
    // Recalculate stats based on new level
    const newStats = calculateStatsFromLevel(pokemonBase.baseStats, newLevel)
    userPokemon.stats = newStats
    
    user.experience += 10

    await user.save()

    // Return updated user with stat information
    const updatedUser = await User.findById(userId).populate('pokemon.pokemonId')
    res.json({ 
      user: updatedUser, 
      message: `Level upgraded successfully! Stats increased.`,
      statIncrease: {
        oldLevel: oldLevel,
        newLevel: newLevel,
        oldStats: oldStats,
        newStats: newStats
      }
    })
  } catch (err) {
    console.error('upgrade level error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/pokemon/my-listings
// protected route - get user's active listings
exports.getMyListings = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const listings = await Listing.find({ sellerId: userId, status: 'active' })
      .populate('pokemon.pokemonId')
      .sort({ createdAt: -1 })

    res.json({ listings })
  } catch (err) {
    console.error('get my listings error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/nft/metadata/:pokemonId
// Get NFT metadata for a Pokemon (ERC721 tokenURI standard)
exports.getNFTMetadata = async (req, res) => {
  try {
    const { pokemonId } = req.params;

    const pokemon = await Pokemon.findById(pokemonId);
    if (!pokemon) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }

    // ERC721 Metadata JSON standard
    const metadata = {
      name: pokemon.name,
      description: `A ${pokemon.type} type Pokemon in PokeWars`,
      image: pokemon.sprite,
      external_url: `${process.env.API_BASE_URL || 'http://localhost:4000'}/pokemon/${pokemon._id}`,
      attributes: [
        {
          trait_type: "Type",
          value: pokemon.type,
        },
        {
          trait_type: "Shoot Range",
          value: pokemon.baseStats.shootRange,
        },
        {
          trait_type: "Shoots Per Minute",
          value: pokemon.baseStats.shootPerMin,
        },
        {
          trait_type: "Hit Points",
          value: pokemon.baseStats.hitPoints,
        },
        {
          trait_type: "Speed",
          value: pokemon.baseStats.speed,
        },
      ],
    };

    res.json(metadata);
  } catch (err) {
    console.error('get NFT metadata error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/pokemon/cancel-listing
// body: { listingId }
// protected route - cancel a listing
exports.cancelListing = async (req, res) => {
  try {
    const userId = req.user?.id
    const { listingId } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!listingId) return res.status(400).json({ message: 'listingId required' })

    const listing = await Listing.findById(listingId)
    if (!listing) return res.status(404).json({ message: 'Listing not found' })
    if (String(listing.sellerId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this listing' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Check if pokemon is already in collection (shouldn't be, but safety check)
    const alreadyHas = user.pokemon.find(p => String(p.pokemonId) === String(listing.pokemon.pokemonId))
    if (!alreadyHas) {
      // Get base stats to recalculate
      const pokemonBase = await Pokemon.findById(listing.pokemon.pokemonId)
      if (!pokemonBase) {
        return res.status(404).json({ message: 'Base Pokemon data not found' })
      }
      
      // Recalculate stats based on the Pokemon's level
      const restoredStats = calculateStatsFromLevel(pokemonBase.baseStats, listing.pokemon.level)
      
      // Add pokemon back to user's collection with preserved level and recalculated stats
      user.pokemon.push({
        pokemonId: listing.pokemon.pokemonId,
        level: listing.pokemon.level,
        stats: restoredStats,
      })
      user.markModified('pokemon')
    }

    // Update listing status
    listing.status = 'cancelled'

    await user.save()
    await listing.save()

    res.json({ message: 'Listing cancelled' })
  } catch (err) {
    console.error('cancel listing error', err)
    res.status(500).json({ message: 'Server error' })
  }
}
