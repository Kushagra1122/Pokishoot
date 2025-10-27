exports.create = (req, res) => {
  console.log('📝 Creating new lobby request:', req.body);

  const { creatorId, creatorName, selectedPokemonDetails } = req.body;
  if (!creatorId || !creatorName) {
    console.log('❌ Missing creatorId or creatorName');
    return res.status(400).json({ message: 'Creator ID and name required' });
  }

  try {
    const lobbyManager = req.app.get('lobbyManager');
    const code = lobbyManager.createLobby(creatorId, creatorName, selectedPokemonDetails);
    
    console.log(`✅ Lobby created successfully: ${code}`);
    res.json({ code });
  } catch (error) {
    console.log('❌ Error creating lobby:', error);
    res.status(500).json({ message: 'Failed to create lobby' });
  }
};

exports.validate = (req, res) => {
  const code = req.params.code.toUpperCase();
  console.log(`🔍 Validating lobby: ${code}`);

  try {
    const lobbyManager = req.app.get('lobbyManager');
    const lobby = lobbyManager.validateLobby(code);

    if (!lobby) {
      console.log(`❌ Lobby ${code} not found`);
      return res.status(404).json({ message: 'Lobby not found' });
    }

    console.log(`✅ Lobby ${code} validated, players: ${lobby.players.length}`);
    res.json({
      code: lobby.code,
      players: lobby.players,
      ownerId: lobby.ownerId,
      settings: lobby.gameSettings
    });
  } catch (error) {
    console.log('❌ Error validating lobby:', error);
    res.status(500).json({ message: 'Error validating lobby' });
  }
};

exports.getLobby = (req, res) => {
  const code = req.params.code.toUpperCase();
  console.log(`🔍 Getting lobby: ${code}`);

  try {
    const lobbyManager = req.app.get('lobbyManager');
    const lobby = lobbyManager.getLobby(code);

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    res.json(lobby);
  } catch (error) {
    console.log('❌ Error getting lobby:', error);
    res.status(500).json({ message: 'Error getting lobby' });
  }
};

exports.deleteLobby = (req, res) => {
  const code = req.params.code.toUpperCase();
  console.log(`🗑️ Deleting lobby: ${code}`);

  try {
    const lobbyManager = req.app.get('lobbyManager');
    const deleted = lobbyManager.deleteLobby(code);

    if (!deleted) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    res.json({ message: 'Lobby deleted successfully' });
  } catch (error) {
    console.log('❌ Error deleting lobby:', error);
    res.status(500).json({ message: 'Error deleting lobby' });
  }
};