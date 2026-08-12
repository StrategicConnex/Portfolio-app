$ErrorActionPreference="Stop"
$root=Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$target=Join-Path $HOME ".sc-platform-universal-ai-skill"
if(Test-Path $target){Remove-Item $target -Recurse -Force}
Copy-Item $root $target -Recurse
Write-Host "Installed to $target"
