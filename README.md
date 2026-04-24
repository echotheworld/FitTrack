# 🏃‍♂️ FitTrack - AI-Powered Fitness Manager

FitTrack is a modern, high-performance fitness application built with React Native and Expo. It features real-time activity tracking, an AI Goal Architect, and seamless cloud synchronization with Firebase.

---

## 🚀 Getting Started

If you are not a developer, follow these simple steps to run the app on your phone:

### 1. Prerequisites
Before you start, make sure you have these installed:
*   **Node.js**: Download and install the "LTS" version from [nodejs.org](https://nodejs.org/).
*   **Expo Go App**: Search for "Expo Go" on the Google Play Store (Android) or Apple App Store (iOS) and install it on your phone.

### 2. Setup the Project
1.  **Download/Clone** the repository to your computer.
2.  Open your **Terminal** or **Command Prompt** (CMD).
3.  Navigate to the project folder (the folder containing this README).
4.  Type the following command and press Enter:
    ```bash
    npm install
    ```
    *Wait for it to finish. This downloads the "brains" of the app.*

### 3. Run the App
1.  In your terminal, type:
    ```bash
    npx expo start
    ```
2.  A large **QR Code** will appear in your terminal.
3.  **On Android**: Open the Expo Go app and tap "Scan QR Code."
4.  **On iOS (iPhone)**: Open your Camera app and scan the QR code.
5.  Wait a few seconds for the app to "Build" and it will open on your phone!

---

## ✨ Key Features

*   **🤖 AI Goal Architect**: Type your fitness objective (e.g., "I want to lose weight in 2 weeks"), and the AI will generate a custom plan for you to confirm.
*   **⏱️ Real-Time Tracking**: Record your runs, walks, and hikes with live timer, step counting, and distance calculation.
*   **📅 7-Day Performance Log**: A detailed history view under the "Progress" tab. Expand any day to see a session-by-session breakdown of your workouts.
*   **☁️ Cloud Sync**: All your profiles and activities are backed up to Firebase. Your data stays with you even if you delete the app.
*   **🎨 Premium UI**: Dark-mode inspired aesthetics with glassmorphism effects and smooth animations.

---

## 🛠️ Technical Stack
*   **Frontend**: React Native (Expo)
*   **State Management**: Zustand (Persistent)
*   **Backend**: Firebase Realtime Database
*   **AI**: Gemini-powered logic for goal generation
*   **Sensors**: Expo Pedometer for real-time movement tracking

---

## 📂 Project Structure
*   `/screens`: All the app pages (Dashboard, Progress, Profile, etc.)
*   `/store`: State management (Auth, Activities, Goals)
*   `/utils`: Helper functions (Firebase config, stats calculation)
*   `/components`: Reusable UI elements

---

## ⚖️ License
This project is for academic/group purposes. Built with ❤️ for FitTrack.
