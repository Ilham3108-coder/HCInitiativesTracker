# prepare_netlify_1hour.ps1

$sourceDir = Get-Location
$distDir = Join-Path $sourceDir "dist-netlify"

# 1. Clean and Recreate Dist Folder
if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir | Out-Null
Write-Host "Created $distDir" -ForegroundColor Green

# 2. Copy Assets
$itemsToCopy = @("css", "js", "assets", "*.html", "*.png", "*.jpg", "*.ico")
foreach ($item in $itemsToCopy) {
    Copy-Item -Path $item -Destination $distDir -Recurse -Force
}
Write-Host "Copied assets to $distDir" -ForegroundColor Green

# 3. Calculate Expiration (1 Hour from NOW)
$expiration = (Get-Date).AddHours(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Host "Setting expiration time to: $expiration" -ForegroundColor Yellow

# 4. Inject Expiration Script into ALL HTML files in dist
$script = @"
<script>
    (function() {
        var expiration = new Date("$expiration").getTime();
        var now = new Date().getTime();
        if (now > expiration) {
            document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f8f9fa;color:#dc3545;font-family:sans-serif;flex-direction:column;text-align:center;">' +
                '<h1 style="font-size:3rem;margin-bottom:1rem;">Link Expired</h1>' +
                '<p style="font-size:1.5rem;">This shared access link has expired.</p>' +
                '</div>';
            throw new Error("Session Expired");
        } else {
            console.log("Session valid until: " + new Date(expiration).toLocaleString());
        }
    })();
</script>
</body>
"@

$htmlFiles = Get-ChildItem -Path $distDir -Filter "*.html"
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    # Insert script before </body>
    if ($content -match "</body>") {
        $content = $content -replace "</body>", $script
        Set-Content -Path $file.FullName -Value $content
    }
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "READY FOR DROP!" -ForegroundColor Cyan
Write-Host "Folder: $distDir" -ForegroundColor White
Write-Host "1. Go to https://app.netlify.com/drop" -ForegroundColor White
Write-Host "2. Drag and drop the 'dist-netlify' folder there." -ForegroundColor White
Write-Host "==============================================" -ForegroundColor Cyan
pause
