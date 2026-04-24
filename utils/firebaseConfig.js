import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDX13FHk3KvoO8H_USIBtO7LyXXlCmwJzM",
  authDomain: "fittrack-14584.firebaseapp.com",
  databaseURL: "https://fittrack-14584-default-rtdb.firebaseio.com",
  projectId: "fittrack-14584",
  storageBucket: "fittrack-14584.firebasestorage.app",
  messagingSenderId: "386383979186",
  appId: "1:386383979186:web:6bf96b66d3100dc84b9fab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
