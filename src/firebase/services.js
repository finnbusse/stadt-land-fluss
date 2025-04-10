// src/firebase/services.js
import { db } from './config';
import { ref, set, get, update, remove, onValue, push, serverTimestamp } from 'firebase/database';

// Generate a random 6-character lobby code
const generateLobbyCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create a new lobby
export const createLobby = async (playerName) => {
  try {
    // Generate a unique lobby code
    let lobbyCode = generateLobbyCode();
    let lobbyExists = true;
    
    // Keep generating until we find an unused code
    while (lobbyExists) {
      const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
      const snapshot = await get(lobbyRef);
      
      if (!snapshot.exists()) {
        lobbyExists = false;
      } else {
        lobbyCode = generateLobbyCode();
      }
    }
    
    // Create the lobby with initial data
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    await set(lobbyRef, {
      code: lobbyCode,
      host: playerName,
      createdAt: serverTimestamp(),
      players: {
        [playerName]: {
          name: playerName,
          isHost: true,
          joinedAt: serverTimestamp()
        }
      },
      categories: ['Stadt', 'Land', 'Fluss', 'Name', 'Tier', 'Beruf'],
      status: 'waiting',
      usedLetters: [],
      roundHistory: []
    });
    
    return lobbyCode;
  } catch (error) {
    console.error('Error creating lobby:', error);
    throw error;
  }
};

// Join an existing lobby
export const joinLobby = async (lobbyCode, playerName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if player name is already taken
    if (lobbyData.players && lobbyData.players[playerName]) {
      throw new Error('Spielername bereits vergeben');
    }
    
    // Check if lobby is full (max 6 players)
    if (lobbyData.players && Object.keys(lobbyData.players).length >= 6) {
      throw new Error('Lobby ist voll');
    }
    
    // Add player to lobby
    const playerRef = ref(db, `lobbies/${lobbyCode}/players/${playerName}`);
    await set(playerRef, {
      name: playerName,
      isHost: false,
      joinedAt: serverTimestamp()
    });
    
    return lobbyCode;
  } catch (error) {
    console.error('Error joining lobby:', error);
    throw error;
  }
};

// Leave a lobby
export const leaveLobby = async (lobbyCode, playerName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if player is in the lobby
    if (!lobbyData.players || !lobbyData.players[playerName]) {
      throw new Error('Spieler nicht in der Lobby');
    }
    
    // If player is host, assign host to another player or delete lobby if empty
    if (lobbyData.host === playerName) {
      const players = Object.keys(lobbyData.players);
      
      if (players.length === 1) {
        // Last player, delete the lobby
        await remove(lobbyRef);
        return;
      } else {
        // Assign host to another player
        const newHost = players.find(player => player !== playerName);
        
        if (newHost) {
          await update(lobbyRef, { host: newHost });
          await update(ref(db, `lobbies/${lobbyCode}/players/${newHost}`), { isHost: true });
        }
      }
    }
    
    // Remove player from lobby
    await remove(ref(db, `lobbies/${lobbyCode}/players/${playerName}`));
    
    // Also remove player's answers if they exist
    await remove(ref(db, `lobbies/${lobbyCode}/answers/${playerName}`));
  } catch (error) {
    console.error('Error leaving lobby:', error);
    throw error;
  }
};

// Kick a player from the lobby (host only)
export const kickPlayer = async (lobbyCode, playerName, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann Spieler entfernen');
    }
    
    // Check if player is in the lobby
    if (!lobbyData.players || !lobbyData.players[playerName]) {
      throw new Error('Spieler nicht in der Lobby');
    }
    
    // Remove player from lobby
    await remove(ref(db, `lobbies/${lobbyCode}/players/${playerName}`));
    
    // Also remove player's answers if they exist
    await remove(ref(db, `lobbies/${lobbyCode}/answers/${playerName}`));
  } catch (error) {
    console.error('Error kicking player:', error);
    throw error;
  }
};

// Update categories (host only)
export const updateCategories = async (lobbyCode, categories, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann Kategorien ändern');
    }
    
    // Update categories
    await update(lobbyRef, { categories });
  } catch (error) {
    console.error('Error updating categories:', error);
    throw error;
  }
};

