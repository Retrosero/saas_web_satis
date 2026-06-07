$ErrorActionPreference = 'Stop'

function Test-TcpPort {
  param(
    [string]$HostName,
    [int]$Port
  )

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(1000)

    if (-not $connected) {
      $client.Close()
      return $false
    }

    $client.EndConnect($async)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

Write-Host 'Lokal servisler hazırlanıyor...'
docker compose up -d postgres redis meilisearch minio | Out-Host

$maxAttempts = 30
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  if (Test-TcpPort -HostName 'localhost' -Port 54432) {
    Write-Host 'PostgreSQL erişilebilir durumda.'
    pnpm -r --parallel run dev
    exit $LASTEXITCODE
  }

  if ($attempt -eq 10) {
    Write-Host 'PostgreSQL portu açılmadı, container yeniden oluşturuluyor...'
    docker compose up -d --force-recreate postgres | Out-Host
  }

  Start-Sleep -Seconds 1
}

Write-Error 'PostgreSQL 54432 portunda erişilebilir olmadı. `docker compose ps` ve `docker logs saas-postgres` ile kontrol edin.'
