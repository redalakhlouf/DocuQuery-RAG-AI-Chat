<p align="center">
  <img src="DocuQuery.png" alt="DocuQuery" width="600">
</p>

<h1 align="center">DocuQuery</h1>

<p align="center">
  <em>Chat with your documents. Upload a PDF, ask questions, get answers with page citations.</em>
</p>

<p align="center">
  <a href="https://docuquery.dev"><img src="https://img.shields.io/badge/Live_Demo-docuquery.dev-00C853?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/redalakhlouf/RAG_PROJET"><img src="https://img.shields.io/badge/Source_Code-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Groq-FF6B00?style=for-the-badge&logoColor=white" alt="Groq">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" alt="Azure">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <a href="demo/docuquery.demo.mp4">
    <img src="DocuQuery.png" alt="DocuQuery Demo — Click to watch" width="700">
  </a>
</p>
<p align="center"><em>👆 Click the image to watch the demo video</em></p>

---

## What is DocuQuery?

DocuQuery is a multi-user RAG (Retrieval-Augmented Generation) SaaS platform. Each user creates an account, uploads their own PDF documents, and chats with an AI assistant that answers questions based on the content of their documents.

**Key capabilities:**
- Secure user authentication (email/password + Google OAuth)
- PDF upload with automatic text extraction and indexing
- Vector-based semantic search across document content
- AI-powered answers with page-level source citations
- Strict data isolation between users (Row Level Security)

---

## Demo

| File | Description |
|------|-------------|
| [`demo/docuquery.demo.mp4`](demo/docuquery.demo.mp4) | Video walkthrough of DocuQuery |
| [`demo/herman-melville-moby-dick.pdf`](demo/herman-melville-moby-dick.pdf) | Sample PDF for testing (Moby Dick, 1.47 MB) |

---

## Architecture

```
User (browser)
      │
      │  HTTPS
      ▼
┌─────────────────────┐
│     Frontend        │   Vercel
│     Next.js         │
│     Tailwind CSS    │
└────────┬────────────┘
         │  REST API
         ▼
┌─────────────────────┐
│     Backend         │   Azure Container Apps
│     FastAPI         │
│     Docker          │
│                     │
│  ┌───────────────┐  │
│  │ sentence-     │  │   Embedding model
│  │ transformers  │  │   multilingual-e5-small
│  │ (384 dim)     │  │   ~300 MB RAM
│  └───────────────┘  │
└──┬──────┬───────┬───┘
   │      │       │
   ▼      ▼       ▼
┌──────┐ ┌────────┐ ┌──────────┐
│Supa- │ │Supabase│ │  Groq    │
│base  │ │DB +    │ │  API     │
│Auth  │ │Storage │ │  (LLM)  │
│      │ │+ pgvec │ │          │
│JWT   │ │tor     │ │ LLaMA 3  │
└──────┘ └────────┘ └──────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Backend** | FastAPI, Python 3.11, Uvicorn |
| **Database** | PostgreSQL (Supabase) + pgvector |
| **Auth** | Supabase Auth (email/password, Google OAuth) |
| **Storage** | Supabase Storage |
| **Embeddings** | sentence-transformers (`multilingual-e5-small`, 384 dim) |
| **LLM** | Groq API (LLaMA 3.1 8B) |
| **Containerization** | Docker, Docker Compose |
| **Deployment** | Vercel (frontend), Azure Container Apps (backend) |
| **Domain** | docuquery.dev |

---

## How It Works

### Upload Pipeline
1. User uploads a PDF (max 5 MB)
2. Backend validates file type (MIME sniffing via python-magic) and size
3. File is stored in Supabase Storage under `{user_id}/{document_id}.pdf`
4. Text is extracted page-by-page using PyMuPDF
5. Text is split into chunks (~500 words, 50-word overlap)
6. Embeddings are generated for each chunk (multilingual-e5-small, 384 dimensions)
7. Chunks + embeddings are stored in PostgreSQL with pgvector
8. Document status updates: `pending` → `processing` → `ready`

### Chat Pipeline
1. User asks a question
2. Backend verifies JWT token + checks daily quota (30 questions/day)
3. Question is converted to an embedding (same model)
4. pgvector finds the 5 most similar chunks (cosine distance), filtered by user and document
5. Chunks are sent to Groq API (LLaMA 3) with a system prompt
6. LLM generates an answer with page citations
7. Response includes source references (page numbers + similarity scores)

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- A [Supabase](https://supabase.com) project
- A [Groq](https://groq.com) API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/redalakhlouf/RAG_PROJET.git
   cd RAG_PROJET
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and Groq credentials
   ```

