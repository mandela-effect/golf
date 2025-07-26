# Golf Card Game - Multiplayer Setup

## Frontend Implementation
The multiplayer frontend is now complete with:

- **Menu page** with game mode selection
- **Single player mode** (vs CPU)
- **Multiplayer mode** with room codes
- **Real-time WebSocket communication**
- **Opponent card hiding during peek phase**

## WebSocket Server Setup

### Prerequisites
- Node.js installed on your server

### Installation
1. Copy `websocket-server.js` and `package-websocket.json` to your server
2. Rename `package-websocket.json` to `package.json`
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Server
```bash
npm start
```
The server will run on port 3001 by default.

### Environment Variables
- `PORT`: Set custom port (default: 3001)

### Frontend Configuration
Update the `WS_URL` in `src/hooks/useMultiplayerGame.ts`:
```typescript
const WS_URL = 'ws://your-server-domain:3001';
// or for production:
const WS_URL = 'wss://your-server-domain';
```

## Game Features

### Multiplayer Flow
1. Player creates room → gets shareable link
2. Second player joins via room code or link
3. Game starts automatically when 2 players connected
4. Turn-based gameplay with real-time sync
5. Opponent cards hidden during peek phase

### Server Features
- Room-based game state management
- Real-time turn synchronization
- Automatic cleanup when players leave
- Health check endpoint at `/health`

### Error Handling
- Connection status indicators
- Room full detection
- Automatic reconnection attempts
- Graceful fallbacks

## Deployment Tips

### For Production
1. Use HTTPS/WSS for secure connections
2. Add proper CORS headers if needed
3. Consider using PM2 for process management
4. Add logging and monitoring

### Example PM2 Setup
```bash
npm install -g pm2
pm2 start websocket-server.js --name golf-server
pm2 startup
pm2 save
```

## Testing
- Visit `/` for the main menu
- Test single player mode works as before
- Create multiplayer room and share link
- Test real-time synchronization between players