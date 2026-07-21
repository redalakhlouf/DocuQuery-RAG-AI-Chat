FROM python:3.11-slim
RUN apt-get update && apt-get install -y libmagic1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1