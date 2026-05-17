Add-Type -AssemblyName System.Drawing
$pngPath = "$PSScriptRoot\app_icon.png"
$icoPath = "$PSScriptRoot\icon.ico"

if (Test-Path $pngPath) {
    $bmp = New-Object System.Drawing.Bitmap($pngPath)
    $hIcon = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    
    $stream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $icon.Save($stream)
    $stream.Close()
    
    $bmp.Dispose()
    Write-Output "Successfully converted PNG to a valid native Windows ICO!"
} else {
    Write-Error "Source PNG not found!"
}
