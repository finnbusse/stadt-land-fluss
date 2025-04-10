// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration from the task requirements
const firebaseConfig = {
  apiKey: "AIzaSyCcGDUxetiTFGv_FLj2qvw-nC9zEZ6Odi4",
  authDomain: "manus-stadt-land-fluss.firebaseapp.com",
  projectId: "manus-stadt-land-fluss",
  storageBucket: "manus-stadt-land-fluss.firebasestorage.app",
  messagingSenderId: "755419684596",
  appId: "1:755419684596:web:3275fb3ac9f5ebd89c48a1",
  measurementId: "G-83KDSR7V9D",
  databaseURL: "https://manus-stadt-land-fluss-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
