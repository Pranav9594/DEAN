# GitHub Push Script for Dean Appointment System
# Navigate to project directory
Set-Location "C:\Users\prana\Desktop\project 2"

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
Write-Host "Repository: https://github.com/Pranav9594/DEAN.git`n" -ForegroundColor Yellow

# Force push to replace remote content
Write-Host "Force pushing to main branch..." -ForegroundColor Green
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
    Write-Host "`nView your repository at:" -ForegroundColor Cyan
    Write-Host "https://github.com/Pranav9594/DEAN" -ForegroundColor Blue
    Write-Host "`nYou can now deploy on Vercel!" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Push failed. You may need to authenticate." -ForegroundColor Red
    Write-Host "Make sure you're logged into GitHub Desktop or have credentials configured." -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
