FROM python:3.11-slim AS prod
    COPY backend.py /app/backend.py
    COPY requirements.txt /app/requirements.txt

    # Get ready for entry & logging
    WORKDIR /
    RUN mkdir /log && touch /log/serverLog
    RUN mkdir /app/output
    RUN pip install --upgrade pip \
        && pip install --no-cache-dir -r /app/requirements.txt

    WORKDIR /app

EXPOSE 5000
VOLUME [ "/app/output" ]
CMD [ "gunicorn", "-b", "0.0.0.0:5000", "backend:app", "--workers", "1", "--log-level", "info", "--access-logfile", "-", "--worker-class", "eventlet" ]
# ENTRYPOINT [ "/bin/bash" ]