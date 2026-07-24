# Local Setup Guide

Welcome to the YouTube Viral Intelligence Engine project. Follow these step-by-step instructions to set up the application for local development.

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18+ (v22 recommended)
- **Git**: For version control
- **npm** or **pnpm**: Package manager

## 2. Missing Services
To run the application locally, you must provide your own instances of the following services:
- **PostgreSQL Database**: A local Postgres instance or a cloud database (like Supabase or Neon).
- **OpenAI Account**: For generating scripts and analyzing titles (requires an active API key).
- **YouTube Data API v3**: For fetching competitor videos (optional but highly recommended; RSS fallback is used if missing).

## 3. Install Dependencies
Navigate into the `next-app` directory and install the required dependencies:
```bash
cd next-app
npm install
```

## 4. Environment Variables Configuration
The project relies on environment variables to connect to your services. 

1. Copy the example environment file to create your local environment file:
```bash
cp .env.example .env.local
```
2. Open `.env.local` and fill in the required values. **Do not use placeholders where real values are required.**

| Variable | Description |
|---|---|
| `PASSWORD` | Set a secure password. This is used to bypass the initial login screen (`/password` route). |
| `DATABASE_URL` | Your PostgreSQL connection string. Must be a valid URL (e.g., `postgresql://user:pass@localhost:5432/yvie`). |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Your OpenAI API Key (starts with `sk-...`). Required for AI generation features. |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Defaults to `https://api.openai.com/v1`. Change only if using an OpenAI-compatible proxy. |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your Supabase project (if you are using Supabase). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project's public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase project's service role key (keep this secret!). |
| `YOUTUBE_API_KEY` | Your YouTube Data API v3 Key. Required to reliably fetch competitor video statistics. |

## 5. Database Initialization
Once your `DATABASE_URL` is configured, push the database schema to your PostgreSQL database. The project uses Drizzle ORM.

Run the following command in the `next-app` directory:
```bash
npm run db:push
```
*Note: This command will automatically create the necessary tables (`videos`, `title_analyses`, `script_analyses`, etc.) in your database.*

## 6. Run the Application
Start the Next.js development server:
```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000). Use the `PASSWORD` you configured in step 4 to log in.
