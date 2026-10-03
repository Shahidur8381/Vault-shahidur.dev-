FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure storage directories exist
RUN mkdir -p /app/vault_data/public/images \
    /app/vault_data/public/pdf \
    /app/vault_data/public/video \
    /app/vault_data/public/audio \
    /app/vault_data/public/others \
    /app/vault_data/protected/images \
    /app/vault_data/protected/pdf \
    /app/vault_data/protected/video \
    /app/vault_data/protected/audio \
    /app/vault_data/protected/others

EXPOSE 8000

CMD ["gunicorn", "vault_api.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
