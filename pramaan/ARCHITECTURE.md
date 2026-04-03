# ET Nucleus - System Architecture

## Overview

ET Nucleus is an AI-powered personalized news platform that transforms one-size-fits-all business news into persona-aware, contextualized content. The system uses adaptive questionnaires, AI-driven persona management, and multi-article synthesis to deliver relevant insights.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌─────────────────────┐        ┌──────────────────────────┐  │
│  │   Home Page         │        │   Dashboard              │  │
│  │                     │        │                          │  │
│  │  1. Name Input      │        │  🌟 SYNTHESIS HERO ⭐    │  │
│  │  2. Smart Q (3 Qs)  │───────▶│   - Large input field    │  │
│  │  3. Intent Input    │        │   - Example queries      │  │
│  │  4. Submit          │        │   - Rich results         │  │
│  │                     │        │                          │  │
│  │  • Progressive      │        │  📰 Compact Articles     │  │
│  │  • Adaptive Q2      │        │   - Personalized         │  │
│  │  • Auto-advance     │        │   - Relevance-scored     │  │
│  └─────────────────────┘        │                          │  │
│                                 │  👤 Profile Mini-Card    │  │
│                                 │   - Stats only           │  │
│                                 └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                       │
│                     http://localhost:3001                        │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Persona Routes  │  │  Nucleus Routes  │  │  Intent Routes  │
│  /api/persona    │  │  /api/nucleus    │  │  /api/intent    │
└──────────────────┘  └──────────────────┘  └─────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
│                                                                  │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Persona        │  │ Personalization │  │  Synthesis      │ │
│  │ Manager        │  │ Engine          │  │  Engine         │ │
│  │                │  │                 │  │                 │ │
│  │ • Create       │  │ • Headline      │  │ • Multi-article │ │
│  │ • Classify     │  │   rewriting     │  │   analysis      │ │
│  │ • Evolve       │  │ • Relevance     │  │ • Unified       │ │
│  │ • Track        │  │   scoring       │  │   briefing      │ │
│  │                │  │ • Why matters   │  │ • Key insights  │ │
│  └────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│  SQLite DB       │  │        Groq AI API                   │
│  (pramaan.db)    │  │        (Llama 3-70B)                │
│                  │  │                                      │
│  Tables:         │  │  AI Operations:                      │
│  • personas      │  │  • Intent classification             │
│  • interactions  │  │  • Persona mapping (Q answers → type)│
│  • evolution     │  │  • Headline rewriting (by level)     │
│                  │  │  • "Why matters" generation          │
│  Schema:         │  │  • Multi-article synthesis           │
│  user_id (PK)    │  │  • Hindi translation                 │
│  user_type       │  │                                      │
│  knowledge_level │  │  Model: llama3-70b-8192              │
│  context         │  │  Speed: ~1-3 seconds per request     │
│  interaction_ct  │  │  Cost: Free tier (30 req/min)        │
└──────────────────┘  └──────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend (React + Vite)

#### Home Page (`NucleusHome.jsx`)
**Purpose:** User onboarding and persona creation

**Components:**
- **PersonaQuestionnaire** - Smart 3-question flow
  - Q1: Interest area (Investing/Business/Startups/Economy/Learning)
  - Q2: Adaptive based on Q1 (5 different question sets)
  - Q3: Content preference (Summary/Detail/Data/Simple)

- **Progressive UI:**
  - Progress indicator (● ● ○)
  - Auto-advance on selection
  - Back button for corrections
  - Smooth transitions (fade + slide)

- **Name Input:** Only for new users (returning users see "Welcome back!")

- **Intent Input:** Free-form text describing what brings them to ET

**Data Flow:**
```javascript
User Answers → PersonaQuestionnaire.computePersona() →
{
  user_type: 'first_time_investor',
  knowledge_level: 'beginner',
  content_preference: 'simplified',
  interest_area: 'investing',
  focus: 'just_starting'
}
→ POST /api/persona/create → Navigate to Dashboard
```

