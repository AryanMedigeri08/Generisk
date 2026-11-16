#!/bin/sh
set -eu
alembic upgrade head
python -m app.seed
python -m app.seed_identity
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log
