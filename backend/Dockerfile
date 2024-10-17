FROM python:3.13.0-slim

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Combine commands in a shell script to handle sequential commands
CMD ["/bin/sh", "-c", "flask db upgrade && flask run --host=0.0.0.0"]