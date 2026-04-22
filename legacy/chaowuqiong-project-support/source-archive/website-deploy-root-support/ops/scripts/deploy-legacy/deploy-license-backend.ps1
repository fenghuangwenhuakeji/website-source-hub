$ErrorActionPreference = "Stop"
$zipPath = "D:\网站部署\chaowuqiong-project\deploy\license-backend-fixed.zip"
$server = "root@115.190.158.182"
$dest = "/tmp/license-backend-fixed.zip"
$password = "gong134135"

$secPassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($server, $secPassword)

try {
    Write-Host "Uploading license-backend-fixed.zip to server..."

    $session = New-PSSession -ComputerName "115.190.158.182" -Credential $credential -Authentication Default

    Write-Host "Upload file..."
    Copy-Item -ToSession $session -Path $zipPath -Destination $dest -Force

    Write-Host "Extracting and deploying files..."
    Invoke-Command -Session $session -ScriptBlock {
        Set-Location /tmp
        if (Test-Path license-backend-fixed.zip) {
            tar -xzf license-backend-fixed.zip
            if (-not (Test-Path /var/www/license-backend)) {
                New-Item -ItemType Directory -Path /var/www/license-backend -Force
            }
            if (Test-Path src) {
                Copy-Item -Path src/* -Destination /var/www/license-backend/src/ -Recurse -Force
            }
            if (Test-Path package.json) {
                Copy-Item -Path package.json -Destination /var/www/license-backend/ -Force
            }
            Write-Host "Files deployed successfully!"
            Get-ChildItem /var/www/license-backend/src/
        } else {
            Write-Host "Zip file not found!"
        }
    }

    Remove-PSSession $session
    Write-Host "Deployment completed!"
} catch {
    Write-Host "Error: $_"
    Write-Host "Stack: $($_.ScriptStackTrace)"
}