// Start the game (host only)
export const startGame = async (lobbyCode, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann das Spiel starten');
    }
    
    // Generate a random letter that hasn't been used yet
    const usedLetters = lobbyData.usedLetters || [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const availableLetters = alphabet.split('').filter(letter => !usedLetters.includes(letter));
    
    if (availableLetters.length === 0) {
      throw new Error('Alle Buchstaben wurden bereits verwendet');
    }
    
    const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    
    // Update game state
    await update(lobbyRef, {
      status: 'playing',
      currentLetter: randomLetter,
      currentRound: (lobbyData.currentRound || 0) + 1,
      roundStartTime: serverTimestamp(),
      usedLetters: [...usedLetters, randomLetter],
      answers: null // Clear previous answers
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

// Set a custom letter for the game (host only)
export const setCustomLetter = async (lobbyCode, letter, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann den Buchstaben festlegen');
    }
    
    // Check if letter is valid
    if (!/^[A-Z]$/.test(letter)) {
      throw new Error('Ungültiger Buchstabe');
    }
    
    // Check if letter has already been used
    const usedLetters = lobbyData.usedLetters || [];
    if (usedLetters.includes(letter)) {
      throw new Error('Dieser Buchstabe wurde bereits verwendet');
    }
    
    // Update game state
    await update(lobbyRef, {
      status: 'playing',
      currentLetter: letter,
      currentRound: (lobbyData.currentRound || 0) + 1,
      roundStartTime: serverTimestamp(),
      usedLetters: [...usedLetters, letter],
      answers: null // Clear previous answers
    });
  } catch (error) {
    console.error('Error setting custom letter:', error);
    throw error;
  }
};

// Submit answers for the current round
export const submitAnswers = async (lobbyCode, playerName, answers) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if game is in playing state
    if (lobbyData.status !== 'playing') {
      throw new Error('Das Spiel läuft nicht');
    }
    
    // Check if player is in the lobby
    if (!lobbyData.players || !lobbyData.players[playerName]) {
      throw new Error('Spieler nicht in der Lobby');
    }
    
    // Submit answers
    const answersRef = ref(db, `lobbies/${lobbyCode}/answers/${playerName}`);
    await set(answersRef, {
      ...answers,
      submittedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    throw error;
  }
};

// Pause the game
export const pauseGame = async (lobbyCode, playerName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if game is in playing state
    if (lobbyData.status !== 'playing') {
      throw new Error('Das Spiel läuft nicht');
    }
    
    // Check if player is in the lobby
    if (!lobbyData.players || !lobbyData.players[playerName]) {
      throw new Error('Spieler nicht in der Lobby');
    }
    
    // Pause the game
    await update(lobbyRef, {
      status: 'paused',
      pausedBy: playerName,
      pausedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error pausing game:', error);
    throw error;
  }
};

// Resume the game (host only)
export const resumeGame = async (lobbyCode, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann das Spiel fortsetzen');
    }
    
    // Check if game is in paused state
    if (lobbyData.status !== 'paused') {
      throw new Error('Das Spiel ist nicht pausiert');
    }
    
    // Resume the game
    await update(lobbyRef, {
      status: 'playing',
      pausedBy: null,
      pausedAt: null
    });
  } catch (error) {
    console.error('Error resuming game:', error);
    throw error;
  }
};

// End the current round (host only)
export const endRound = async (lobbyCode, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann die Runde beenden');
    }
    
    // Check if game is in playing or paused state
    if (lobbyData.status !== 'playing' && lobbyData.status !== 'paused') {
      throw new Error('Das Spiel läuft nicht');
    }
    
    // Save current round data to history
    const roundData = {
      roundNumber: lobbyData.currentRound,
      letter: lobbyData.currentLetter,
      categories: lobbyData.categories,
      answers: lobbyData.answers || {},
      endedAt: serverTimestamp()
    };
    
    // Get current round history
    const roundHistory = lobbyData.roundHistory || [];
    
    // Add current round to history
    await update(lobbyRef, {
      status: 'roundEnd',
      roundHistory: [...roundHistory, roundData]
    });
  } catch (error) {
    console.error('Error ending round:', error);
    throw error;
  }
};

