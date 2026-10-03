<div align="center">

# Vault

**A minimal, high-performance personal cloud vault with direct public asset hosting and TOTP-guarded private partitions.**

Built with **Django** (Python 3.12), **Next.js 14** (TypeScript), and automated TLS via **Caddy**.

---

</div>

## Overview

Vault is designed as a sovereign cloud storage solution combining two distinct partitions:
1. **Public Partition (`/public/`):** Instant, direct asset distribution. Files uploaded here are publicly accessible via clean URLs (`https://api.vault.yourdomain.com/public/<category>/<filename>`) with global CORS headers and HTTP caching, making them suitable for blogs, markdown documents, and web applications.
2. **Protected Partition (`/protected/`):** Encrypted private storage. Files inside this partition strictly require time-based one-time password (TOTP) authorization to stream or download.

Any modifying operation (uploading, renaming, deleting) across **both** partitions strictly requires 6-digit TOTP authentication via Google Authenticator.

---

## Key Features

- **Automated Type Categorization:** Uploaded files are automatically sorted into clean subfolders by file extension:
  - `images/`: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`, `.ico`, `.avif`
  - `pdf/`: `.pdf`
  - `video/`: `.mp4`, `.webm`, `.mkv`, `.mov`, `.avi`, `.wmv`
  - `audio/`: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.aac`
  - `others/`: archives, documents, data
- **Custom In-Flight Renaming:** Specify clean custom names on upload while automatically preserving original file extensions.
- **Drag & Drop Upload:** Seamlessly drop files directly anywhere on the dashboard or modal for instant upload.
- **Sovereign TOTP Security:** Hardware/authenticator-backed security using RFC 6238 TOTP (Google Authenticator) with PyOTP and signed JWT session tokens.
- **Zero-Config TLS:** Native Caddy reverse proxy integration with automated Let's Encrypt certificates.
- **Minimal Footprint:** Standalone Next.js multi-stage Docker build and lightweight Django + Gunicorn backend.

---

## Architecture

```
Internet / Browser / Web Apps
       │
       ▼
 ┌─────────────┐
 │    Caddy    │ (Port 80/443 SSL Termination)
 └──────┬──────┘
        │
        ├── vault.yourdomain.com      ➔ Frontend (Next.js 14 Standalone, Port 3005)
        └── api.vault.yourdomain.com  ➔ Backend (Django + Gunicorn, Port 8005)
                                          ├── /public/*    (Direct Public CDN, No Auth)
                                          ├── /protected/* (TOTP JWT Guarded)
                                          └── /api/*       (TOTP-secured Operations)
```

---

## Quick Start & Deployment

### 1. Prerequisites
- Docker Engine & Docker Compose
- Caddy (either host systemd or containerized)
- A domain with DNS `A` records pointing to your server IP:
  - `vault.yourdomain.com`
  - `api.vault.yourdomain.com`

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SECRET_KEY=generate_a_random_secret_key_here
DEBUG=False
ALLOWED_HOSTS=api.vault.yourdomain.com,vault.yourdomain.com,localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=https://vault.yourdomain.com

# 32-character Base32 TOTP Secret for Google Authenticator
TOTP_SHARED_SECRET=YOUR_32_CHAR_BASE32_KEY_HERE

VAULT_BASE_PATH=/app/vault_data
PUBLIC_BASE_URL=https://api.vault.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.vault.yourdomain.com
```

> **Security Note:** `.env` and `/data` are ignored by git in `.gitignore`. Never commit your real TOTP secret or session keys to source control.

### 3. Deploy with Docker Compose

Build and launch services:

```bash
docker compose up -d --build
```

Verify service status:
```bash
docker compose ps
```

### 4. Caddy Configuration

Add reverse proxy rules to your `/etc/caddy/Caddyfile`:

```caddy
vault.yourdomain.com {
    reverse_proxy 127.0.0.1:3005
}

api.vault.yourdomain.com {
    reverse_proxy 127.0.0.1:8005
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## API Reference

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET /health/` | `GET` | No | Service health check |
| `POST /api/auth/verify/` | `POST` | No | Verify 6-digit TOTP code, returns JWT token |
| `GET /api/auth/status/` | `GET` | Token | Validates current token |
| `GET /api/files/` | `GET` | Public: No / Protected: Yes | List files with category & search filters |
| `POST /api/files/upload/` | `POST` | **Yes (TOTP Token)** | Upload file with optional rename |
| `POST /api/files/rename/` | `POST` | **Yes (TOTP Token)** | Rename existing file |
| `POST /api/files/delete/` | `POST` | **Yes (TOTP Token)** | Delete file |
| `GET /api/stats/` | `GET` | No | Summary of storage & categories |
| `GET /public/<category>/<file>` | `GET` | **No** | Direct public asset delivery |
| `GET /protected/<category>/<file>` | `GET` | **Yes (Token)** | Protected file streaming |

---

## Author

**Md. Shahidur Rahman**
- Website: [shahidur.dev](https://shahidur.dev)
- Email: [hello@shahidur.dev](mailto:hello@shahidur.dev)

---

## License

MIT License. Free for personal and commercial use.