#### Dashboard (`NucleusDashboard.jsx`)
**Purpose:** Personalized content consumption

**Layout Structure:**
```
1. Header (Logo, Language toggle)
2. Demo notice (yellow banner)
3. 🌟 SYNTHESIS HERO (Full width, 40% height)
   - Large input field (prominent)
   - Example queries (clickable)
   - Rich result display (expandable)
4. Two-column layout:
   - Articles (66%) - Compact cards
   - Profile (33%) - Mini-card with stats
```

**Key Features:**
- **Synthesis Input:** Large, can't-miss-it design
- **Article Cards:** Compact with relevance borders
  - Cyan border = 9-10/10 relevance
  - Blue border = 7-8/10 relevance
  - Gray border = <7/10 relevance
- **Profile Stats:** Name, type, level, interaction count

---

### 2. Backend (Node.js + Express)

#### API Structure

**Persona Routes** (`/api/persona`)
```javascript
POST /create
  Input: { userInput, userId? }
  Process:
    1. Analyze intent with Groq AI
    2. Classify user type from questionnaire data
    3. Create/update persona in DB
    4. Return persona + intent
  Output: { persona, intent, is_new }

GET /:userId
  Input: userId (URL param)
  Process: Query SQLite for persona
  Output: { success, persona }

POST /:userId/interaction
  Input: { type, data }
  Process:
    1. Record interaction
    2. Increment count
    3. Check if knowledge level should upgrade
  Output: { success, upgraded?, persona }
```

**Nucleus Routes** (`/api/nucleus`)
```javascript
POST /personalized-feed
  Input: { user_type, intent, userInput }
  Process:
    1. Fetch 8 demo articles
    2. For each article:
       - Rewrite headline for user's knowledge level
       - Generate "why_relevant" explanation
       - Score relevance (0-10)
       - Personalize lead paragraph
       - Generate action item
    3. Sort by relevance
  Output: { articles: [...] }

POST /synthesize  ⭐ STAR FEATURE
  Input: { topic, user_type, context }
  Process:
    1. Identify relevant articles (6-8)
    2. Extract key information from each
    3. AI synthesizes unified briefing
    4. Generate title + summary
    5. Extract key insights
  Output: {
    briefing_title,
    summary,
    key_insights: [],
    article_count
  }

POST /translate
  Input: { text, target: 'hindi' }
  Process: AI translation with context preservation
  Output: { translated_text }
```

---

### 3. Data Layer (SQLite)

#### Database Schema

**personas Table:**
```sql
CREATE TABLE personas (
  user_id TEXT PRIMARY KEY,
  user_name TEXT,
  user_type TEXT,           -- first_time_investor, day_trader, etc.
  knowledge_level TEXT,     -- beginner, intermediate, advanced, expert
  interest_area TEXT,       -- investing, business, startups, economy, learning
  focus TEXT,               -- specific focus within interest area
  content_preference TEXT,  -- summary, detailed, data_driven, simplified
  context TEXT,             -- JSON string of additional context
  interaction_count INTEGER DEFAULT 0,
  articles_read TEXT,       -- JSON array of article IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Evolution Logic:**
- Beginner → Intermediate: 10+ interactions
- Intermediate → Advanced: 25+ interactions
- Advanced → Expert: 50+ interactions

---

### 4. AI Integration (Groq)

#### Model Configuration
```javascript
const GROQ_CONFIG = {
  model: 'llama3-70b-8192',
  temperature: 0.7,
  max_tokens: 1024,
  top_p: 1
};
```

#### AI Operations

**1. Intent Analysis**
```javascript
Prompt: "Analyze this user input: '{userInput}'"
Output: {
  category: 'investment_query',
  sentiment: 'curious',
  topics: ['mutual funds', 'stocks'],
  urgency: 'high'
}
```

**2. Headline Rewriting**
```javascript
Prompt: "Rewrite this headline for a {knowledge_level} {user_type}:
Original: 'RBI hikes repo rate by 25 bps'
User Context: {context}"

