# لیست پسوندها و فولدرهایی که باید فیلتر شوند
$excludedExtensions = @(
    # فایل‌های کامپایل شده
    ".exe", ".dll", ".pdb", ".cache",
    # فایل‌های موقت
    ".tmp", ".temp", ".log",
    # فایل‌های IDE
    ".suo", ".user", ".userosscache", ".sln.docstates",
    # فایل‌های کش
    ".jfm", ".dbmdl",
    # فایل‌های بایناری
    ".bin", ".obj",
    # فایل‌های VS Code
    ".vs"
)

$excludedFolders = @(
    # فولدرهای پکیج منیجر
    "node_modules",
    "packages",
    "vendor",
    "bin",
    "obj",
    ".git",
    ".vs",
    ".idea",
    "__pycache__",
    "venv",
    "dist",
    "build"
)

# دریافت مسیر از ورودی کاربر
$path = Read-Host "Please enter directory path (or . for current directory)"

# اگر ورودی نقطه بود، مسیر فعلی را استفاده کن
if ($path -eq ".") {
    $path = Get-Location
}

# ساخت نام فایل خروجی در همان مسیر
$outputFile = Join-Path $path "tree.txt"

# تابع برای بررسی اینکه آیا یک آیتم باید فیلتر شود یا خیر
function Should-Exclude {
    param (
        [System.IO.FileSystemInfo]$Item
    )
    
    if ($Item.PSIsContainer) {
        return $excludedFolders -contains $Item.Name
    }
    else {
        return $excludedExtensions -contains $Item.Extension.ToLower()
    }
}

# تابع بازگشتی برای ایجاد ساختار درختی
function Show-TreeStructure {
    param (
        [string]$Path,
        [string]$Indent = "",
        [System.IO.StreamWriter]$Writer
    )

    # دریافت همه آیتم‌ها در مسیر فعلی
    $items = Get-ChildItem -Path $Path | Where-Object { !(Should-Exclude $_) }

    foreach ($item in $items) {
        # نوشتن نام آیتم با تورفتگی مناسب
        $Writer.WriteLine("$Indent├── $($item.Name)")

        # اگر آیتم یک پوشه است، به صورت بازگشتی محتویات آن را نمایش بده
        if ($item.PSIsContainer) {
            Show-TreeStructure -Path $item.FullName -Indent "$Indent│   " -Writer $Writer
        }
    }
}

try {
    # ایجاد فایل خروجی
    $writer = New-Object System.IO.StreamWriter($outputFile)
    
    # نوشتن مسیر اصلی و لیست پسوندهای فیلتر شده در ابتدای فایل
    $writer.WriteLine($path)
    $writer.WriteLine("Excluded Extensions: $($excludedExtensions -join ', ')")
    $writer.WriteLine("Excluded Folders: $($excludedFolders -join ', ')")
    $writer.WriteLine("└───────────────────────────────────")
    
    # شروع ایجاد ساختار درختی
    Show-TreeStructure -Path $path -Writer $writer
    
    Write-Host "Tree structure has been saved to: $outputFile" -ForegroundColor Green
}
catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
}
finally {
    # بستن فایل
    if ($writer) {
        $writer.Close()
    }
}