# Testy na Prawo Jazdy – Kategoria A

Aplikacja do prostej, szybkiej nauki i weryfikacji pytań egzaminacyjnych na prawo jazdy **kategorii A** (ogólne i specjalistyczne) na podstawie oficjalnego katalogu Ministerstwa Infrastruktury / WORD: `KATALOG_dla_kandydatów_na_kierowców_072026.xlsx`.

## Funkcjonalności
- **Wszystkie 1425 pytań dla kategorii A**:
  - **1254 pytania podstawowe (ogólne)**: format TAK / NIE
  - **171 pytań specjalistycznych**: format A / B / C oraz TAK / NIE
- **Błyskawiczna walidacja odpowiedzi**:
  - Kliknięcie odpowiedzi natychmiast oznacza odpowiedź jako poprawną (zielony) lub błędną (czerwony) i podświetla właściwą opcję.
  - Przejście do kolejnego pytania za pomocą przycisku lub skrótu klawiaturowego.
- **Multimedia (filmy i zdjęcia)**:
  - Automatycznie odtwarza wideo i zdjęcia sytuacji drogowych.
  - Obsługuje bezpośredni streaming zoptymalizowanych formatów webowych (MP4 i WebP) oraz lokalny folder `media/` (jeśli pobierzesz pliki lokalnie).
  - Możliwość powiększenia zdjęcia jednym kliknięciem (lightbox) oraz ponownego odtworzenia wideo.
- **Filtry**:
  - Wszystkie (1425)
  - Ogólne / Podstawowe (1254)
  - Specjalistyczne (171)
  - **Do powtórki**: lista pytań, w których popełniono błąd w danej sesji!
- **Wygoda nauki**:
  - Tryb kolejny lub losowy (Shuffle)
  - Bezpośredni skok do dowolnego pytania (np. nr 500 lub ID z bazy)
  - Zapisywanie postępów w przeglądarce (`localStorage`) – po odświeżeniu wracasz do tego samego pytania
  - Statystyki sesji (poprawne, błędne, skuteczność %)

## Skróty Klawiszowe
- `1` lub `T` – wybór **TAK**
- `2` lub `N` – wybór **NIE**
- `A` / `B` / `C` lub `1` / `2` / `3` – wybór odpowiedzi w pytaniach wielokrotnego wyboru
- `Spacja` / `Enter` / `→` (strzałka w prawo) – **Następne pytanie**
- `←` (strzałka w lewo) – **Poprzednie pytanie**

## Uruchamianie serwera

### Opcja 1 (skrypt pomocniczy - zalecane):
```bash
./start.sh
```
Aplikacja jest dostępna pod adresem: **http://localhost:8089/index.html**

### Opcja 2 (Python bezpośrednio):
```bash
python3 -m http.server 8089
```

### Opcja 3 (NPM):
```bash
npm start
```

---

## Zatrzymywanie serwera

### Opcja 1 (w oknie terminala, w którym działa serwer):
Naciśnij kombinację klawiszy:
```text
Ctrl + C
```

### Opcja 2 (skryptem z dowolnego terminala):
```bash
./stop.sh
```

### Opcja 3 (NPM):
```bash
npm run stop
```

### Opcja 4 (ręcznie komendą w terminalu):
```bash
kill $(lsof -t -i :8089)
```

---

## Licencja

Projekt jest udostępniony na licencji **GNU Affero General Public License v3.0 (AGPLv3)** — zob. plik [`LICENSE`](LICENSE).

W skrócie: możesz dowolnie korzystać, kopiować i modyfikować ten kod, także do celów komercyjnych. Jednak jeśli udostępnisz go innym (również jako usługę sieciową / webapp, bez samej "dystrybucji" plików), musisz udostępnić pełny kod źródłowy swojej wersji na tych samych warunkach. Oznacza to, że nikt nie może zrobić z tego projektu zamkniętej, płatnej wersji.