Outputs:
- Beginner: "RBI increases interest rates - What it means for your savings"
- Expert: "RBI repo rate +25bps: Implications for bond markets and FII flows"
```

**3. Multi-Article Synthesis** ⭐
```javascript
Prompt: "Synthesize insights from these {n} articles about '{topic}':
[Article 1 summary]
[Article 2 summary]
...
Create unified briefing for {user_type} with {content_preference}"

Output:
{
  title: "Understanding Mutual Funds: A Comprehensive Guide",
  summary: "3-4 paragraph unified explanation...",
  key_insights: [
    { title: "...", description: "..." }
  ]
}
```

**4. "Why This Matters" Generation**
```javascript
Prompt: "Explain why this article matters to:
User Type: {user_type}
Context: {user_context}
Article: {article_title}
User Goal: {user_goal}"

Output: "This article is relevant because you mentioned wanting to invest ₹5 lakhs. Mutual funds, discussed here, are a beginner-friendly option..."
```

---

## Error Handling & Resilience

### Frontend Error Handling
```javascript
try {
  // API call
} catch (err) {
  console.error('API failed:', err);
  setError('User-friendly message');
  // Fallback: Show demo data or cached content
}
```

### Backend Error Handling
```javascript
// Global error middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    error: err.message,
    fallback: 'demo_data'
  });
});
```

### AI API Failures
```javascript
if (GROQ_API_KEY_MISSING) {
  // Fallback to rule-based classification
  return ruleBasedPersona(userInput);
}

if (GROQ_RATE_LIMIT) {
  // Queue request or use cached response
  return getCachedOrQueue(request);
}
```

### Database Errors
```javascript
if (DB_ERROR) {
  // Create in-memory temporary persona
  return createTempPersona(userData);
}
```

---

## Data Flow: End-to-End

### New User Journey

```
1. User visits /nucleus
   ↓
2. PersonaQuestionnaire renders
   ↓
3. User answers Q1 (interest area)
   ↓ [Auto-advance]
4. Q2 adapts based on Q1 answer
   ↓ [Auto-advance]
5. Q3 (content preference)
   ↓ [Auto-advance → compute persona]
6. User enters name
   ↓
7. User describes intent
   ↓ [Submit]
8. POST /api/persona/create
   {
     userInput: "I have 5L to invest",
     userId: null,
     questionnaireData: {
       user_type: 'first_time_investor',
       knowledge_level: 'beginner',
       interest_area: 'investing',
       focus: 'just_starting',
       content_preference: 'simplified'
     }
   }
   ↓
9. Backend:
   - Analyzes intent with Groq
   - Creates persona in SQLite
   - Returns persona + intent
   ↓
10. Navigate to /nucleus/dashboard with state
   ↓
11. Dashboard loads personalized feed
   POST /api/nucleus/personalized-feed
   {
     user_type: 'first_time_investor',
     intent: { category: 'investment_query', ... },
     userInput: "I have 5L to invest"
   }
   ↓
12. Backend:
   - Fetches 8 demo articles
   - For each: AI rewrites headline, generates why_relevant
   - Scores relevance (0-10)
   - Returns personalized articles
   ↓
13. Dashboard renders:
   - Synthesis hero (prominent, top)
   - 6 compact article cards (sorted by relevance)
   - Profile mini-card (sidebar)
```

### Synthesis Flow

```
1. User enters query: "Should I invest in mutual funds?"
   ↓
2. POST /api/nucleus/synthesize
   {
     topic: "mutual funds investment",
     user_type: 'first_time_investor',
     context: "beginner, wants to invest 5L"
   }
   ↓
3. Backend:
   - Identifies 6 relevant articles
   - Extracts key info from each
   - Sends to Groq: "Synthesize these 6 articles..."
   ↓
4. Groq AI:
   - Analyzes all articles
   - Finds common themes
   - Generates unified briefing
   - Adapts language for beginner
   ↓
