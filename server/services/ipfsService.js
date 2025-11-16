const FormData = require('form-data');
const fetch = require('node-fetch');

/**
 * IPFS Service for decentralized storage
 * Uses IPFS HTTP API directly via fetch (more reliable than deprecated packages)
 * 
 * Supports:
 * - Direct IPFS HTTP API calls
 * - Infura IPFS
 * - Public IPFS gateways
 * - Automatic fallback to server endpoints
 */
class IPFSService {
  constructor() {
    this.gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    this.apiUrl = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0';
    this.projectId = process.env.IPFS_PROJECT_ID;
    this.projectSecret = process.env.IPFS_PROJECT_SECRET;
    this.available = false;
    
    // Test connection on initialization (non-blocking)
    this.initialize().catch(() => {
      // Silently fail - fallback mode is fine
    });
  }

  async initialize() {
    try {
      // Only enable if credentials are provided
      if (!this.projectId || !this.projectSecret) {
        console.log('ℹ️  IPFS credentials not configured - using fallback mode');
        console.log('ℹ️  To enable IPFS, set IPFS_PROJECT_ID and IPFS_PROJECT_SECRET in .env');
        this.available = false;
        return;
      }

      // Test if IPFS API is accessible
      const testResponse = await fetch(`${this.apiUrl}/version`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      if (testResponse.ok) {
        this.available = true;
        console.log('✅ IPFS Service initialized and connected');
      } else {
        console.warn('⚠️  IPFS API not accessible - using fallback mode');
        this.available = false;
      }
    } catch (error) {
      console.warn('⚠️  IPFS Service initialization failed:', error.message);
      console.warn('⚠️  Using server endpoints as fallback (this is fine for development)');
      this.available = false;
    }
  }

  /**
   * Get authentication headers for IPFS API
   */
  getAuthHeaders() {
    const headers = {};

    if (this.projectId && this.projectSecret) {
      const auth = Buffer.from(`${this.projectId}:${this.projectSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  /**
   * Upload JSON metadata to IPFS using HTTP API
   * @param {Object} metadata - Metadata object to upload
   * @returns {Promise<string>} IPFS CID
   */
  async uploadMetadata(metadata) {
    if (!this.available) {
      throw new Error('IPFS not available');
    }

    try {
      const jsonString = JSON.stringify(metadata);
      const formData = new FormData();
      formData.append('file', Buffer.from(jsonString), {
        filename: 'metadata.json',
        contentType: 'application/json',
      });

      const response = await fetch(`${this.apiUrl}/add`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IPFS upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const cid = result.Hash || result.cid || result;
      
      if (!cid) {
        throw new Error('No CID returned from IPFS');
      }

      console.log(`✅ Metadata uploaded to IPFS: ${cid}`);
      return cid;
    } catch (error) {
      console.error('❌ Error uploading metadata to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload file to IPFS using HTTP API
   * @param {Buffer|string} file - File data or path
   * @returns {Promise<string>} IPFS CID
   */
  async uploadFile(file) {
    if (!this.available) {
      throw new Error('IPFS not available');
    }

    try {
      const formData = new FormData();
      const fs = require('fs');
      
      if (Buffer.isBuffer(file)) {
        formData.append('file', file);
      } else if (typeof file === 'string') {
        // If it's a file path, read it
        const fileBuffer = fs.readFileSync(file);
        formData.append('file', fileBuffer);
      } else {
        formData.append('file', file);
      }

      const response = await fetch(`${this.apiUrl}/add`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IPFS upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const cid = result.Hash || result.cid || result;
      
      if (!cid) {
        throw new Error('No CID returned from IPFS');
      }

      console.log(`✅ File uploaded to IPFS: ${cid}`);
      return cid;
    } catch (error) {
      console.error('❌ Error uploading file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get IPFS URL from CID
   * @param {string} cid - IPFS CID
   * @returns {string} IPFS gateway URL
   */
  getIPFSUrl(cid) {
    if (!cid) return null;
    // Remove /ipfs/ prefix if present
    const cleanCid = cid.replace(/^\/ipfs\//, '').replace(/^ipfs:\/\//, '');
    return `${this.gateway}${cleanCid}`;
  }

  /**
   * Generate token URI for NFT metadata
   * @param {Object} pokemonData - Pokemon data
   * @returns {Promise<string>} IPFS URI or fallback server endpoint
   */
  async generateTokenURI(pokemonData) {
    // Try IPFS first if available
    if (this.available) {
      try {
        // Create ERC721 metadata standard
        const metadata = {
          name: pokemonData.name,
          description: `A ${pokemonData.type} type Pokemon in PokeWars`,
          image: pokemonData.sprite, // Can be IPFS URL or regular URL
          external_url: `${process.env.API_BASE_URL || 'http://localhost:4000'}/pokemon/${pokemonData._id}`,
          attributes: [
            {
              trait_type: "Type",
              value: pokemonData.type,
            },
            {
              trait_type: "Shoot Range",
              value: pokemonData.baseStats.shootRange,
            },
            {
              trait_type: "Shoots Per Minute",
              value: pokemonData.baseStats.shootPerMin,
            },
            {
              trait_type: "Hit Points",
              value: pokemonData.baseStats.hitPoints,
            },
            {
              trait_type: "Speed",
              value: pokemonData.baseStats.speed,
            },
          ],
        };

        // Upload to IPFS
        const cid = await this.uploadMetadata(metadata);
        return `ipfs://${cid}`;
      } catch (error) {
        console.warn('⚠️  IPFS upload failed, using fallback:', error.message);
      }
    }
    
    // Fallback to server endpoint
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/api/nft/metadata/${pokemonData._id}`;
  }

  /**
   * Check if IPFS is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.available;
  }
}

// Export singleton instance
const ipfsService = new IPFSService();
module.exports = ipfsService;
