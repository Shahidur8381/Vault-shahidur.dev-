<div align="center">

# ⚡ SANCTUM

### **Sovereign Personal Cloud Sanctuary & High-Performance CDN**

[![Django](https://img.shields.io/badge/Backend-Django_5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/TLS-Caddy_v2-22B573?style=for-the-badge&logo=caddy&logoColor=white)](https://caddyserver.com/)

<br />

[**🌐 Live Platform**](https://vault.shahidur.dev) &nbsp;•&nbsp; [**⚡ Public CDN API**](https://api.vault.shahidur.dev) &nbsp;•&nbsp; [**📖 Documentation**](#-architecture)

<br />

</div>

---

## 📌 Highlights

**Sanctum** is a dual-partition sovereign cloud storage and CDN engine engineered for seamless asset hosting alongside hardware-grade encrypted private storage:

| Partition | Public Access | Authentication | Intended Use |
| :--- | :---: | :---: | :--- |
| **🌐 Public Vault** | ✅ Direct URL | Required for modifications | Instant asset delivery for websites, portfolio assets, blogs, and markdown. |
| **🔒 Protected Vault** | ❌ Strictly Blocked | **TOTP 6-Digit Code** | Confidential personal documents and credentials guarded by Google Authenticator. |

> **Security First:** Any modifying action across **both** partitions (uploading, renaming, deleting) strictly enforces RFC 6238 TOTP authorization with auto-expiring sessions.

---

## ✨ Features

- 📁 **Automated MIME & Extension Routing:** Uploaded assets are sorted dynamically into clean categorical directories:
  - `images/`: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`, `.avif`, `.ico`
  - `pdf/`: `.pdf`
  - `video/`: `.mp4`, `.webm`, `.mkv`, `.mov`, `.avi`
  - `audio/`: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`
  - `others/`: `.zip`, `.tar.gz`, documents, code, and generic archives
- ⏳ **15-Minute Sovereign Session Guard:** Automatic administrative session expiry with live header countdown HUD (`MM:SS`) and warning threshold alerts.
- 👁️ **Instant Interactive Previews:** Single-click asset viewer directly launches hosted files in new tabs with direct copy-to-clipboard actions.
- 🏷️ **Custom Rename on Ingestion:** Assign custom filenames while preserving original extensions automatically.
- 🎯 **Streamlined Drag & Drop:** Drop files directly into the modal or ingest button without disruptive screen flickering.
- 🔗 **Direct Public CDN Links:** Direct URL format `https://api.vault.shahidur.dev/public/<category>/<filename>` with global CORS headers and HTTP caching.
- 🔐 **TOTP Verification:** Hardware/authenticator backed authorization using PyOTP and signed session JWTs.
- 🚀 **Zero-Config TLS:** Automatic SSL certificate issuance and renewal powered by Caddy.

---

## 🏗️ Architecture

```text
               Internet / Users / Web Applications
                                │
                                ▼
                   ┌─────────────────────────┐
                   │       Caddy Proxy       │ (Port 80/443 SSL Termination)
                   └────────────┬────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
vault.shahidur.dev                            api.vault.shahidur.dev
  [ Next.js 14 Frontend ]                       [ Django 5 Backend ]
  • Standalone Docker                           • Gunicorn WSGI
  • Port 3005 (Internal)                        • Port 8005 (Internal)
                                                ├── /public/*    (Direct CDN)
                                                ├── /protected/* (TOTP Guarded)
                                                └── /api/*       (Secure Operations)
```

---

## 🚀 Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/Shahidur8381/Vault-shahidur.dev-.git
cd Vault-shahidur.dev-
cp .env.example .env
```

Configure your `.env` file:

```env
SECRET_KEY=generate_your_random_secret_key_here
DEBUG=False
ALLOWED_HOSTS=api.vault.shahidur.dev,vault.shahidur.dev,localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=https://vault.shahidur.dev

# 32-character Base32 Secret for Google Authenticator
TOTP_SHARED_SECRET=YOUR_32_CHAR_BASE32_KEY_HERE

VAULT_BASE_PATH=/app/vault_data
PUBLIC_BASE_URL=https://api.vault.shahidur.dev
NEXT_PUBLIC_API_URL=https://api.vault.shahidur.dev
```

### 2. Launch with Docker Compose

```bash
docker compose up -d --build
```

Check container health:
```bash
docker compose ps
```

### 3. Caddy Reverse Proxy

Add the following blocks to your `/etc/caddy/Caddyfile`:

```caddy
vault.shahidur.dev {
    reverse_proxy 127.0.0.1:3005
}

api.vault.shahidur.dev {
    reverse_proxy 127.0.0.1:8005
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## 📡 API Reference

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `GET /health/` | `GET` | None | Service heartbeat & health status |
| `POST /api/auth/verify/` | `POST` | None | Validates 6-digit TOTP code, returns signed JWT |
| `GET /api/auth/status/` | `GET` | Token | Checks session authentication state |
| `GET /api/files/` | `GET` | Optional | Lists repository files with category & search filters |
| `POST /api/files/upload/` | `POST` | **TOTP** | Upload asset with auto-categorization and optional rename |
| `POST /api/files/rename/` | `POST` | **TOTP** | Renames an existing asset |
| `POST /api/files/delete/` | `POST` | **TOTP** | Permanently removes an asset |
| `GET /api/stats/` | `GET` | None | Storage consumption summary and file counts |
| `GET /public/<cat>/<file>` | `GET` | None | Direct high-speed asset distribution (CORS enabled) |
| `GET /protected/<cat>/<file>`| `GET` | **TOTP** | Secure streaming for protected assets |

---

## 👨‍💻 Author

<div align="center">

**Md. Shahidur Rahman**

[![Website](https://img.shields.io/badge/Website-shahidur.dev-0284c7?style=flat-square&logo=googlechrome&logoColor=white)](https://shahidur.dev)
[![Email](https://img.shields.io/badge/Email-hello%40shahidur.dev-ea4335?style=flat-square&logo=gmail&logoColor=white)](mailto:hello@shahidur.dev)

</div>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
