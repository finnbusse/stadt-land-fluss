import React from 'react';
import { createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseProvider } from './firebase/context';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

const GlobalStyle = createGlobalStyle`
  :root {
    --primary-color: #4285f4;
    --primary-dark: #3367d6;
    --secondary-color: #34a853;
    --secondary-dark: #2e8b46;
    --warning-color: #fbbc05;
    --warning-dark: #f29900;
    --danger-color: #ea4335;
    --danger-dark: #d93025;
    --text-primary: #202124;
    --text-secondary: #5f6368;
    --background-light: #f8f9fa;
    --background-white: #ffffff;
    --border-color: #dadce0;
    --shadow-color: rgba(0, 0, 0, 0.1);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Roboto', sans-serif;
    background-color: var(--background-light);
    color: var(--text-primary);
    line-height: 1.6;
  }

  button {
    cursor: pointer;
    font-family: 'Roboto', sans-serif;
  }

  input, select {
    font-family: 'Roboto', sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    html {
      font-size: 12px;
    }
  }
`;

function App() {
  return (
    <FirebaseProvider>
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:id" element={<Lobby />} />
          <Route path="/game/:id" element={<Game />} />
        </Routes>
      </Router>
    </FirebaseProvider>
  );
}

export default App;
