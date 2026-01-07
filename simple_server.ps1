# Simple Static Web Server in PowerShell
$port = 8000
$root = Get-Location
$listener = New-Object System.Net.HttpListener
# Listener start moved to later with error handling

Write-Host "==================================================="
Write-Host "   PowerShell Web Server Running on Port $port"
Write-Host "   Serving: $root"

# Auto-detect IP Address
try {
    $ipStr = [System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName()).AddressList | 
    Where-Object { $_.AddressFamily -eq 'InterNetwork' } | 
    Select-Object -First 1
             
    if ($ipStr) {
        $ip = $ipStr.IPAddressToString
        Write-Host "   Local Access:  http://localhost:$port" -ForegroundColor Cyan
        Write-Host "   LAN Access:    http://$($ip):$port" -ForegroundColor Green
    }
    else {
        Write-Host "   Local Access:  http://localhost:$port" -ForegroundColor Cyan
        Write-Host "   Could not detect LAN IP automatically." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   Local Access:  http://localhost:$port" -ForegroundColor Cyan
}

Write-Host "==================================================="

try {
    # Try to start listener
    if (-not $listener.IsListening) {
        $listener.Start()
    }
}
catch {
    if ($_.Exception.Message -like "*Access is denied*") {
        Write-Host "ERROR: Access is denied." -ForegroundColor Red
        Write-Host "Please close this window and run 'start_server.bat' as Administrator." -ForegroundColor Yellow
        Write-Host "Right-click start_server.bat -> Run as administrator" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        exit
    }
    throw $_
}

Write-Host "==================================================="

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = Join-Path $root $request.Url.LocalPath
        
        # Default to index.html for root requests
        if ($localPath -eq $root -or $localPath.EndsWith("\")) {
            $localPath = Join-Path $localPath "index.html"
        }

        if (Test-Path $localPath -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($localPath)
                $response.ContentLength64 = $content.Length
                
                # Basic MIME types
                $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
                switch ($extension) {
                    ".html" { $response.ContentType = "text/html" }
                    ".css" { $response.ContentType = "text/css" }
                    ".js" { $response.ContentType = "application/javascript" }
                    ".json" { $response.ContentType = "application/json" }
                    ".png" { $response.ContentType = "image/png" }
                    ".jpg" { $response.ContentType = "image/jpeg" }
                    ".jpeg" { $response.ContentType = "image/jpeg" }
                    ".svg" { $response.ContentType = "image/svg+xml" }
                    Default { $response.ContentType = "application/octet-stream" }
                }
                
                $response.OutputStream.Write($content, 0, $content.Length)
                Write-Host "200 OK: $($request.Url.LocalPath)" -ForegroundColor Green
            }
            catch {
                $response.StatusCode = 500
                Write-Host "500 Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            $response.StatusCode = 404
            Write-Host "404 Not Found: $($request.Url.LocalPath)" -ForegroundColor Yellow
        }
        
        $response.Close()
    }
}
finally {
    $listener.Stop()
}
