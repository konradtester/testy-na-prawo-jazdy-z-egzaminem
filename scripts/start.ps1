Set-Location -Path (Join-Path $PSScriptRoot "..")
Write-Host "Uruchamianie aplikacji Testy Prawo Jazdy..."
Write-Host "Otworz przegladarke pod adresem: http://localhost:8089/index.html"

if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8089
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server 8089
} else {
    Write-Error "Nie znaleziono Pythona w PATH. Zainstaluj go z https://www.python.org/downloads/ (zaznacz 'Add python.exe to PATH' podczas instalacji) i uruchom ten skrypt ponownie."
}
