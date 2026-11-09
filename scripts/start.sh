#!/bin/bash
cd "$(dirname "$0")/.."
echo "Uruchamianie aplikacji Testy Prawo Jazdy Kat. A..."
echo "Otwórz przeglądarkę pod adresem: http://localhost:8089/index.html"
python3 -m http.server 8089