3. **Start the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit backend/.env with your credentials
   cd ..
   docker compose up --build
   ```

4. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Environment Variables

**Backend** (`backend/.env`):
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | PostgreSQL connection string (via pgvector) |
| `LLM_API_KEYS` | Groq API key(s), comma-separated for rotation |
| `MAX_FILE_SIZE_MB` | Maximum upload size (default: 5) |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |

**Frontend** (`frontend/.env.local`):
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## Project Structure

```
RAG_PROJET/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, security, database
│   │   ├── routes/         # API endpoints (documents, chat, retrieval)
│   │   ├── services/       # Business logic (upload, embedding, retrieval, chat)
│   │   ├── schemas/        # Pydantic models
│   │   └── main.py         # FastAPI app
│   ├── db/schema.sql       # Database schema + RLS policies
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (auth, theme, language)
│   │   ├── hooks/          # Custom hooks (useUser, useDocumentStatus)
│   │   ├── utils/          # API client, Supabase client
│   │   ├── login/          # Login/signup page
│   │   ├── dashboard/      # Document list
│   │   ├── upload/         # PDF upload page
│   │   └── chat/           # Chat interface
│   ├── locales/            # i18n (en, fr)
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── architecture.md     # Architecture documentation
├── docker-compose.yml
└── .env.example
```

---

## Security

- **Row Level Security (RLS):** Every database table has policies ensuring users can only access their own data
- **JWT Validation:** Every API endpoint verifies the Supabase JWT token
- **Double Filtering:** API queries explicitly filter by `user_id` in addition to RLS
- **MIME Validation:** Uploads are validated by file signature (python-magic), not just extension
- **File Size Limits:** Maximum 5 MB per upload
- **API Key Rotation:** Groq API keys are rotated automatically on rate limit (429)
- **Security Headers:** HSTS, X-Frame-Options, CSP, X-Content-Type-Options

---

## Known Limitations

| Limitation | Impact | Planned for V2 |
|------------|--------|----------------|
| PDF text only (no OCR) | Cannot process scanned documents | Tesseract integration |
| No streaming | Response appears all at once | SSE streaming |
| 1 PDF per user | Single document per conversation | Multi-document support |
| TTL expiration | Documents expire after 1h, conversations after 2h | Configurable retention |
| 30 questions/day | Rate limit per user | Paid tier |
| No CI/CD | Manual deployment | GitHub Actions |
| No automated tests | Manual testing only | pytest + Vitest |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/v1/documents/upload` | Yes | Upload a PDF |
| `GET` | `/api/v1/documents/` | Yes | List user documents |
| `GET` | `/api/v1/documents/{id}/status` | Yes | Check document status |
| `DELETE` | `/api/v1/documents/{id}` | Yes | Delete a document |
| `POST` | `/api/v1/retrieval/search` | Yes | Search document chunks |
| `POST` | `/api/v1/chat/conversations` | Yes | Create a conversation |
| `GET` | `/api/v1/chat/conversations/` | Yes | List conversations |
| `GET` | `/api/v1/chat/conversations/{id}/messages` | Yes | Get conversation messages |
| `POST` | `/api/v1/chat/query` | Yes | Ask a question |

---

## License

This project is for portfolio/demonstration purposes.

---

Built with care by [Reda Lakhlouf](https://github.com/redalakhlouf)
