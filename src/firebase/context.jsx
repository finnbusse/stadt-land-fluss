import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeLobby } from './services';

// Create Firebase context
const FirebaseContext = createContext(null);

// Firebase provider component
export const FirebaseProvider = ({ children }) => {
  const [currentLobby, setCurrentLobby] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [lobbyCode, setLobbyCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to lobby changes when lobbyCode changes
  useEffect(() => {
    if (!lobbyCode) {
      setCurrentLobby(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeLobby(lobbyCode, (lobbyData) => {
      if (lobbyData) {
        setCurrentLobby(lobbyData);
        // Check if current player is still in the lobby
        if (currentPlayer && !lobbyData.players[currentPlayer]) {
          setCurrentPlayer(null);
        }
      } else {
        // Lobby doesn't exist
        setCurrentLobby(null);
        setLobbyCode(null);
        setCurrentPlayer(null);
        setError('Lobby nicht gefunden oder wurde geschlossen');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [lobbyCode, currentPlayer]);

  // Value to be provided to consumers
  const value = {
    currentLobby,
    currentPlayer,
    lobbyCode,
    loading,
    error,
    setCurrentPlayer,
    setLobbyCode,
    setError,
    clearError: () => setError(null)
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
