const Pokemon = require('../models/Pokemon')
const User = require('../models/User')
const Listing = require('../models/Listing')
const nftService = require('../services/nftService')

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

// POST /api/pokemon/claim
// body: { pokemonId }
// protected route
exports.claim = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const pokemon = await Pokemon.findById(pokemonId)
    if (!pokemon) return res.status(404).json({ message: 'Pokemon not found' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // If user already has this pokemon, return conflict
    const already = user.pokemon.find(p => String(p.pokemonId) === String(pokemon._id))
    if (already) return res.status(409).json({ message: 'User already has this Pokémon' })

    // Check if user has wallet connected for NFT minting
    let nftTokenId = null;
    let nftTxHash = null;

    if (user.walletAddress && nftService.isReady()) {
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

        nftTokenId = nftResult.tokenId;
        nftTxHash = nftResult.txHash;

        console.log(`✅ NFT minted for ${pokemon.name}: Token ID ${nftTokenId}`);
      } catch (nftError) {
        console.error('⚠️  NFT minting failed (continuing with off-chain):', nftError.message);
        // Continue without NFT - user still gets the Pokemon
      }
    } else {
      console.log('ℹ️  NFT minting skipped - wallet not connected or NFT service not ready');
    }

    // Add pokemon to user's collection (with or without NFT)
    user.pokemon.push({
      pokemonId: pokemon._id,
      level: 1,
      nftTokenId: nftTokenId,
      nftTxHash: nftTxHash,
    })
    await user.save()

    // return populated user object
    const populated = await User.findById(user._id).populate('pokemon.pokemonId')
    res.json({
      user: populated,
      nftTokenId: nftTokenId,
      nftTxHash: nftTxHash,
      nftMinted: !!nftTokenId,
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
    if (!pokemonId || !price) return res.status(400).json({ message: 'pokemonId and price required' })

    if (price <= 0) return res.status(400).json({ message: 'Price must be greater than 0' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Find the pokemon in user's collection
    const userPokemon = user.pokemon.find(p => String(p.pokemonId) === String(pokemonId))
    if (!userPokemon) return res.status(404).json({ message: 'Pokemon not found in your collection' })

    // Create a listing
    const listing = new Listing({
      sellerId: userId,
      pokemon: {
        pokemonId: userPokemon.pokemonId,
        level: userPokemon.level,
      },
      price,
      status: 'active'
    })

    await listing.save()

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
      .populate('sellerId', 'name')
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
    const { listingId } = req.body

    if (!buyerId) return res.status(401).json({ message: 'Unauthorized' })
    if (!listingId) return res.status(400).json({ message: 'listingId required' })

    const listing = await Listing.findById(listingId)
      .populate('sellerId')
      .populate('pokemon.pokemonId')

    if (!listing) return res.status(404).json({ message: 'Listing not found' })
    if (listing.status !== 'active') return res.status(400).json({ message: 'Listing is no longer active' })

    const buyer = await User.findById(buyerId)
    if (!buyer) return res.status(404).json({ message: 'Buyer not found' })

    // Check if buyer already has this pokemon
    const alreadyHas = buyer.pokemon.find(p => String(p.pokemonId) === String(listing.pokemon.pokemonId))
    if (alreadyHas) return res.status(409).json({ message: 'You already own this Pokémon' })

    // Check buyer balance
    if (buyer.balance < listing.price) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Perform transaction
    buyer.balance -= listing.price
    const seller = listing.sellerId
    seller.balance += listing.price

    // Add pokemon to buyer's collection
    buyer.pokemon.push({
      pokemonId: listing.pokemon.pokemonId,
      level: listing.pokemon.level,
    })

    // Update listing status
    listing.status = 'sold'
    listing.soldTo = buyerId

    // Remove pokemon from seller's collection
    seller.pokemon = seller.pokemon.filter(p => String(p.pokemonId) !== String(listing.pokemon.pokemonId))

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

// POST /api/pokemon/upgrade-level
// body: { pokemonId }
// protected route - upgrade pokemon level
exports.upgradePokemonLevel = async (req, res) => {
  try {
    const userId = req.user?.id
    const { pokemonId } = req.body

    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    if (!pokemonId) return res.status(400).json({ message: 'pokemonId required' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const userPokemon = user.pokemon.find(p => String(p.pokemonId) === String(pokemonId))
    if (!userPokemon) return res.status(404).json({ message: 'Pokemon not found in your collection' })

    // Calculate upgrade cost (0.1 ETH per level)
    const upgradeCost = 0.1
    if (user.balance < upgradeCost) {
      return res.status(400).json({ message: 'Insufficient balance for upgrade' })
    }

    // Check max level (cap at 50)
    if (userPokemon.level >= 50) {
      return res.status(400).json({ message: 'Pokemon is already at max level' })
    }

    // Perform upgrade
    user.balance -= upgradeCost
    userPokemon.level += 1
    user.experience += 10

    await user.save()

    // Return updated user
    const updatedUser = await User.findById(userId).populate('pokemon.pokemonId')
    res.json({ user: updatedUser, message: 'Level upgraded successfully!' })
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

    // Add pokemon back to user's collection
    user.pokemon.push({
      pokemonId: listing.pokemon.pokemonId,
      level: listing.pokemon.level,
    })

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
