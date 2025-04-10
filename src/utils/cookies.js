// src/utils/cookies.js
export const setCookie = (name, value, days = 30) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

export const saveSessionToLocalStorage = (playerName, lobbyCode) => {
  localStorage.setItem('slf_player_name', playerName);
  localStorage.setItem('slf_lobby_code', lobbyCode);
};

export const getSessionFromLocalStorage = () => {
  return {
    playerName: localStorage.getItem('slf_player_name'),
    lobbyCode: localStorage.getItem('slf_lobby_code')
  };
};

export const clearSessionFromLocalStorage = () => {
  localStorage.removeItem('slf_player_name');
  localStorage.removeItem('slf_lobby_code');
};
