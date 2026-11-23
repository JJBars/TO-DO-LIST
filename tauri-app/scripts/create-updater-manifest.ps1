param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$")]
  [string]$Tag
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot "src-tauri\tauri.conf.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$version = $config.version

if ($Tag -ne "v$version") {
  throw "La etiqueta $Tag no coincide con la versión configurada ($version)."
}

$bundleDirectory = Join-Path $projectRoot "src-tauri\target\release\bundle\nsis"
$installerName = "Dayly_${version}_x64-setup.exe"
$signaturePath = Join-Path $bundleDirectory "$installerName.sig"

if (-not (Test-Path $signaturePath)) {
  throw "No se encontró la firma $signaturePath. Ejecuta primero npm run tauri build con la clave local configurada."
}

$signature = (Get-Content $signaturePath -Raw).Trim()
$manifest = @{
  version = $version
  notes = "Actualización de Dayly $version"
  pub_date = (Get-Date).ToUniversalTime().ToString("o")
  platforms = @{
    "windows-x86_64" = @{
      signature = $signature
      url = "https://github.com/JJBars/TO-DO-LIST/releases/download/$Tag/$installerName"
    }
  }
} | ConvertTo-Json -Depth 5

$manifestPath = Join-Path $bundleDirectory "latest.json"
Set-Content -Path $manifestPath -Value $manifest -Encoding utf8
Write-Output "Manifiesto creado: $manifestPath"
