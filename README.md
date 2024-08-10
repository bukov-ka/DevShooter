# DevShooter

DevShooter is a browser-based multiplayer shooter game where players choose from three developer roles and battle it out using their coding skills and special abilities.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/bukov-ka/DevShooter.git
   cd devshooter
   ```

2. Install dependencies for both the client and server:
   ```
   npm install
   cd server
   npm install
   cd ..
   ```

## Running the Server

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Start the server:
   ```
   node index.js
   ```

The server will start running on `http://localhost:3000`.

## Running the Client

1. In the root directory of the project, start the development server:
   ```
   npm start
   ```

2. Open your browser and go to `http://localhost:9000` to play the game.

## How to Play

- Use WASD keys to move your character
- Click to shoot
- Press Spacebar to use your special ability
- Eliminate other players and be the first to reach 10 points to win!

## Character Types

- Backend Developer: Throws 500 error grenades
- Frontend Developer: Can teleport using CSS shift
- QA: Performs load testing with a burst of bullets

Enjoy playing DevShooter!