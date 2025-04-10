// src/utils/scoring.js
/**
 * Calculate points for answers based on the specified rules:
 * - +20 points: If a player is the only one with an answer for a category
 * - +10 points: If multiple players have different answers for a category
 * - +5 points: If two or more players have the same answer for a category
 * 
 * @param {Object} allAnswers - Object containing all players' answers
 * @param {Array} categories - Array of category names
 * @returns {Object} - Object with calculated points for each player and category
 */
export const calculatePoints = (allAnswers, categories) => {
  const result = {};
  
  // Initialize result object with players
  Object.keys(allAnswers).forEach(player => {
    result[player] = {};
    categories.forEach(category => {
      result[player][category] = {
        value: allAnswers[player][category]?.value || '',
        points: 0
      };
    });
  });
  
  // Process each category
  categories.forEach(category => {
    // Collect all answers for this category
    const categoryAnswers = {};
    
    Object.keys(allAnswers).forEach(player => {
      const answer = allAnswers[player][category]?.value || '';
      if (answer.trim()) {
        if (!categoryAnswers[answer]) {
          categoryAnswers[answer] = [];
        }
        categoryAnswers[answer].push(player);
      }
    });
    
    // Assign points based on the rules
    Object.entries(categoryAnswers).forEach(([answer, players]) => {
      if (players.length === 1 && Object.keys(categoryAnswers).length > 1) {
        // Unique answer and not the only player who answered
        result[players[0]][category].points = 20;
      } else if (players.length === 1) {
        // Unique answer but only one player answered
        result[players[0]][category].points = 10;
      } else {
        // Multiple players with the same answer
        players.forEach(player => {
          result[player][category].points = 5;
        });
      }
    });
  });
  
  return result;
};

/**
 * Calculate total points for a player across all categories
 * 
 * @param {Object} playerAnswers - Object containing a player's answers with points
 * @returns {Number} - Total points
 */
export const calculateTotalPoints = (playerAnswers) => {
  let total = 0;
  
  Object.keys(playerAnswers).forEach(category => {
    if (category !== 'submittedAt' && playerAnswers[category]?.points) {
      total += playerAnswers[category].points;
    }
  });
  
  return total;
};

/**
 * Calculate cumulative points for all players across all rounds
 * 
 * @param {Array} roundHistory - Array of round data objects
 * @param {Object} currentAnswers - Object containing current round answers
 * @param {Array} players - Array of player names
 * @returns {Object} - Object with total points for each player
 */
export const calculateCumulativePoints = (roundHistory, currentAnswers, players) => {
  const scores = {};
  
  // Initialize scores object
  players.forEach(player => {
    scores[player] = {
      total: 0,
      rounds: {}
    };
  });
  
  // Calculate scores from round history
  roundHistory.forEach((round, index) => {
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
          if (category !== 'submittedAt' && answers[category]?.points) {
            roundScore += answers[category].points;
          }
        });
        
        scores[player].rounds[index] = roundScore;
        scores[player].total += roundScore;
      });
    }
  });
  
  // Add current round scores if available
  if (currentAnswers) {
    Object.entries(currentAnswers).forEach(([player, answers]) => {
      if (!scores[player]) {
        scores[player] = {
          total: 0,
          rounds: {}
        };
      }
      
      let roundScore = 0;
      
      Object.keys(answers).forEach(category => {
        if (category !== 'submittedAt' && answers[category]?.points) {
          roundScore += answers[category].points;
        }
      });
      
      scores[player].rounds['current'] = roundScore;
      scores[player].total += roundScore;
    });
  }
  
  return scores;
};

/**
 * Sort players by total score in descending order
 * 
 * @param {Object} scores - Object with total points for each player
 * @returns {Array} - Array of player objects sorted by score
 */
export const getLeaderboard = (scores) => {
  return Object.entries(scores)
    .map(([player, data]) => ({
      player,
      total: data.total,
      rounds: data.rounds
    }))
    .sort((a, b) => b.total - a.total);
};