// Return to lobby (host only)
export const returnToLobby = async (lobbyCode, hostName) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    
    // Check if requester is host
    if (lobbyData.host !== hostName) {
      throw new Error('Nur der Host kann zur Lobby zurückkehren');
    }
    
    // Return to lobby
    await update(lobbyRef, {
      status: 'waiting',
      currentLetter: null,
      answers: null
    });
  } catch (error) {
    console.error('Error returning to lobby:', error);
    throw error;
  }
};

// Subscribe to lobby changes
export const subscribeLobby = (lobbyCode, callback) => {
  const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
  
  const unsubscribe = onValue(lobbyRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to lobby:', error);
    callback(null, error);
  });
  
  return unsubscribe;
};

// Subscribe to answers
export const subscribeToAnswers = (lobbyCode, callback) => {
  const answersRef = ref(db, `lobbies/${lobbyCode}/answers`);
  
  const unsubscribe = onValue(answersRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to answers:', error);
    callback(null, error);
  });
  
  return unsubscribe;
};

// Subscribe to round history
export const subscribeToRoundHistory = (lobbyCode, callback) => {
  const historyRef = ref(db, `lobbies/${lobbyCode}/roundHistory`);
  
  const unsubscribe = onValue(historyRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to round history:', error);
    callback([], error);
  });
  
  return unsubscribe;
};

// Get player's cumulative score
export const getPlayerScore = async (lobbyCode, playerName) => {
  try {
    // Check if lobby exists
    const historyRef = ref(db, `lobbies/${lobbyCode}/roundHistory`);
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const roundHistory = snapshot.val();
    
    // Calculate total score
    let totalScore = 0;
    
    roundHistory.forEach(round => {
      if (round.answers && round.answers[playerName]) {
        const playerAnswers = round.answers[playerName];
        
        Object.keys(playerAnswers).forEach(category => {
          if (category !== 'submittedAt' && playerAnswers[category].points) {
            totalScore += playerAnswers[category].points;
          }
        });
      }
    });
    
    return totalScore;
  } catch (error) {
    console.error('Error getting player score:', error);
    return 0;
  }
};

// Get all players' scores
export const getAllScores = async (lobbyCode) => {
  try {
    // Check if lobby exists
    const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
      throw new Error('Lobby nicht gefunden');
    }
    
    const lobbyData = snapshot.val();
    const roundHistory = lobbyData.roundHistory || [];
    const players = Object.keys(lobbyData.players || {});
    
    // Calculate scores for all players
    const scores = {};
    
    players.forEach(player => {
      scores[player] = {
        total: 0,
        rounds: {}
      };
    });
    
    // Calculate scores from round history
    roundHistory.forEach((round, roundIndex) => {
      if (round.answers) {
        Object.entries(round.answers).forEach(([player, answers]) => {
          if (!scores[player]) {
            scores[player] = {
              total: 0,
              rounds: {}
            };
          }
          
          let roundScore = 0;
          
          Object.keys(answers).forEach(category => {
            if (category !== 'submittedAt' && answers[category].points) {
              roundScore += answers[category].points;
            }
          });
          
          scores[player].rounds[roundIndex] = roundScore;
          scores[player].total += roundScore;
        });
      }
    });
    
    // Add current round scores if available
    if (lobbyData.answers) {
      Object.entries(lobbyData.answers).forEach(([player, answers]) => {
        if (!scores[player]) {
          scores[player] = {
            total: 0,
            rounds: {}
          };
        }
        
        let roundScore = 0;
        
        Object.keys(answers).forEach(category => {
          if (category !== 'submittedAt' && answers[category].points) {
            roundScore += answers[category].points;
          }
        });
        
        scores[player].rounds['current'] = roundScore;
        scores[player].total += roundScore;
      });
    }
    
    return scores;
  } catch (error) {
    console.error('Error getting all scores:', error);
    throw error;
  }
};
