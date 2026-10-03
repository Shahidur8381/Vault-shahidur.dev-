"""
Django settings for vault_api project.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'default-django-secret-vault-key-shahidur')
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        'ALLOWED_HOSTS',
        'api.vault.shahidur.dev,vault.shahidur.dev,localhost,127.0.0.1,backend'
    ).split(',')
    if host.strip()
]

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
    'vault',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'vault_api.urls'

WSGI_APPLICATION = 'vault_api.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Vault Configuration
VAULT_BASE_PATH = os.getenv('VAULT_BASE_PATH', str(BASE_DIR.parent / 'data'))
PUBLIC_BASE_URL = os.getenv('PUBLIC_BASE_URL', 'https://api.vault.shahidur.dev')
TOTP_SHARED_SECRET = os.getenv('TOTP_SHARED_SECRET', 'VO3W7H2JT7N2HPUNE3QU2MGTKJVHBGXK')
JWT_SECRET = SECRET_KEY
JWT_EXPIRY_DAYS = int(os.getenv('JWT_EXPIRY_DAYS', '7'))

# Upload file size limit: up to 500MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000
