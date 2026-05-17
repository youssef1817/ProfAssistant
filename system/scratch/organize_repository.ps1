# Ensure the directory exists and rename old if present
if (Test-Path "نقط") {
    Rename-Item -Path "نقط" -NewName "مستودع النقط" -Force
}

if (!(Test-Path "مستودع النقط")) {
    New-Item -ItemType Directory -Path "مستودع النقط" -Force
}

# Recursively find all Excel files
$files = Get-ChildItem -Path "مستودع النقط" -Filter "*.xlsx" -Recurse

# Move each file directly to the root of 'مستودع النقط'
foreach ($file in $files) {
    $targetPath = Join-Path "مستودع النقط" $file.Name
    $resolvedTarget = Resolve-Path $targetPath -ErrorAction SilentlyContinue
    
    if ($resolvedTarget -eq $null -or $file.FullName -ne $resolvedTarget.Path) {
        Write-Host "Moving file: $($file.FullName) to $targetPath"
        Move-Item -Path $file.FullName -Destination $targetPath -Force
    }
}

# Clean up empty subdirectories
$subdirs = Get-ChildItem -Path "مستودع النقط" -Directory
foreach ($dir in $subdirs) {
    Write-Host "Removing directory: $($dir.FullName)"
    Remove-Item -Path $dir.FullName -Recurse -Force
}

Write-Host "Repository organization completed successfully!"
