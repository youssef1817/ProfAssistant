Add-Type -AssemblyName System.Drawing

# The source file is actually a JPEG - convert it to a real PNG first
$srcPath = "C:\Users\pc\Desktop\NotesEleves\system\assets\app_icon.png"
$realPng  = "C:\Users\pc\Desktop\NotesEleves\system\assets\app_icon_real.png"
$icoPath  = "C:\Users\pc\Desktop\NotesEleves\system\assets\icon.ico"

# Step 1: Open JPEG and save as a real PNG
$bmp = [System.Drawing.Bitmap]::new($srcPath)
$bmp.Save($realPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "[OK] Converted JPEG to real PNG -> app_icon_real.png"
