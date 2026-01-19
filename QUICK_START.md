# Quick Start Commands

## First Time Setup

1. **Install all dependencies:**
   ```bash
   npm install
   npm run install-all
   ```

2. **Create `.env` file** (copy from `.env.example`):
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env
   
   # On Mac/Linux:
   cp .env.example .env
   ```

3. **Edit `.env`** and set your MongoDB connection:
   ```
   MONGODB_URI=mongodb://localhost:27017/trend-arbitrage
   ```

4. **Make sure MongoDB is running** (if using local MongoDB)

## Running the Application

### Option 1: Run Both Together (Easiest) ⭐

From the **root directory**:
```bash
npm run dev
```

This will start:
- **Backend** on `http://localhost:5000`
- **Frontend** on `http://localhost:3000`

---

### Option 2: Run Separately (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

---

### Option 3: Production Mode

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run build
# Then serve the build folder with a static server
```

---

## Access the App

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **API Trends**: http://localhost:5000/api/trends

---

## Troubleshooting

**Port already in use?**
- Change `PORT=5000` in `.env` for backend
- React will prompt to use a different port for frontend

**MongoDB connection error?**
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- Try: `mongodb://127.0.0.1:27017/trend-arbitrage`

**Dependencies not installed?**
```bash
npm run install-all
```
