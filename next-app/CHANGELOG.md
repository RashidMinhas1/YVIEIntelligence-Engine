# Changelog

## [Unreleased]
- **Added**: Upgraded the Script Prompt Generator into an Intelligent Story Beat Engine with Smart Parsing, 30-field strict JSON generation, Theme Inheritance, and advanced Export/Copy logic.
- **Added**: Professional UI overhaul for the AI Settings page (`/settings`). Added provider icons, active state badges, and an interactive "Unsaved Changes" warning alert.
- **Added**: "Reset Changes" and "Cancel" buttons to the settings page to cleanly revert modified provider fields to their last saved state.
- **Added**: AI Settings page (`/settings`) to configure active providers and models at runtime.
- **Added**: Dynamic API settings persistence utilizing `.ai-settings.json` to override `.env.local`.
- **Added**: OpenRouter AI provider implementation (`OpenRouterProvider`) to support all OpenRouter models.
- **Added**: Configuration via `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, and `OPENROUTER_MODEL`.
- **Added**: Fallback mock returns for `/api/stats/dashboard` and `/api/library/title-formats` to gracefully handle offline local Postgres DB during local development.
- **Fixed**: UI and API exception handling for Gemini AI Quota limits (returning 429 and triggering alerts).

## Milestone 15: AI Research & Intelligence Workspace
- Added unified Research Workspace inside Studio Assistant Panel.
- Added Global Research Notebook and Source Management.
- Implemented Smart Search, Collections, and Auto Save.
- Implemented background AI Jobs for Summarize Source and Generate Ideas.
- Added Universal Library integration for saving research notes.

## Milestone 16: AI Storyboard & Timeline Engine
- Added unified Storyboard Panel with Grid and Timeline views.
- Upgraded ScriptSection model to support 16 new visual and structural fields.
- Integrated real-time Auto Duration calculation with adjustable WPM.
- Added AI Timeline Analysis to the Assistant Panel.
- Added AI Scene Generation jobs to rewrite and improve visual scripting.
- Added seamless toggle between Script Editor and Storyboard modes.
