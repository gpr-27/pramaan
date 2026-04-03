# ET Nucleus - AI-Powered Personalized News Platform

> Intelligence-First Business News - News that adapts to you

[![Demo](https://img.shields.io/badge/Demo-Live-green)](http://localhost:5174)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd pramaan
cd backend && npm install
cd ../frontend && npm install

# 2. Add Groq API key to .env file in project root
echo "GROQ_API_KEY=your_key_here" > ../.env
echo "PORT=3001" >> ../.env

# 3. Start backend (Terminal 1)
cd backend && npm start

# 4. Start frontend (Terminal 2)
cd frontend && npm run dev

# 5. Open http://localhost:5174/nucleus
```

---

## 🎯 Problem Statement

Financial news is one-size-fits-all. A first-time investor with ₹5 lakhs and a day trader both see:
- Same headlines (filled with jargon)
- Same content (no context for their situation)
- Same complexity (overwhelming for beginners, basic for experts)

**Result:** News consumers spend hours sifting through irrelevant content, struggling to understand what matters to them.

---

## 💡 Solution: ET Nucleus

ET Nucleus uses AI to create a **persona-aware news experience** that adapts to each user's:
- **Investment experience** (Beginner to Expert)
- **Goals** (Learning, Investing, Trading)
- **Content preferences** (Summaries, Deep-dives, Data-driven)

### Key Features

1. **🧠 Smart Persona Creation**
   - Adaptive 3-question questionnaire (not boring dropdowns!)
   - Automatically classifies users by experience and goals
   - Evolves knowledge level based on interactions

2. **📊 Synthesis-First Design** ⭐ **STAR FEATURE**
   - Ask any financial question
   - Get unified insights synthesized from multiple articles
   - One coherent answer instead of 10 separate articles

3. **📰 Personalized Article Feed**
   - Headlines rewritten for user's knowledge level
   - "Why This Matters to You" explanations in personal context
   - Relevance scoring with visual indicators
   - Action items tailored to user goals

4. **🌍 Vernacular Support**
   - Hindi translations with context preservation
   - Maintains personalization in both languages

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + Vite
- React Router for navigation
- TailwindCSS for styling
- Framer Motion for animations
- Axios for API calls

**Backend:**
- Node.js + Express
- SQLite (Better-SQLite3) for persona storage
- Groq API (Llama 3) for AI inference
- CORS enabled for local development

**AI/ML:**
- Intent Analysis (Groq AI)
- Persona Classification
- Headline Rewriting
- Multi-article Synthesis
- Hindi Translation

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                    │
│  ┌────────────────┐          ┌─────────────────┐   │
│  │  Home Page     │          │   Dashboard     │   │
│  │  - Persona Q   │   ───▶   │  - Synthesis ⭐ │   │
│  │  - Intent      │          │  - Articles     │   │
│  └────────────────┘          └─────────────────┘   │
└─────────────────────────────────────────────────────┘
              │                        │
              ▼                        ▼
┌─────────────────────────────────────────────────────┐
│              Backend API (Node.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Persona    │  │  Intent      │  │ Synthesis │ │
│  │   Manager    │  │  Analyzer    │  │  Engine   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
              │                        │
              ▼                        ▼
┌────────────────────┐      ┌──────────────────────┐
│  SQLite Database   │      │   Groq AI API        │
│  - User Personas   │      │   (Llama 3-70B)      │
│  - Interactions    │      │   - Classification   │
│  - Evolution       │      │   - Rewriting        │
└────────────────────┘      │   - Synthesis        │
                            └──────────────────────┘
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Groq API Key** (free at https://console.groq.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pramaan
   ```

2. **Install dependencies**

   Backend:
   ```bash
   cd backend
   npm install
   ```

   Frontend:
   ```bash
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**

   Create `.env` file in project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3001
   UPLOAD_DIR=./uploads
   ```

   **Get your Groq API key:**
   - Visit https://console.groq.com
   - Sign up (free)
   - Generate API key from dashboard
   - Copy key to `.env` file

4. **Initialize database**
   ```bash
   cd backend
   npm start
   ```

   Database (`pramaan.db`) will be created automatically on first run.

5. **Start the application**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm start
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173 or http://localhost:5174
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

---

## 📖 Usage Guide

### First-Time User Flow

1. **Visit Home Page**: http://localhost:5173/nucleus

2. **Smart Questionnaire** (replaces boring dropdowns!)
   - Q1: What brings you to Economic Times today?
     - Markets & Investing / Business News / Startups & Tech / Economy & Policy / General Learning

   - Q2: (Adaptive based on Q1)
     - If Investing → How familiar are you? (Just Starting / Some Experience / Experienced / Active Trader)
     - If Business → What's your focus? (Industry Trends / Company News / Entrepreneur / Career)
     - If Startups → What interests you? (Funding / Tech Innovations / Unicorns / Ecosystem)
     - If Economy → What do you track? (Macro / Policy / RBI & Banking / Market Impact)
     - If Learning → What to learn? (Business Basics / Investing 101 / Economy Basics / Everything)

   - Q3: How do you like your news?
     - Get to Point / Deep Dives / Show Data / Simple Language

3. **Enter your name** (if new user)

4. **Describe what brings you to ET today**
   - Example: "I have ₹5 lakhs to invest, where should I start?"

5. **Click "Get Your Personalized News"**

### Dashboard Experience

**🌟 Synthesis Hero Section** (Top - Can't miss it!)
- Large input field: Ask any financial question
- Example queries provided
- Rich synthesis results with insights
- Source articles linked

**📰 Compact Articles** (Below, supporting)
- 6 relevant articles shown
- Compact cards with:
  - Personalized headlines
  - Relevance scores (visual colored borders)
  - "Why This Matters" explanations
  - Shortened previews
- Click to expand full article

**👤 Profile Mini-Card** (Sidebar)
- Your name and persona type
- Knowledge level progress bar
- Interaction count
- Articles read

### Key Features to Try

1. **Synthesis** ⭐
   - Type: "Should I invest in mutual funds or stocks?"
   - Get unified answer synthesized from multiple sources

2. **Personalized Headlines**
   - Notice how headlines are rewritten for your level
   - Beginners get simplified language
   - Experts get technical details

3. **Relevance Borders**
   - Cyan border = Highly relevant (9-10/10)
   - Blue border = Moderately relevant (7-8/10)
   - Gray border = Less relevant (below 7/10)

4. **"Why This Matters"**
   - Every article explains relevance to YOUR situation
   - Not generic - specific to your goals and experience

5. **Persona Evolution**
   - As you read more articles, your knowledge level increases
   - Beginner → Intermediate → Advanced → Expert
   - Feed adapts automatically

---

## 📁 Project Structure

```
pramaan/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main server
│   │   ├── routes/
│   │   │   ├── persona.js        # Persona management
│   │   │   ├── nucleus.js        # News personalization
│   │   │   └── intent.js         # Intent analysis
│   │   └── db/
│   │       └── database.js       # SQLite operations
│   ├── pramaan.db                # SQLite database
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PersonaQuestionnaire.jsx   # Smart questionnaire
│   │   │   ├── QuestionCard.jsx           # Question option cards
│   │   │   └── ProgressIndicator.jsx      # Progress dots
│   │   ├── pages/
│   │   │   ├── NucleusHome.jsx            # Home/onboarding
│   │   │   └── NucleusDashboard.jsx       # Main dashboard
│   │   └── App.jsx
│   └── package.json
│
├── .env                          # Environment variables
├── README.md                     # This file
├── ARCHITECTURE.md               # System architecture
└── IMPACT_MODEL.md              # Business impact analysis
```

---

## 🔧 API Endpoints

### Persona Management

**Create/Update Persona**
```http
POST /api/persona/create
Content-Type: application/json

{
  "userInput": "I have 5 lakhs to invest",
  "userId": "optional-existing-user-id"
}

Response:
{
  "persona": { user_id, user_type, knowledge_level, ... },
  "intent": { category, sentiment, topics, ... },
  "is_new": true/false
}
```

**Get Persona**
```http
GET /api/persona/:userId

Response:
{
  "success": true,
  "persona": { ... }
}
```

**Record Interaction**
```http
POST /api/persona/:userId/interaction
{
  "type": "article_read",
  "data": { article_id, title, ... }
}
```

### News Personalization

**Get Personalized Feed**
```http
POST /api/nucleus/personalized-feed
{
  "user_type": "first_time_investor",
  "intent": { ... },
  "userInput": "investment query"
}

Response:
{
  "articles": [
    {
      "id": "...",
      "personalized_headline": "...",
      "why_relevant": "...",
      "relevance_score": 9.5,
      ...
    }
  ]
}
```

**Synthesize Topic**
```http
POST /api/nucleus/synthesize
{
  "topic": "mutual funds",
  "user_type": "first_time_investor",
  "context": "..."
}

Response:
{
  "briefing_title": "...",
  "summary": "...",
  "article_count": 6
}
```

---

## 🎨 Design Highlights

### Modern UI/UX
- **Glassmorphism** - Frosted glass effects with backdrop blur
- **Cyan/Purple gradient** color scheme (cool & professional)
- **Micro-interactions** - Smooth hover effects, transitions
- **Visual hierarchy** - Synthesis hero → Articles → Profile
- **Responsive design** - Works on all screen sizes

### Accessibility
- High contrast text/background
- Focus states on all interactive elements
- Keyboard navigation support
- Screen reader friendly

---

## 🧪 Testing

### Manual Testing Scenarios

1. **New User Journey**
   - Clear localStorage: `localStorage.clear()`
   - Complete questionnaire
   - Verify persona creation
   - Check dashboard personalization

2. **Returning User Journey**
   - Revisit with existing persona
   - Verify "Welcome back" message
   - Check knowledge level evolution

3. **Synthesis Feature**
   - Try: "Mutual funds vs stocks"
   - Verify unified briefing
   - Check source article links

4. **Persona Types**
   - Test all 4 experience levels
   - Verify different article personalization
   - Compare headline complexity

### API Health Check
```bash
curl http://localhost:3001/health
# Response: {"status":"ok","version":"1.0.0"}
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is available
lsof -ti:3001
# If occupied, kill process:
kill -9 $(lsof -ti:3001)
```

### Frontend shows CORS error
- Ensure backend is running on port 3001
- Frontend expects backend at `http://localhost:3001`
- Check `.env` file has correct PORT

### "Failed to create persona"
- Verify `GROQ_API_KEY` is set in `.env`
- Check Groq API quota: https://console.groq.com
- View backend logs for detailed error

### Database errors
```bash
# Reset database (WARNING: Deletes all data)
cd backend
rm pramaan.db
npm start  # Will recreate fresh database
```

---

## 📊 Performance

- **Persona Creation**: ~2-3 seconds (AI classification)
- **Article Personalization**: ~3-5 seconds (8 articles)
- **Synthesis**: ~4-6 seconds (multi-article analysis)
- **Dashboard Load**: <1 second (cached data)

**Optimization:**
- SQLite for fast local queries
- Groq AI for sub-second inference
- Frontend caching of persona data
- Lazy loading of article content

---

## 🔐 Security Considerations

- API keys stored in `.env` (not committed to git)
- SQLite database local-only (no external exposure)
- Input sanitization on all user inputs
- No user authentication (demo mode)
- CORS restricted to localhost

**Production TODO:**
- Add user authentication
- Use PostgreSQL instead of SQLite
- Implement rate limiting
- Add API key rotation
- Enable HTTPS

---

## 🚀 Future Enhancements

1. **Live News Integration**
   - Connect to Economic Times API
   - Real-time article fetching
   - News alerts based on user interests

2. **Advanced Features**
   - Bookmarking articles
   - Custom topic tracking
   - Email digests
   - Mobile app (React Native)

3. **Social Features**
   - Share insights
   - Follow topics
   - Collaborate on analysis

4. **Enhanced AI**
   - Better persona evolution
   - Sentiment analysis
   - Market prediction insights

---

## 📝 License

MIT License - See LICENSE file

---

## 👥 Team

Built for Economic Times AI Hackathon 2026

---

## 🙏 Acknowledgments

- **Groq** - Fast AI inference
- **Economic Times** - News content inspiration
- **React + Vite** - Modern frontend tooling
- **TailwindCSS** - Rapid UI development

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**⭐ Star this repo if you find it useful!**
