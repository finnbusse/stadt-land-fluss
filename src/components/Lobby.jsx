import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  leaveLobby, 
  kickPlayer, 
  updateCategories, 
  startGame, 
  setCustomLetter,
  returnToLobby
} from '../firebase/services';
import { useFirebase } from '../firebase/context';
import { saveSessionToLocalStorage, clearSessionFromLocalStorage } from '../utils/cookies';

const Lobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLobby, currentPlayer, loading, error } = useFirebase();
  
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [customLetter, setCustomLetter] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Check if user is host
  useEffect(() => {
    if (currentLobby && currentPlayer) {
      setIsHost(currentLobby.host === currentPlayer);
      setCategories(currentLobby.categories || []);
      
      // Save session to local storage whenever lobby data changes
      saveSessionToLocalStorage(currentPlayer, id);
    }
  }, [currentLobby, currentPlayer, id]);
  
  // Redirect to game when game starts
  useEffect(() => {
    if (currentLobby && currentLobby.status === 'playing') {
      navigate(`/game/${id}`);
    }
  }, [currentLobby, id, navigate]);
  
  // Handle leaving lobby
  const handleLeaveLobby = async () => {
    try {
      await leaveLobby(id, currentPlayer);
      clearSessionFromLocalStorage();
      navigate('/');
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  };
  
  // Handle kicking player (host only)
  const handleKickPlayer = async (playerName) => {
    if (!isHost || playerName === currentPlayer) return;
    
    try {
      await kickPlayer(id, playerName, currentPlayer);
    } catch (error) {
      console.error('Error kicking player:', error);
    }
  };
  
  // Handle adding category (host only)
  const handleAddCategory = () => {
    if (!isHost || !newCategory.trim() || categories.length >= 10) return;
    
    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory('');
    
    try {
      updateCategories(id, updatedCategories, currentPlayer);
    } catch (error) {
      console.error('Error updating categories:', error);
    }
  };
  
  // Handle removing category (host only)
  const handleRemoveCategory = (index) => {
    if (!isHost) return;
    
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
    
    try {
      updateCategories(id, updatedCategories, currentPlayer);
    } catch (error) {
      console.error('Error updating categories:', error);
    }
  };
  
  // Handle starting game (host only)
  const handleStartGame = async () => {
    if (!isHost) return;
    
    try {
      if (customLetter.trim()) {
        await setCustomLetter(id, customLetter.toUpperCase(), currentPlayer);
      } else {
        await startGame(id, currentPlayer);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };
  
  // Copy lobby code to clipboard
  const copyLobbyCode = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  if (loading) {
    return <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>Lade Lobby...</LoadingText>
    </LoadingContainer>;
  }
  
  if (error || !currentLobby) {
    return (
      <ErrorContainer>
        <ErrorIcon>!</ErrorIcon>
        <ErrorMessage>{error || 'Lobby nicht gefunden'}</ErrorMessage>
        <ActionButton onClick={() => navigate('/')} primary>Zurück zur Startseite</ActionButton>
      </ErrorContainer>
    );
  }
  
  return (
    <LobbyContainer>
      <LobbyHeader>
        <Title>Lobby: {id}</Title>
        <CopyButton onClick={copyLobbyCode}>
          {copySuccess ? 'Kopiert!' : 'Code kopieren'}
        </CopyButton>
        <SubTitle>
          {isHost ? 'Du bist der Host' : `Host: ${currentLobby.host}`}
        </SubTitle>
      </LobbyHeader>
      
      <ContentContainer>
        <LeftSection>
          <SectionTitle>Spieler ({Object.keys(currentLobby.players || {}).length}/6)</SectionTitle>
          <PlayersList>
            {Object.entries(currentLobby.players || {}).map(([name, data]) => (
              <PlayerItem key={name} isHost={data.isHost} isCurrentPlayer={name === currentPlayer}>
                <PlayerAvatar>{name.charAt(0).toUpperCase()}</PlayerAvatar>
                <PlayerName>{name} {data.isHost && <HostBadge>Host</HostBadge>}</PlayerName>
                {isHost && name !== currentPlayer && (
                  <KickButton onClick={() => handleKickPlayer(name)}>
                    Entfernen
                  </KickButton>
                )}
              </PlayerItem>
            ))}
          </PlayersList>
          
          <ActionButton danger onClick={handleLeaveLobby}>
            Lobby verlassen
          </ActionButton>
        </LeftSection>
        
        <RightSection>
          <SectionTitle>Kategorien ({categories.length}/10)</SectionTitle>
          
          {isHost && (
            <CategoryForm>
              <CategoryInput
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Neue Kategorie"
                disabled={categories.length >= 10}
              />
              <AddButton 
                onClick={handleAddCategory}
                disabled={!newCategory.trim() || categories.length >= 10}
              >
                Hinzufügen
              </AddButton>
            </CategoryForm>
          )}
          
          <CategoriesList>
            {categories.map((category, index) => (
              <CategoryItem key={index}>
                {category}
                {isHost && (
                  <RemoveButton onClick={() => handleRemoveCategory(index)}>
                    ×
                  </RemoveButton>
                )}
              </CategoryItem>
            ))}
          </CategoriesList>
          
          {isHost && (
            <GameControls>
              <SectionTitle>Spiel starten</SectionTitle>
              
              <LetterSelection>
                <Label>Buchstabe auswählen (optional):</Label>
                <LetterInput
                  type="text"
                  value={customLetter}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[A-Za-z]$/.test(value)) {
                      setCustomLetter(value.toUpperCase());
                    }
                  }}
                  placeholder="Zufällig"
                  maxLength={1}
                />
              </LetterSelection>
              
              <StartButton onClick={handleStartGame}>
                Spiel starten
              </StartButton>
            </GameControls>
          )}
        </RightSection>
      </ContentContainer>
      
      <GameInfo>
        <InfoIcon>i</InfoIcon>
        <InfoContent>
          <h3>Spielinfo:</h3>
          <p>
            Teile den Lobby-Code <strong>{id}</strong> mit deinen Freunden, damit sie beitreten können.
            {isHost ? ' Als Host kannst du Kategorien festlegen, Spieler entfernen und das Spiel starten.' : ''}
          </p>
          <p>
            Deine Sitzung wird automatisch gespeichert. Du kannst jederzeit zur Lobby zurückkehren, auch nach dem Schließen des Browsers.
          </p>
        </InfoContent>
      </GameInfo>
    </LobbyContainer>
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const LobbyContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease;
`;

const LobbyHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
`;

const CopyButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  background-color: var(--background-light);
  color: var(--text-secondary);
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--border-color);
    color: var(--text-primary);
  }
  
  @media (max-width: 768px) {
    position: static;
    margin-bottom: 1rem;
  }
