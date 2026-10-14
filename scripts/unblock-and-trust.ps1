# Skript for å fjerne Windows SmartScreen "Ukjent utgiver" og blokkering
param(
    [string]$FilePath = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " OpenArt Hub - SmartScreen & Utgiver Fix " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Hvis brukeren oppga en fil eller vi sjekker Downloads
if ($FilePath -and (Test-Path $FilePath)) {
    Unblock-File -Path $FilePath
    Write-Host "[OK] Fjernet internett-blokkering (Zone.Identifier) fra: $FilePath" -ForegroundColor Green
} else {
    $downloads = [System.IO.Path]::Combine($HOME, "Downloads")
    $hubInstallers = Get-ChildItem -Path $downloads -Filter "*OpenArt*" -ErrorAction SilentlyContinue
    foreach ($file in $hubInstallers) {
        Unblock-File -Path $file.FullName
        Write-Host "[OK] Fjernet internett-blokkering fra: $($file.Name)" -ForegroundColor Green
    }
}

# 2. Opprett og installer et lokalt betrodd utviklersertifikat for OpenArt Team
Write-Host "`nOppretter lokalt betrodd kodesignerings-sertifikat for 'OpenArt Team'..." -ForegroundColor Yellow

$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -like "*OpenArt Team*" } | Select-Object -First 1

if (-not $cert) {
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=OpenArt Team, O=OpenArt Creative Suite" `
        -KeyUsage DigitalSignature `
        -FriendlyName "OpenArt Hub Code Signing" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(5)
    
    # Legg til i Trusted Root for gjeldende bruker
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $rootStore.Open("ReadWrite")
    $rootStore.Add($cert)
    $rootStore.Close()

    # Legg til i Trusted Publisher for gjeldende bruker
    $pubStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("TrustedPublisher", "CurrentUser")
    $pubStore.Open("ReadWrite")
    $pubStore.Add($cert)
    $pubStore.Close()

    Write-Host "[OK] Sertifikatet 'OpenArt Team' er installert som betrodd utgiver på din PC!" -ForegroundColor Green
} else {
    Write-Host "[INFO] Sertifikatet 'OpenArt Team' finnes allerede på PC-en din." -ForegroundColor Green
}

Write-Host "`nFerdig! Du kan nå kjøre installasjonsfilen uten advarsler." -ForegroundColor Cyan