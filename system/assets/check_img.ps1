Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::new("C:\Users\pc\Desktop\NotesEleves\system\assets\app_icon.png")
Write-Output ("Width: " + $bmp.Width + "  Height: " + $bmp.Height + "  Format: " + $bmp.RawFormat)
$bmp.Dispose()
