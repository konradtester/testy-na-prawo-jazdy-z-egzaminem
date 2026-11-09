# Testy na Prawo Jazdy

Aplikacja do prostej, szybkiej nauki i weryfikacji pytań egzaminacyjnych na prawo jazdy (ogólne i specjalistyczne) na podstawie oficjalnego katalogu Ministerstwa Infrastruktury / WORD: `KATALOG_dla_kandydatów_na_kierowców_072026.xlsx`.

Aplikacja działa w przeglądarce (czysty HTML/CSS/JS, bez frameworków i bez instalacji żadnych bibliotek) — potrzebny jest tylko lokalny serwer, który poprawnie obsłuży pliki wideo/obrazy. Baza pytań jest już wygenerowana i wgrana do repozytorium (`questions_kat_*.js/json`), więc do samego korzystania z testów **nie musisz** uruchamiać `build_dataset.py` — ten skrypt jest potrzebny tylko, jeśli chcesz samodzielnie odtworzyć bazę z pliku `.xlsx` (np. po jego aktualizacji).

## Kategorie
Po otwarciu aplikacji wybierasz kategorię prawa jazdy, dla której chcesz się uczyć:

| Kategoria | Pytania |
|---|---|
| A – Motocykl | 1425 |
| A1 – Motocykl do 125 cm³ | 1411 |
| A2 – Motocykl średniej mocy | 1409 |
| B – Samochód osobowy | 2135 |
| B1 – Czterokołowiec (quad) | 1421 |

Postępy i statystyki są zapisywane osobno dla każdej kategorii. W każdej chwili można zmienić kategorię przyciskiem "Zmień kategorię" w górnym pasku.

Aby dodać kolejną kategorię (np. C, D, T), dopisz jej kod do listy `CATEGORIES` w `build_dataset.py` oraz w `app.js` i uruchom ponownie `python3 build_dataset.py`.

## Tryb Testy vs. Tryb Egzamin
- **Tryb Testy** (domyślny): swobodna nauka — natychmiastowy feedback po każdej odpowiedzi, filtry, losowanie, skok do dowolnego pytania, bez limitu czasu.
- **Tryb Egzamin**: wierna symulacja oficjalnego egzaminu teoretycznego WORD, uruchamiana przyciskiem "Tryb Egzamin" w toolbarze:
  - **32 pytania**: 20 podstawowych + 12 specjalistycznych, losowane z odpowiednią wagą punktową (10×3pkt + 6×2pkt + 4×1pkt dla podstawowych; 6×3pkt + 4×2pkt + 2×1pkt dla specjalistycznych).
  - **Limit czasu**: 20 s na pytanie podstawowe, 50 s na specjalistyczne — po upływie czasu pytanie liczy się jako błędne i egzamin przechodzi dalej automatycznie.
  - **Bez podglądu poprawnych odpowiedzi w trakcie** i **bez cofania się** do zamkniętego pytania — tak jak na prawdziwym egzaminie.
  - **Wynik końcowy**: suma punktów (max 74), próg zdawalności **68 pkt**, pełna lista 32 pytań z zaznaczeniem błędów i poprawnych odpowiedzi.
  - Błędnie odpowiedziane pytania z egzaminu trafiają automatycznie do filtra "Do powtórki" w Trybie Testy.

## Funkcjonalności
- **Wszystkie pytania dla wybranej kategorii**, podzielone na:
  - **pytania podstawowe (ogólne)**: format TAK / NIE
  - **pytania specjalistyczne**: format A / B / C oraz TAK / NIE
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
- `1` – wybór **TAK** (w pytaniach TAK/NIE)
- `2` – wybór **NIE** (w pytaniach TAK/NIE)
- `1` / `2` / `3` – wybór odpowiedzi A, B lub C (w pytaniach z 3 opcjami – specjalistycznych)
- `Spacja` / `Enter` / `→` (strzałka w prawo) – **Następne pytanie**
- `←` (strzałka w lewo) – **Poprzednie pytanie**

## Wymagania i instalacja zależności

Aplikacja nie potrzebuje żadnych bibliotek — wystarczy zainstalować **Python 3**, który służy jedynie do odpalenia prostego serwera plików (`http.server`). Node.js / npm jest **opcjonalny** — potrzebny tylko, jeśli wolisz uruchamiać serwer komendą `npm start` zamiast Pythona.

### macOS