5. Returns:
   {
     briefing_title: "Mutual Funds: A Beginner's Investment Guide",
     summary: "Mutual funds pool money from multiple investors...",
     key_insights: [
       { title: "Low Risk for Beginners", desc: "..." },
       { title: "Diversification Benefits", desc: "..." }
     ],
     article_count: 6
   }
   ↓
6. Dashboard displays rich synthesis result
```

---

## Performance Optimizations

### Frontend
- **Code splitting:** Route-based chunks
- **Lazy loading:** Components load on demand
- **Caching:** LocalStorage for persona data
- **Debouncing:** Search inputs (300ms delay)

### Backend
- **Connection pooling:** Reuse DB connections
- **Response caching:** Cache AI responses (5 min TTL)
- **Batch processing:** Group similar requests
- **Compression:** gzip responses

### Database
- **Indexes:** On user_id, user_type, knowledge_level
- **Prepared statements:** Faster queries
- **Minimal joins:** Denormalized for speed

---

## Security Considerations

### Current (Demo Mode)
- ✅ CORS restricted to localhost
- ✅ API keys in .env (not committed)
- ✅ Input sanitization
- ✅ SQLite injection prevention (prepared statements)
- ❌ No authentication (demo)
- ❌ No rate limiting (demo)

### Production TODO
- Implement JWT authentication
- Add rate limiting (express-rate-limit)
- Use PostgreSQL (not SQLite)
- Enable HTTPS
- API key rotation
- Content Security Policy headers
- XSS protection
- CSRF tokens

---

## Monitoring & Logging

### Current Logging
```javascript
console.log('[Persona] Created:', persona.user_type);
console.log('[AI] Synthesis took:', duration);
console.error('[Error]', error.message);
```

### Production Monitoring Needs
- APM tool (New Relic, Datadog)
- Error tracking (Sentry)
- Performance metrics
- API latency tracking
- AI token usage monitoring
- User behavior analytics

---

## Scalability Considerations

### Current Limitations
- SQLite (single-file, local)
- No caching layer
- Single server
- No load balancing

### Scaling Strategy
1. **Database:** SQLite → PostgreSQL with read replicas
2. **Caching:** Add Redis for:
   - AI response caching
   - Session management
   - Rate limiting
3. **API:** Horizontal scaling with load balancer
4. **AI:** Queue system for batch processing
5. **CDN:** Static assets on CloudFront/Cloudflare

---

## Technology Choices & Rationale

| Technology | Reason |
|------------|--------|
| **React** | Component reusability, huge ecosystem |
| **Vite** | Fast build times, modern tooling |
| **TailwindCSS** | Rapid UI development, consistent design |
| **Express** | Minimal, flexible, well-documented |
| **SQLite** | Zero-config, perfect for demo/MVP |
| **Groq** | Fastest AI inference, free tier generous |
| **Llama 3-70B** | Best balance of speed + quality |

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────┐
│                   CloudFront CDN                │
│              (Static assets + caching)          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              AWS Application Load Balancer       │
└─────────────────────────────────────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────┐        ┌──────────────────┐
│  Frontend (S3)   │        │  Backend (ECS)   │
│  React SPA       │        │  Node.js API     │
│  Static hosting  │        │  Auto-scaling    │
└──────────────────┘        └──────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │PostgreSQL│    │  Redis   │    │ Groq API │
              │   RDS    │    │ ElastiC. │    │ External │
              └──────────┘    └──────────┘    └──────────┘
```

---

## Summary

ET Nucleus uses a **3-tier architecture** with clear separation of concerns:

1. **Presentation Layer** (React): Smart UI with adaptive questionnaire and synthesis-first design
2. **Business Logic Layer** (Express): Persona management, personalization engine, synthesis engine
3. **Data Layer** (SQLite + Groq AI): Persistent storage + AI intelligence

**Key Innovation:** Making synthesis the hero feature (not buried in sidebar) and using adaptive questionnaires (not boring dropdowns) for better persona classification.

**Scalability:** Current design supports demo/MVP; clear path to production scale with database migration, caching layer, and horizontal scaling.
