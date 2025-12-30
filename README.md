# GameTagger Web

A web interface for the GameTagger VGMS classification tool. Analyze video games using multiple sources (Steam, Xbox Store, YouTube) and classify them with 56+ VGMS tags.

## Features

- **Multi-source analysis**: Combines data from Steam, Xbox Store, and YouTube gameplay videos
- **Real-time progress**: WebSocket-based progress tracking during analysis
- **Dashboard**: Visualizations of tag distributions, source success rates, and recent analyses
- **History**: Searchable, filterable history of all analyses with export functionality
- **Responsive UI**: Modern React frontend with Tailwind CSS

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Anthropic API key

### Development

1. **Start the backend:**

```bash
cd web/backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key-here
uvicorn app.main:app --reload --port 8000
```

2. **Start the frontend:**

```bash
cd web/frontend
npm install
npm run dev
```

3. Open http://localhost:5173

### Production (Docker)

```bash
cd web
export ANTHROPIC_API_KEY=your-key-here
docker-compose up app
```

Open http://localhost:8000

## Deployment

### Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Set environment variables:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `SECRET_KEY`: A random secret for session security
4. Railway will auto-deploy using `railway.json`

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Claude API key for analysis |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./data/gametagger.db` | Database connection string |
| `SECRET_KEY` | No | `dev-secret` | Secret key for security |
| `CORS_ORIGINS` | No | `["http://localhost:5173"]` | Allowed CORS origins |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/tag` | POST | Start a new analysis job |
| `GET /api/jobs/{id}` | GET | Get job status |
| `WS /ws/job/{id}` | WebSocket | Real-time progress updates |
| `GET /api/history` | GET | Paginated analysis history |
| `GET /api/analysis/{id}` | GET | Full analysis details |
| `GET /api/stats` | GET | Dashboard statistics |
| `GET /api/health` | GET | Health check |

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, asyncio
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Database**: SQLite (configurable to PostgreSQL)
- **Build**: Vite, Docker

## Project Structure

```
web/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration
│   │   ├── database.py       # Database setup
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Business logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── services/         # API client
│   └── package.json
├── Dockerfile               # Production build
├── docker-compose.yml
└── railway.json             # Railway deployment
```
