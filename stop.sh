#!/bin/bash
echo "Zatrzymywanie serwera Testy Prawo Jazdy Kat. A (port 8089)..."
PID=$(lsof -t -i :8089)

if [ -n "$PID" ]; then
  kill $PID
  echo "Serwer został zatrzymany (PID: $PID)."
else
  echo "Serwer nie jest aktualnie uruchomiony."
fi