1. **Python 3** — najczęściej jest już zainstalowany. Sprawdź w Terminalu:
   ```bash
   python3 --version
   ```
   Jeśli pojawi się błąd, zainstaluj go przez [Homebrew](https://brew.sh):
   ```bash
   brew install python
   ```
   albo pobierz instalator z [python.org/downloads](https://www.python.org/downloads/macos/).

2. **Node.js / npm** (opcjonalnie, tylko dla komend `npm start` / `npm run stop`):
   ```bash
   brew install node
   ```
   albo pobierz instalator z [nodejs.org](https://nodejs.org/) (wersja LTS). Sprawdzenie instalacji:
   ```bash
   node --version
   npm --version
   ```

### Windows

Najwygodniej jest użyć **PowerShell** (wbudowany w Windows, dostępny z menu Start — wpisz "PowerShell").

1. **Python 3**:
   - Pobierz instalator z [python.org/downloads](https://www.python.org/downloads/) (przycisk "Download Python") **albo** zainstaluj z Microsoft Store, wyszukując "Python 3.12" (lub nowszy).
   - **Ważne:** podczas instalacji z python.org zaznacz checkbox **"Add python.exe to PATH"** na pierwszym ekranie instalatora — bez tego komenda `python` nie zadziała w terminalu.
   - Sprawdzenie instalacji w PowerShell:
     ```powershell
     python --version
     ```
     Jeśli to nie zadziała, spróbuj:
     ```powershell
     py --version
     ```

2. **Node.js / npm** (opcjonalnie):
   - Pobierz i zainstaluj wersję LTS z [nodejs.org](https://nodejs.org/) (instalator `.msi`, kliknij "Next" przez cały proces — domyślne ustawienia są OK, npm instaluje się automatycznie razem z Node.js).
   - Sprawdzenie instalacji w PowerShell:
     ```powershell
     node --version
     npm --version
     ```
   - Jeśli PowerShell zgłasza błąd, że uruchamianie skryptów jest zablokowane (`running scripts is disabled on this system`), uruchom PowerShell jako zwykły użytkownik i wykonaj jednorazowo:
     ```powershell
     Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
     ```

3. **Pobranie projektu**: jeśli masz Git for Windows, w PowerShell:
   ```powershell
   git clone <adres-repozytorium>
   cd testy
   ```
   Można też po prostu pobrać repozytorium jako plik `.zip` (przycisk "Code" → "Download ZIP") i rozpakować.

---

## Uruchamianie serwera

### macOS / Linux

**Opcja 1 (skrypt pomocniczy — zalecane):**
```bash
./start.sh
```

**Opcja 2 (Python bezpośrednio):**
```bash
python3 -m http.server 8089
```

**Opcja 3 (NPM):**
```bash
npm start
```

Aplikacja jest dostępna pod adresem: **http://localhost:8089/index.html**

### Windows (PowerShell)

**Opcja 1 (skrypt pomocniczy — zalecane):**
```powershell
.\start.ps1
```
Jeśli PowerShell odmówi uruchomienia skryptu (polityka wykonywania), użyj:
```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

**Opcja 2 (Python bezpośrednio):**
```powershell
python -m http.server 8089
```

**Opcja 3 (NPM):**
```powershell
npm run start:windows
```

Aplikacja jest dostępna pod adresem: **http://localhost:8089/index.html**

---

## Zatrzymywanie serwera

### macOS / Linux

**Opcja 1 (w oknie terminala, w którym działa serwer):**
```text
Ctrl + C
```

**Opcja 2 (skryptem z dowolnego terminala):**
```bash
./stop.sh
```

**Opcja 3 (NPM):**
```bash
npm run stop
```

**Opcja 4 (ręcznie komendą w terminalu):**
```bash
kill $(lsof -t -i :8089)
```

### Windows (PowerShell)

**Opcja 1 (w oknie terminala, w którym działa serwer):**
```text
Ctrl + C
```

**Opcja 2 (skryptem z dowolnego terminala):**
```powershell
.\stop.ps1
```

**Opcja 3 (NPM):**
```powershell
npm run stop:windows
```

---

## Licencja

Projekt jest udostępniony na licencji **GNU Affero General Public License v3.0 (AGPLv3)** — zob. plik [`LICENSE`](LICENSE).

W skrócie: możesz dowolnie korzystać, kopiować i modyfikować ten kod, także do celów komercyjnych. Jednak jeśli udostępnisz go innym (również jako usługę sieciową / webapp, bez samej "dystrybucji" plików), musisz udostępnić pełny kod źródłowy swojej wersji na tych samych warunkach. Oznacza to, że nikt nie może zrobić z tego projektu zamkniętej, płatnej wersji.