`;

const SubTitle = styled.h2`
  font-size: 1.2rem;
  color: var(--text-secondary);
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftSection = styled.div`
  flex: 1;
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 16px var(--shadow-color);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const RightSection = styled.div`
  flex: 1;
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 16px var(--shadow-color);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--border-color);
    margin-left: 1rem;
  }
`;

const PlayersList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
`;

const PlayerItem = styled.li`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: ${props => 
    props.isCurrentPlayer 
      ? 'rgba(66, 133, 244, 0.1)' 
      : props.isHost 
        ? 'rgba(251, 188, 5, 0.1)' 
        : 'var(--background-light)'};
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
  }
`;

const PlayerAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1rem;
`;

const PlayerName = styled.span`
  font-weight: 500;
  flex: 1;
  display: flex;
  align-items: center;
`;

const HostBadge = styled.span`
  background-color: var(--warning-color);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
`;

const KickButton = styled.button`
  background-color: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--danger-dark);
    transform: scale(1.05);
  }
`;

const CategoryForm = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const CategoryInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
  }
  
  &:disabled {
    background-color: var(--background-light);
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  padding: 0 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: #9aa0a6;
    cursor: not-allowed;
  }
`;

const CategoriesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const CategoryItem = styled.div`
  background-color: var(--background-light);
  padding: 0.5rem 0.75rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--border-color);
    transform: scale(1.05);
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  
  &:hover {
    color: var(--danger-color);
  }
`;

const GameControls = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
`;

const LetterSelection = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const LetterInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1.5rem;
  text-transform: uppercase;
  text-align: center;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
  }
  
  &::placeholder {
    font-size: 1rem;
    font-weight: normal;
  }
`;

const StartButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(52, 168, 83, 0.3);
  
  &:hover {
    background-color: var(--secondary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(52, 168, 83, 0.4);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 8px rgba(52, 168, 83, 0.3);
  }
  
  animation: ${pulse} 2s infinite;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => 
    props.primary ? 'var(--primary-color)' : 
    props.danger ? 'var(--danger-color)' : 
    props.warning ? 'var(--warning-color)' : 
    'var(--text-secondary)'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => 
      props.primary ? 'var(--primary-dark)' : 
      props.danger ? 'var(--danger-dark)' : 
      props.warning ? 'var(--warning-dark)' : 
      '#202124'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const GameInfo = styled.div`
  background-color: var(--background-white);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px var(--shadow-color);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-style: italic;
`;

const InfoContent = styled.div`
  flex: 1;
  
  h3 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
  }
  
  p {
    line-height: 1.6;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid var(--background-light);
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingText = styled.div`
  font-size: 1.2rem;
  color: var(--text-secondary);
`;

const ErrorContainer = styled.div`
  max-width: 500px;
  margin: 4rem auto;
  text-align: center;
  padding: 2rem;
  background-color: var(--background-white);
  border-radius: 12px;
  box-shadow: 0 8px 16px var(--shadow-color);
  animation: ${fadeIn} 0.5s ease;
`;

const ErrorIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--danger-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 2rem;
  margin: 0 auto 1rem;
`;

const ErrorMessage = styled.div`
  color: var(--text-primary);
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
`;

export default Lobby;
