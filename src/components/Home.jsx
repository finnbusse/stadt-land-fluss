import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { createLobby, joinLobby } from '../firebase/services';
import { useFirebase } from '../firebase/context';
import { saveSessionToLocalStorage, getSessionFromLocalStorage } from '../utils/cookies';

const Home = () => {
  const [username, setUsername] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [hasSession, setHasSession] = useState(false);
  
  const navigate = useNavigate();
  const { setCurrentPlayer, setLobbyCode: setContextLobbyCode } = useFirebase();

  // Check for existing session on component mount
  useEffect(() => {
    const session = getSessionFromLocalStorage();
    if (session.playerName && session.lobbyCode) {
      setUsername(session.playerName);
      setLobbyCode(session.lobbyCode);
      setHasSession(true);
    }
  }, []);

  const handleCreateLobby = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Bitte gib einen Benutzernamen ein');
      return;
    }
    
    try {
      setIsCreating(true);
      setError('');
      
      // Create a new lobby with the current user as host
      const newLobbyCode = await createLobby(username);
      
      // Save session to local storage
      saveSessionToLocalStorage(username, newLobbyCode);
      
      // Update context
      setCurrentPlayer(username);
      setContextLobbyCode(newLobbyCode);
      
      // Navigate to the lobby
      navigate(`/lobby/${newLobbyCode}`);
    } catch (error) {
      setError(`Fehler beim Erstellen der Lobby: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Bitte gib einen Benutzernamen ein');
      return;
    }
    
    if (!lobbyCode.trim()) {
      setError('Bitte gib einen Lobby-Code ein');
      return;
    }
    
    try {
      setIsJoining(true);
      setError('');
      
      const formattedLobbyCode = lobbyCode.toUpperCase();
      
      // Join the lobby
      await joinLobby(formattedLobbyCode, username);
      
      // Save session to local storage
      saveSessionToLocalStorage(username, formattedLobbyCode);
      
      // Update context
      setCurrentPlayer(username);
      setContextLobbyCode(formattedLobbyCode);
      
      // Navigate to the lobby
      navigate(`/lobby/${formattedLobbyCode}`);
    } catch (error) {
      setError(`Fehler beim Beitreten der Lobby: ${error.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleRejoinSession = () => {
    if (username && lobbyCode) {
      // Update context
      setCurrentPlayer(username);
      setContextLobbyCode(lobbyCode);
      
      // Navigate to the lobby
      navigate(`/lobby/${lobbyCode}`);
    }
  };

  return (
    <HomeContainer>
      <Logo>SLF</Logo>
      <Title>Stadt Land Fluss</Title>
      <Subtitle>Multiplayer Online-Spiel</Subtitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {hasSession && (
        <SessionCard>
          <SessionTitle>Vorherige Sitzung gefunden</SessionTitle>
          <SessionInfo>
            <p>Name: <strong>{username}</strong></p>
            <p>Lobby: <strong>{lobbyCode}</strong></p>
          </SessionInfo>
          <SessionActions>
            <ActionButton primary onClick={handleRejoinSession}>
              Sitzung fortsetzen
            </ActionButton>
            <SessionNewButton onClick={() => setHasSession(false)}>
              Neue Sitzung starten
            </SessionNewButton>
          </SessionActions>
        </SessionCard>
      )}
      
      {!hasSession && (
        <FormContainer>
          <InputGroup>
            <Label htmlFor="username">Dein Name:</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Name eingeben"
              maxLength={15}
            />
          </InputGroup>
          
          <ButtonsContainer>
            <ActionButton 
              onClick={handleCreateLobby} 
              disabled={isCreating || isJoining}
              primary
            >
              {isCreating ? 'Erstelle Lobby...' : 'Neue Lobby erstellen'}
            </ActionButton>
            
            <OrDivider>oder</OrDivider>
            
            <InputGroup>
              <Label htmlFor="lobbyCode">Lobby-Code:</Label>
              <Input
                id="lobbyCode"
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                placeholder="z.B. ABC123"
                maxLength={6}
              />
            </InputGroup>
            
            <ActionButton 
              onClick={handleJoinLobby} 
              disabled={isCreating || isJoining}
              secondary
            >
              {isJoining ? 'Trete Lobby bei...' : 'Lobby beitreten'}
            </ActionButton>
          </ButtonsContainer>
        </FormContainer>
      )}
      
      <GameRules>
        <RulesTitle>Spielregeln:</RulesTitle>
        <RulesText>
          Bei "Stadt Land Fluss" müssen die Spieler zu einem bestimmten Buchstaben passende Begriffe in verschiedenen Kategorien finden.
          Der Host kann bis zu 10 Kategorien festlegen und den Spielablauf steuern.
          Spieler vergeben sich selbst Punkte für ihre Antworten: 5, 10 oder 20 Punkte pro Feld.
          Nach jeder Runde werden alle Antworten für alle Spieler sichtbar und die Punkte werden gespeichert.
        </RulesText>
      </GameRules>
      
      <Footer>
        <FooterText>© 2025 Stadt Land Fluss - Ein Multiplayer-Spiel</FooterText>
      </Footer>
    </HomeContainer>
  );
};

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
`;

const Logo = styled.div`
  background-color: var(--primary-color);
  color: white;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  box-shadow: 0 4px 8px var(--shadow-color);
`;

const Title = styled.h1`
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  text-align: center;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 20px var(--shadow-color);
  margin-bottom: 2rem;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const SessionCard = styled.div`
  width: 100%;
  max-width: 500px;
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 20px var(--shadow-color);
  margin-bottom: 2rem;
  border-left: 4px solid var(--primary-color);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const SessionTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
`;

const SessionInfo = styled.div`
  margin-bottom: 1.5rem;
  
  p {
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }
  
  strong {
    color: var(--text-primary);
  }
`;

const SessionActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SessionNewButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  text-decoration: underline;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
  }
  
  &::placeholder {
    color: #9aa0a6;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: ${props => props.primary ? 'var(--primary-color)' : props.secondary ? 'var(--secondary-color)' : 'var(--text-secondary)'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px var(--shadow-color);
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--primary-dark)' : props.secondary ? 'var(--secondary-dark)' : '#202124'};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px var(--shadow-color);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px var(--shadow-color);
  }
  
  &:disabled {
    background-color: #9aa0a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const OrDivider = styled.div`
  text-align: center;
  margin: 1rem 0;
  position: relative;
  color: var(--text-secondary);
  font-weight: 500;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 45%;
    height: 1px;
    background-color: var(--border-color);
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
`;

const ErrorMessage = styled.div`
  background-color: #fdeded;
  color: var(--danger-color);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 500px;
  text-align: center;
  border-left: 4px solid var(--danger-color);
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const GameRules = styled.div`
  background-color: var(--background-white);
  padding: 1.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px var(--shadow-color);
  margin-bottom: 2rem;
`;

const RulesTitle = styled.h3`
  margin-bottom: 0.75rem;
  color: var(--primary-color);
  font-size: 1.25rem;
`;

const RulesText = styled.p`
  line-height: 1.6;
  color: var(--text-secondary);
`;

const Footer = styled.footer`
  margin-top: auto;
  padding: 1rem 0;
  width: 100%;
  text-align: center;
`;

const FooterText = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

export default Home;
