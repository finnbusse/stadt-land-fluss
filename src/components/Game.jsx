import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  submitAnswers, 
  pauseGame, 
  resumeGame, 
  endRound, 
  returnToLobby,
  startGame,
  subscribeToAnswers,
  subscribeToRoundHistory
} from '../firebase/services';
import { useFirebase } from '../firebase/context';
import { saveSessionToLocalStorage, clearSessionFromLocalStorage } from '../utils/cookies';
import { calculatePoints, calculateTotalPoints, calculateCumulativePoints, getLeaderboard } from '../utils/scoring';

const Game = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLobby, currentPlayer, loading, error } = useFirebase();
  
  const [answers, setAnswers] = useState({});
  const [allAnswers, setAllAnswers] = useState({});
  const [calculatedAnswers, setCalculatedAnswers] = useState({});
  const [roundHistory, setRoundHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Check if user is host and save session
  useEffect(() => {
    if (currentLobby && currentPlayer) {
      setIsHost(currentLobby.host === currentPlayer);
      
      // Initialize answers object with categories
      if (currentLobby.categories) {
        const initialAnswers = {};
        currentLobby.categories.forEach(category => {
          initialAnswers[category] = { value: '' };
        });
        setAnswers(initialAnswers);
      }
      
      // Save session to local storage
      saveSessionToLocalStorage(currentPlayer, id);
    }
  }, [currentLobby, currentPlayer, id]);
  
  // Subscribe to all players' answers
  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToAnswers(id, (data) => {
      setAllAnswers(data || {});
    });
    
    return () => unsubscribe();
  }, [id]);
  
  // Subscribe to round history
  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToRoundHistory(id, (data) => {
      setRoundHistory(data || []);
    });
    
    return () => unsubscribe();
  }, [id]);
  
  // Calculate points when answers change
  useEffect(() => {
    if (currentLobby && currentLobby.categories && Object.keys(allAnswers).length > 0) {
      const calculated = calculatePoints(allAnswers, currentLobby.categories);
      setCalculatedAnswers(calculated);
      
      // Calculate leaderboard
      const scores = calculateCumulativePoints(roundHistory, calculated, Object.keys(currentLobby.players || {}));
      const sortedLeaderboard = getLeaderboard(scores);
      setLeaderboard(sortedLeaderboard);
    }
  }, [allAnswers, currentLobby, roundHistory]);
  
  // Redirect to lobby if game is not in playing or paused state
  useEffect(() => {
    if (currentLobby && (currentLobby.status === 'waiting')) {
      navigate(`/lobby/${id}`);
    }
    
    // Show results when round ends
    if (currentLobby && currentLobby.status === 'roundEnd') {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [currentLobby, id, navigate]);
  
  // Handle input change
  const handleInputChange = (category, value) => {
    setAnswers(prev => ({
      ...prev,
      [category]: { ...prev[category], value }
    }));
  };
  
  // Handle submit answers
  const handleSubmitAnswers = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers = {};
      Object.entries(answers).forEach(([category, data]) => {
        formattedAnswers[category] = {
          value: data.value
        };
      });
      
      await submitAnswers(id, currentPlayer, formattedAnswers);
    } catch (error) {
      console.error('Error submitting answers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle pause game
  const handlePauseGame = async () => {
    try {
      await pauseGame(id, currentPlayer);
    } catch (error) {
      console.error('Error pausing game:', error);
    }
  };
  
  // Handle resume game (host only)
  const handleResumeGame = async () => {
    if (!isHost) return;
    
    try {
      await resumeGame(id, currentPlayer);
    } catch (error) {
      console.error('Error resuming game:', error);
    }
  };
  
  // Handle end round (host only)
  const handleEndRound = async () => {
    if (!isHost) return;
    
    try {
      // First update the answers with calculated points
      for (const [player, answers] of Object.entries(calculatedAnswers)) {
        await submitAnswers(id, player, answers);
      }
      
      // Then end the round
      setTimeout(async () => {
        await endRound(id, currentPlayer);
      }, 500);
    } catch (error) {
      console.error('Error ending round:', error);
    }
  };
  
  // Handle return to lobby (host only)
  const handleReturnToLobby = async () => {
    if (!isHost) return;
    
    try {
      await returnToLobby(id, currentPlayer);
    } catch (error) {
      console.error('Error returning to lobby:', error);
    }
  };
  
  // Handle start new round (host only)
  const handleStartNewRound = async () => {
    if (!isHost) return;
    
    try {
      await returnToLobby(id, currentPlayer);
      // Small delay to ensure Firebase updates
      setTimeout(async () => {
        await startGame(id, currentPlayer);
      }, 500);
    } catch (error) {
      console.error('Error starting new round:', error);
    }
  };
  
  // Toggle round history view
  const toggleHistoryView = () => {
    setShowHistory(!showHistory);
  };
  
  // Check if player has submitted answers
  const hasSubmitted = () => {
    return allAnswers && allAnswers[currentPlayer];
  };
  
  // Count how many players have submitted answers
  const countSubmissions = () => {
    return Object.keys(allAnswers || {}).length;
  };
  
  // Count total players
  const countPlayers = () => {
    return Object.keys(currentLobby?.players || {}).length;
  };
  
  if (loading) {
    return <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>Lade Spiel...</LoadingText>
    </LoadingContainer>;
  }
  
  if (error || !currentLobby) {
    return (
      <ErrorContainer>
        <ErrorIcon>!</ErrorIcon>
        <ErrorMessage>{error || 'Spiel nicht gefunden'}</ErrorMessage>
        <ActionButton onClick={() => navigate('/')} primary>Zurück zur Startseite</ActionButton>
      </ErrorContainer>
    );
  }
  
  // Render round results view
  if (showResults) {
    return (
      <GameContainer>
        <GameHeader>
          <ResultsTitle>Runde {currentLobby.currentRound} beendet!</ResultsTitle>
          <ResultsSubtitle>Buchstabe: {currentLobby.currentLetter}</ResultsSubtitle>
        </GameHeader>
        
        <ResultsContainer>
          <LeaderboardSection>
            <LeaderboardTitle>Rangliste</LeaderboardTitle>
            <LeaderboardTable>
              <thead>
                <tr>
                  <TableHeader>Rang</TableHeader>
                  <TableHeader>Spieler</TableHeader>
                  <TableHeader>Punkte</TableHeader>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => (
                  <tr key={item.player}>
                    <RankCell>{index + 1}</RankCell>
                    <TableCell>
                      <PlayerInfo>
                        <PlayerAvatar>{item.player.charAt(0).toUpperCase()}</PlayerAvatar>
                        <span>{item.player}</span>
                        {item.player === currentPlayer && <CurrentPlayerBadge>Du</CurrentPlayerBadge>}
                        {currentLobby.host === item.player && <HostBadge>Host</HostBadge>}
                      </PlayerInfo>
                    </TableCell>
                    <PointsCell>{item.total}</PointsCell>
                  </tr>
                ))}
              </tbody>
            </LeaderboardTable>
          </LeaderboardSection>
          
          <ResultsTable>
            <thead>
              <tr>
                <TableHeader>Spieler</TableHeader>
                {currentLobby.categories.map(category => (
                  <TableHeader key={category}>{category}</TableHeader>
                ))}
                <TableHeader>Runde</TableHeader>
              </tr>
            </thead>
            <tbody>
              {Object.entries(calculatedAnswers).map(([player, playerAnswers]) => {
                // Calculate points for this round
                const roundPoints = calculateTotalPoints(playerAnswers);
                
                return (
                  <tr key={player}>
                    <TableCell>
                      <PlayerInfo>
                        <PlayerAvatar>{player.charAt(0).toUpperCase()}</PlayerAvatar>
                        <span>{player}</span>
                        {player === currentPlayer && <CurrentPlayerBadge>Du</CurrentPlayerBadge>}
                        {currentLobby.host === player && <HostBadge>Host</HostBadge>}
                      </PlayerInfo>
                    </TableCell>
                    {currentLobby.categories.map(category => (
                      <TableCell key={category}>
                        {playerAnswers[category] ? (
                          <AnswerCell>
                            <AnswerText>{playerAnswers[category].value || '-'}</AnswerText>
                            <PointsBadge points={playerAnswers[category].points}>
                              {playerAnswers[category].points || 0}
                            </PointsBadge>
                          </AnswerCell>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    ))}
                    <TableCell bold>{roundPoints}</TableCell>
                  </tr>
                );
              })}
            </tbody>
          </ResultsTable>
          
          {roundHistory.length > 0 && (
            <HistoryToggle onClick={toggleHistoryView}>
              {showHistory ? 'Rundenhistorie ausblenden' : 'Rundenhistorie anzeigen'}
            </HistoryToggle>
          )}
          
          {showHistory && roundHistory.length > 0 && (
            <HistorySection>
              <HistoryTitle>Rundenhistorie</HistoryTitle>
              
              {roundHistory.map((round, index) => (
                <HistoryRound key={index}>
                  <HistoryRoundHeader>
                    <HistoryRoundTitle>Runde {round.roundNumber}: Buchstabe {round.letter}</HistoryRoundTitle>
                  </HistoryRoundHeader>
                  
                  <HistoryTable>
                    <thead>
                      <tr>
                        <TableHeader>Spieler</TableHeader>
                        {round.categories.map(category => (
                          <TableHeader key={category}>{category}</TableHeader>
                        ))}
                        <TableHeader>Punkte</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(round.answers || {}).map(([player, playerAnswers]) => {
                        // Calculate total points for this player in this round
                        let roundTotal = 0;
                        Object.keys(playerAnswers).forEach(category => {
                          if (category !== 'submittedAt' && playerAnswers[category]?.points) {
                            roundTotal += playerAnswers[category].points;
                          }
                        });
                        
                        return (
                          <tr key={player}>
                            <TableCell>
                              <PlayerInfo>
                                <PlayerAvatar>{player.charAt(0).toUpperCase()}</PlayerAvatar>
                                <span>{player}</span>
                                {player === currentPlayer && <CurrentPlayerBadge>Du</CurrentPlayerBadge>}
                              </PlayerInfo>
                            </TableCell>
                            {round.categories.map(category => (
                              <TableCell key={category}>
                                {playerAnswers[category] ? (
                                  <AnswerCell>
                                    <AnswerText>{playerAnswers[category].value || '-'}</AnswerText>
                                    <PointsBadge points={playerAnswers[category].points}>
                                      {playerAnswers[category].points || 0}
                                    </PointsBadge>
                                  </AnswerCell>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            ))}
                            <TableCell bold>{roundTotal}</TableCell>
                          </tr>
                        );
                      })}
                    </tbody>
                  </HistoryTable>
                </HistoryRound>
              ))}
            </HistorySection>
          )}
          
          <ResultsActions>
            {isHost ? (
              <>
                <ActionButton primary onClick={handleStartNewRound}>
                  Neue Runde starten
                </ActionButton>
                <ActionButton onClick={handleReturnToLobby}>
                  Zurück zur Lobby
                </ActionButton>
              </>
            ) : (
              <ResultsMessage>
                Warte auf den Host, um eine neue Runde zu starten...
              </ResultsMessage>
            )}
          </ResultsActions>
        </ResultsContainer>
      </GameContainer>
    );
  }
  
  return (
    <GameContainer>
      <GameHeader>
        <LetterBadge>{currentLobby.currentLetter}</LetterBadge>
        <Title>Runde {currentLobby.currentRound}</Title>
        <GameStatus status={currentLobby.status}>
          {currentLobby.status === 'paused' 
            ? `Spiel pausiert von ${currentLobby.pausedBy}` 
            : `${countSubmissions()} von ${countPlayers()} Spielern haben geantwortet`}
        </GameStatus>
      </GameHeader>
      
      <GameControls>
        {currentLobby.status === 'playing' && !hasSubmitted() && (
          <ControlButton primary onClick={handleSubmitAnswers} disabled={isSubmitting}>
            {isSubmitting ? 'Sende Antworten...' : 'Antworten abschicken'}
          </ControlButton>
        )}
        
        {currentLobby.status === 'playing' && (
          <ControlButton onClick={handlePauseGame}>
            Spiel pausieren
          </ControlButton>
        )}
        
        {currentLobby.status === 'paused' && isHost && (
          <ControlButton primary onClick={handleResumeGame}>
            Spiel fortsetzen
          </ControlButton>
        )}
        
        {isHost && (
          <>
            <ControlButton warning onClick={handleEndRound}>
              Runde beenden
            </ControlButton>
            
            <ControlButton danger onClick={handleReturnToLobby}>
              Zurück zur Lobby
            </ControlButton>
          </>
        )}
      </GameControls>
      
      {currentLobby.status === 'playing' && !hasSubmitted() ? (
        <AnswerForm>
          <FormHeader>
            <h3>Deine Antworten für Buchstabe {currentLobby.currentLetter}</h3>
            <FormSubtitle>
              Fülle die Felder aus. Die Punkte werden automatisch vergeben:
              <PointsRules>
                <PointsRule>+20 Punkte: Wenn du als einziger eine Antwort hast</PointsRule>
                <PointsRule>+10 Punkte: Wenn mehrere Spieler unterschiedliche Antworten haben</PointsRule>
                <PointsRule>+5 Punkte: Wenn zwei oder mehr Spieler die gleiche Antwort haben</PointsRule>
              </PointsRules>
            </FormSubtitle>
          </FormHeader>
          
          {currentLobby.categories.map(category => (
            <AnswerRow key={category}>
              <CategoryLabel>{category}</CategoryLabel>
              <AnswerInput
                type="text"
                value={answers[category]?.value || ''}
                onChange={(e) => handleInputChange(category, e.target.value)}
                placeholder={`${category} mit ${currentLobby.currentLetter}...`}
              />
            </AnswerRow>
          ))}
          
          <SubmitButtonContainer>
            <SubmitButton 
              onClick={handleSubmitAnswers} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sende Antworten...' : 'Antworten abschicken'}
            </SubmitButton>
          </SubmitButtonContainer>
        </AnswerForm>
      ) : (
        <WaitingMessage>
          {hasSubmitted() 
            ? <><WaitingIcon>✓</WaitingIcon>Du hast deine Antworten abgeschickt. Warte auf die anderen Spieler...</> 
            : <><WaitingIcon>⏸</WaitingIcon>Das Spiel ist pausiert. Warte bis es fortgesetzt wird...</>}
        </WaitingMessage>
      )}
      
      {leaderboard.length > 0 && (
        <LeaderboardContainer>
          <LeaderboardTitle>Aktuelle Rangliste</LeaderboardTitle>
          <LeaderboardTable>
            <thead>
              <tr>
                <TableHeader>Rang</TableHeader>
                <TableHeader>Spieler</TableHeader>
                <TableHeader>Punkte</TableHeader>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((item, index) => (
                <tr key={item.player}>
                  <RankCell>{index + 1}</RankCell>
                  <TableCell>
                    <PlayerInfo>
                      <PlayerAvatar>{item.player.charAt(0).toUpperCase()}</PlayerAvatar>
                      <span>{item.player}</span>
                      {item.player === currentPlayer && <CurrentPlayerBadge>Du</CurrentPlayerBadge>}
                      {currentLobby.host === item.player && <HostBadge>Host</HostBadge>}
                    </PlayerInfo>
                  </TableCell>
                  <PointsCell>{item.total}</PointsCell>
                </tr>
              ))}
            </tbody>
          </LeaderboardTable>
        </LeaderboardContainer>
      )}
      
      {isHost && currentLobby.status === 'playing' && (
        <HostView>
          <HostViewHeader>
            <h3>Alle Antworten (nur für Host sichtbar)</h3>
            <HostViewSubtitle>Hier siehst du alle eingereichten Antworten der Spieler</HostViewSubtitle>
          </HostViewHeader>
          
          <AnswersTable>
            <thead>
              <tr>
                <TableHeader>Spieler</TableHeader>
                {currentLobby.categories.map(category => (
                  <TableHeader key={category}>{category}</TableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(allAnswers).map(([player, playerAnswers]) => {
                return (
                  <tr key={player}>
                    <TableCell>
                      <PlayerInfo>
                        <PlayerAvatar>{player.charAt(0).toUpperCase()}</PlayerAvatar>
                        <span>{player}</span>
                      </PlayerInfo>
                    </TableCell>
                    {currentLobby.categories.map(category => (
                      <TableCell key={category}>
                        {playerAnswers[category] ? (
                          <AnswerText>{playerAnswers[category].value || '-'}</AnswerText>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </AnswersTable>
        </HostView>
      )}
    </GameContainer>
  );
};

// Styled components
const GameContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const GameHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LetterBadge = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  box-shadow: 0 4px 8px var(--shadow-color);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const GameStatus = styled.div`
  font-size: 1.2rem;
  color: ${props => props.status === 'paused' ? 'var(--warning-color)' : 'var(--text-secondary)'};
  background-color: ${props => props.status === 'paused' ? 'rgba(251, 188, 5, 0.1)' : 'transparent'};
  padding: ${props => props.status === 'paused' ? '0.5rem 1rem' : '0'};
  border-radius: ${props => props.status === 'paused' ? '20px' : '0'};
  font-weight: ${props => props.status === 'paused' ? '500' : 'normal'};
`;

const GameControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ControlButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${props => {
    if (props.primary) return 'var(--primary-color)';
    if (props.warning) return 'var(--warning-color)';
    if (props.danger) return 'var(--danger-color)';
    return 'var(--text-secondary)';
  }};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => {
      if (props.primary) return 'var(--primary-dark)';
      if (props.warning) return 'var(--warning-dark)';
      if (props.danger) return 'var(--danger-dark)';
      return '#202124';
    }};
    transform: translateY(-2px);
  }
  
  &:disabled {
    background-color: var(--text-tertiary);
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnswerForm = styled.div`
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px var(--shadow-color);
  margin-bottom: 2rem;
`;

const FormHeader = styled.div`
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    text-align: center;
  }
`;

const FormSubtitle = styled.div`
  color: var(--text-secondary);
  font-size: 1rem;
  text-align: center;
`;

const PointsRules = styled.div`
  margin-top: 1rem;
  background-color: var(--background-light);
  padding: 1rem;
  border-radius: 8px;
  text-align: left;
`;

const PointsRule = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AnswerRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  background-color: var(--background-light);
  padding: 1rem;
  border-radius: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const CategoryLabel = styled.div`
  width: 120px;
  font-weight: 500;
  color: var(--text-primary);
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnswerInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.2);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SubmitButtonContainer = styled.div`
  margin-top: 2rem;
  text-align: center;
`;

const SubmitButton = styled.button`
  padding: 1rem 2rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background-color: var(--text-tertiary);
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const WaitingMessage = styled.div`
  background-color: var(--background-white);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  box-shadow: 0 4px 8px var(--shadow-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const WaitingIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const HostView = styled.div`
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px var(--shadow-color);
  overflow: hidden;
  margin-bottom: 2rem;
`;

const HostViewHeader = styled.div`
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
`;

const HostViewSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
`;

const AnswersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
  color: var(--text-primary);
  background-color: var(--background-light);
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: ${props => props.bold ? '700' : '400'};
  color: ${props => props.bold ? 'var(--primary-color)' : 'var(--text-primary)'};
  font-size: ${props => props.bold ? '1.2rem' : '1rem'};
`;

const RankCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
`;

const PointsCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 700;
  color: var(--primary-color);
  text-align: right;
  font-size: 1.2rem;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlayerAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const AnswerCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AnswerText = styled.div`
  font-weight: 500;
`;

const PointsBadge = styled.span`
  display: inline-block;
  background-color: ${props => {
    if (props.points === 20) return 'rgba(16, 163, 127, 0.2)';
    if (props.points === 10) return 'rgba(251, 188, 5, 0.2)';
    return 'rgba(66, 133, 244, 0.2)';
  }};
  color: ${props => {
    if (props.points === 20) return 'var(--success-color)';
    if (props.points === 10) return 'var(--warning-color)';
    return 'var(--primary-color)';
  }};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  width: fit-content;
`;

// Results view styles
const ResultsTitle = styled.h1`
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
`;

const ResultsSubtitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
`;

const ResultsContainer = styled.div`
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px var(--shadow-color);
`;

const ResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;

const ResultsActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ResultsMessage = styled.div`
  text-align: center;
  padding: 1rem;
  background-color: var(--background-light);
  border-radius: 8px;
  color: var(--text-secondary);
  font-style: italic;
`;

const CurrentPlayerBadge = styled.span`
  background-color: var(--primary-color);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
`;

const HostBadge = styled.span`
  background-color: var(--warning-color);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
`;

// History view styles
const HistoryToggle = styled.button`
  background-color: var(--background-light);
  color: var(--text-secondary);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--border-color);
    color: var(--text-primary);
  }
`;

const HistorySection = styled.div`
  margin-bottom: 2rem;
`;

const HistoryTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

const HistoryRound = styled.div`
  background-color: var(--background-light);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const HistoryRoundHeader = styled.div`
  margin-bottom: 1rem;
`;

const HistoryRoundTitle = styled.h4`
  font-size: 1.2rem;
  color: var(--primary-color);
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
  }
`;

// Leaderboard styles
const LeaderboardContainer = styled.div`
  background-color: var(--background-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px var(--shadow-color);
  margin-bottom: 2rem;
`;

const LeaderboardSection = styled.div`
  margin-bottom: 2rem;
  background-color: var(--background-light);
  border-radius: 12px;
  padding: 1.5rem;
`;

const LeaderboardTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-align: center;
`;

const LeaderboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
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
  border: 3px solid var(--background-light);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
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
  box-shadow: 0 4px 8px var(--shadow-color);
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

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
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
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

export default Game;
