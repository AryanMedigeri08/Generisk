FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/workspace/services/api/src
WORKDIR /workspace/services/api
COPY services/api/requirements.lock ./requirements.lock
RUN pip install --no-cache-dir -r requirements.lock
RUN useradd --uid 10001 --create-home app
COPY --chown=10001:10001 services/api /workspace/services/api
COPY --chown=10001:10001 data/synthetic /workspace/data/synthetic
USER app
EXPOSE 8000
CMD ["sh", "/workspace/services/api/start.sh"]
