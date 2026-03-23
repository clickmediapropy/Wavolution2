# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Message Hub (wavolution2) — a Flask web app for managing WhatsApp bulk messaging campaigns via the Evolution API. Multi-user system with auth, contact management, CSV import, media attachments, and real-time campaign progress tracking.

## Commands

```bash
# Setup
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then edit with real values

# Run (development)
python run.py                    # starts on 0.0.0.0:5001, debug mode
./start_development.sh           # creates venv, installs deps, runs

# Run (production)
./start_production.sh            # gunicorn on :5000 with 4 workers

# Database
python migrate.py                # backup + migration status check
python -c "from migrations.migrate_database import migrate_database; migrate_database('whatsapp.db')"  # run actual migration

# Tests
python -m pytest                         # all tests
python -m pytest tests/test_services.py  # single file
python -m pytest --cov=app               # with coverage
```

## Architecture

### Application Factory Pattern
`app/__init__.py` → `create_app()` builds the Flask app: loads config, registers 5 blueprints, sets up logging, error handlers, context processors, and security headers.

### Layered Structure
```
Routes (blueprints) → Services (business logic) → Models (raw SQL via DatabaseManager)
```

- **Routes** handle HTTP, call services, render Jinja2 templates
- **Services** contain all business logic; instantiated per-request via `get_services()` helper in each route file
- **Models** are thin wrappers around direct SQLite queries (no ORM)

### Blueprint URL Mapping
| Blueprint | Prefix | File |
|-----------|--------|------|
| `auth_bp` | `/auth` | `app/routes/auth.py` |
| `main_bp` | `/` | `app/routes/main.py` |
| `contacts_bp` | `/contacts` | `app/routes/contacts.py` |
| `campaigns_bp` | `/campaigns` | `app/routes/campaigns.py` |
| `api_bp` | `/api` | `app/routes/api.py` |

### Service Layer
| Service | Responsibility |
|---------|---------------|
| `AuthService` | Registration (creates Evolution API instance per user), login, sessions, password reset, PBKDF2 hashing |
| `WhatsAppService` | Wraps Evolution API HTTP calls: QR code, connection status, send text/media/multi-media |
| `ContactService` | CRUD, CSV import, pagination, stats, campaign contact selection |
| `CampaignService` | Queue-based bulk sending with background `threading.Thread` worker, campaign progress tracking, personalization (`{name}`, `{phone}`) |
| `EmailService` | SMTP-based password reset emails |

### Database
- **SQLite** via raw `sqlite3` — no ORM
- `DatabaseManager` provides `get_connection()` context manager, `execute_query()`, `execute_update()`, `execute_insert()`
- Tables: `app_users`, `contacts` (unique on `user_id, phone`), `messages`, `user_sessions`, `password_reset_tokens`
- DB file defaults to `whatsapp.db` at project root (configurable via `DB_PATH` env var)
- Migrations in `migrations/migrate_database.py` — safe migration with backup, creates missing tables, adds constraints

### Auth Flow
Session-based auth stored in Flask `session`. Decorators in `app/utils/auth.py`:
- `@login_required` — redirects to login if no session
- `@anonymous_required` — redirects to dashboard if already logged in
- `@whatsapp_setup_required` — enforces WhatsApp instance creation + QR connection before access
- `get_current_user()` — recreates `DatabaseManager`/`AuthService` from `current_app.config` each call

### Campaign Worker
`CampaignService._background_worker()` runs as a daemon thread, pulls from `queue.Queue`, sends messages with configurable delay. Campaign state tracked in-memory via `self.campaign_status` dict (not persisted — lost on restart).

### Evolution API Integration
Each user gets their own Evolution API instance (created at registration). The app talks to Evolution API for:
- `POST /instance/create` — user registration
- `GET /instance/connect/{name}` — QR code
- `GET /instance/connectionState/{name}` — status check
- `POST /message/sendText/{name}` — text messages
- `POST /message/sendMedia/{name}` — media messages
- `DELETE /instance/delete/{name}` — cleanup

Auth uses either the user's per-instance API key or the global key as fallback.

### Config
Three configs in `app/config.py`: `DevelopmentConfig`, `ProductionConfig`, `TestingConfig`. Selected by `FLASK_ENV` env var. Key env vars: `EVOLUTION_API_URL`, `EVOLUTION_GLOBAL_KEY`, `SECRET_KEY`, `DB_PATH`.

### Frontend
Server-rendered Jinja2 templates in `templates/`. Uses Bootstrap via CDN. No build step or JS bundler. Templates extend `base_simple.html`.

### `references/` Directory
Contains a full clone of `evolution-api` source for reference — do not modify.
