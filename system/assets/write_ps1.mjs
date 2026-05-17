import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function writePs1() {
    const code = `$WshShell = New-Object -ComObject WScript.Shell
$tempShortcut = "$PSScriptRoot\\..\\..\\SystemLauncher.lnk"
$Shortcut = $WshShell.CreateShortcut($tempShortcut)
$Shortcut.TargetPath = "$PSScriptRoot\\launcher.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot\\..\\.."
$Shortcut.IconLocation = "$PSScriptRoot\\icon.ico"
$Shortcut.Save()

# Rename to Arabic using native PowerShell to ensure 100% Unicode reliability
$finalShortcut = "$PSScriptRoot\\..\\..\\تشغيل_المنظومة.lnk"
if (Test-Path $tempShortcut) {
    Move-Item -Path $tempShortcut -Destination $finalShortcut -Force
}
`;

    const targetPath = path.join(__dirname, 'create_shortcut.ps1');
    // Save with UTF-8 BOM (\ufeff) so PowerShell parses Arabic characters perfectly
    fs.writeFileSync(targetPath, '\ufeff' + code, 'utf8');
    console.log("Successfully wrote create_shortcut.ps1 with UTF-8 BOM!");
}

writePs1();
