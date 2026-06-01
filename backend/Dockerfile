FROM python:3.11-alpine

# Install essential runtime system libraries
RUN apk add --no-cache postgresql-client libpq libstdc++

WORKDIR /app

# Copy dependency configs
COPY requirements.txt ./

# Install dependencies using virtual build-deps to keep image extremely lightweight
RUN apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev libffi-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del .build-deps

# Copy application code
COPY . .

# Expose FastAPI server port
EXPOSE 5000

# Start command: runs seed script to pop database, then starts FastAPI server
CMD ["sh", "-c", "python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 5000"]
