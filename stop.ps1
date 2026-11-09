Write-Host "Zatrzymywanie serwera Testy Prawo Jazdy (port 8089)..."

$connections = Get-NetTCPConnection -LocalPort 8089 -ErrorAction SilentlyContinue

if ($connections) {
    $uniquePids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $uniquePids) {
        Stop-Process -Id $procId -Force
        Write-Host "Serwer zostal zatrzymany (PID: $procId)."
    }
} else {
    Write-Host "Serwer nie jest aktualnie uruchomiony."
}
