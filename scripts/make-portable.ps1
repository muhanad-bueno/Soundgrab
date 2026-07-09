# make-portable.ps1 — run after `npm run tauri build`
# Produces: src-tauri/target/release/bundle/Soundgrab_x.y.z_x64_portable.zip
# Contents: soundgrab_scaffold.exe, yt-dlp.exe, _portable (marker)

$version = (Get-Content "$PSScriptRoot\..\src-tauri\tauri.conf.json" | ConvertFrom-Json).version
$releaseDir = "$PSScriptRoot\..\src-tauri\target\release"
$bundleDir = "$releaseDir\bundle"
$outZip = "$bundleDir\Soundgrab_${version}_x64_portable.zip"
$staging = "$env:TEMP\soundgrab-portable-staging"

# Ensure yt-dlp is present (sidecar, must exist after build)
$ytdlp = "$PSScriptRoot\..\src-tauri\binaries\yt-dlp-x86_64-pc-windows-msvc.exe"
if (-not (Test-Path $ytdlp)) {
    Write-Error "yt-dlp sidecar not found at $ytdlp - copy it there first"
    exit 1
}

Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $staging | Out-Null

Copy-Item "$releaseDir\soundgrab_scaffold.exe" "$staging\soundgrab_scaffold.exe"
Copy-Item $ytdlp "$staging\yt-dlp.exe"
New-Item -ItemType File -Path "$staging\_portable" -Force | Out-Null

Remove-Item $outZip -ErrorAction SilentlyContinue
Compress-Archive -Path "$staging\*" -DestinationPath $outZip

Remove-Item -Recurse -Force $staging
Write-Host "Portable zip: $outZip"
