import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';

// Placeholder components - will be implemented in later steps
const Home = () => <div>Stadt Land Fluss - Home Page</div>;
const Lobby = () => <div>Lobby System</div>;
const Game = () => <div>Game Interface</div>;

function App() {
  return (
    <Router>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:id" element={<Lobby />} />
          <Route path="/game/:id" element={<Game />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
`;

export default App;
