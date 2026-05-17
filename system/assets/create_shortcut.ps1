$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$PSScriptRoot\..\..\Lancer ProfAssistant.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\launcher.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot\..\.."
$Shortcut.IconLocation = "$PSScriptRoot\icon.ico"
$Shortcut.Save()
