# DirectoryTreeGenerator.ps1

# Global Variables
$script:config = @{
    ColorScheme = @{
        Folder = "Blue"
        File = "White"
        Header = "Cyan"
        Statistics = "Yellow"
    }
    ExcludedExtensions = @('.tmp', '.log')
    ExcludedFolders = @('node_modules', '.git', '.vs')
    ExportFormat = "txt"
    ShowHiddenFiles = $false
    MaxDepth = -1
    Version = "1.0.0"
    Author = "Your Name"
    GitHubUrl = "https://github.com/yourusername/DirectoryTreeGenerator"
}

$script:stats = @{
    TotalFiles = 0
    TotalFolders = 0
    TotalSize = 0
    StartTime = $null
    EndTime = $null
}

# Helper Functions
function Should-Exclude {
    param (
        [System.IO.FileSystemInfo]$Item
    )
    
    if (!$config.ShowHiddenFiles -and $Item.Attributes -band [System.IO.FileAttributes]::Hidden) {
        return $true
    }
    
    if ($Item.PSIsContainer) {
        return $config.ExcludedFolders -contains $Item.Name
    }
    else {
        return $config.ExcludedExtensions -contains $Item.Extension
    }
}

function Get-DirectoryStats {
    param ([string]$Path)
    
    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        if (!(Should-Exclude $item)) {
            if ($item.PSIsContainer) {
                $script:stats.TotalFolders++
                Get-DirectoryStats -Path $item.FullName
            }
            else {
                $script:stats.TotalFiles++
                $script:stats.TotalSize += $item.Length
            }
        }
    }
}

function Show-TreeWithProgress {
    param (
        [string]$Path,
        [string]$Indent = "",
        [System.IO.StreamWriter]$Writer
    )
    
    try {
        $items = Get-ChildItem -Path $Path | Where-Object { !(Should-Exclude $_) }
        $totalItems = $items.Count
        $current = 0
        
        foreach ($item in $items) {
            $current++
            $percentComplete = ($current / $totalItems) * 100
            Write-Progress -Activity "Generating Tree Structure" -Status "$($item.Name)" -PercentComplete $percentComplete
            
            if ($item.PSIsContainer) {
                $Writer.WriteLine("$Indent├── $($item.Name)") | Write-Host -ForegroundColor $config.ColorScheme.Folder
                Show-TreeWithProgress -Path $item.FullName -Indent "$Indent│   " -Writer $Writer
            }
            else {
                $Writer.WriteLine("$Indent├── $($item.Name)") | Write-Host -ForegroundColor $config.ColorScheme.File
            }
        }
    }
    finally {
        if ($Indent -eq "") {
            Write-Progress -Activity "Generating Tree Structure" -Completed
        }
    }
}

# Export Functions
function Export-TextTree {
    param (
        [string]$Path,
        [System.IO.StreamWriter]$Writer
    )
    
    try {
        if (!(Test-Path $Path)) {
            throw "Path does not exist: $Path"
        }

        # Reset statistics
        $script:stats.TotalFiles = 0
        $script:stats.TotalFolders = 0
        $script:stats.TotalSize = 0
        $script:stats.StartTime = Get-Date
        
        # Calculate statistics first
        Get-DirectoryStats -Path $Path
        $script:stats.EndTime = Get-Date

        # Write header and statistics
        $Writer.WriteLine("Directory Tree Generated on $(Get-Date)")
        $Writer.WriteLine("Path: $Path")
        $Writer.WriteLine("─────────────────────────")
        $Writer.WriteLine("Statistics:")
        $Writer.WriteLine("Total Files: $($stats.TotalFiles)")
        $Writer.WriteLine("Total Folders: $($stats.TotalFolders)")
        $Writer.WriteLine("Total Size: $([math]::Round($stats.TotalSize / 1MB, 2)) MB")
        $Writer.WriteLine("Duration: $(($stats.EndTime - $stats.StartTime).TotalSeconds) seconds")
        $Writer.WriteLine("─────────────────────────`n")

        # Generate tree structure
        Show-TreeWithProgress -Path $Path -Writer $Writer
    }
    catch {
        Write-Host "Error exporting to text: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Write-Progress -Activity "Generating Tree Structure" -Completed
    }
}

function Export-HTMLTree {
    param (
        [string]$Path,
        [string]$OutputFile
    )
    
    try {
        if (!(Test-Path $Path)) {
            throw "Path does not exist: $Path"
        }

        # Reset and calculate statistics
        $script:stats.TotalFiles = 0
        $script:stats.TotalFolders = 0
        $script:stats.TotalSize = 0
        $script:stats.StartTime = Get-Date
        Get-DirectoryStats -Path $Path
        $script:stats.EndTime = Get-Date

        $html = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Directory Tree Structure</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 20px;
            color: #333;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .stats {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .tree {
            font-family: 'Consolas', monospace;
            margin-left: 20px;
        }
        .tree ul {
            list-style: none;
            padding-left: 20px;
        }
        .folder {
            color: #2980b9;
            font-weight: bold;
            cursor: pointer;
        }
        .file {
            color: #2c3e50;
        }
        .folder::before {
            content: "📁";
            margin-right: 5px;
        }
        .file::before {
            content: "📄";
            margin-right: 5px;
        }
        .size {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-left: 10px;
        }
        .timestamp {
            color: #95a5a6;
            font-size: 0.8em;
            margin-left: 10px;
        }
    </style>
    <script>
        function toggleFolder(element) {
            const ul = element.nextElementSibling;
            if (ul) {
                ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
            }
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Directory Tree Structure</h1>
            <p>Generated on: $(Get-Date)</p>
            <p>Path: $Path</p>
        </div>
        
        <div class="stats">
            <h2>Statistics</h2>
            <p>Total Files: $($stats.TotalFiles)</p>
            <p>Total Folders: $($stats.TotalFolders)</p>
            <p>Total Size: $([math]::Round($stats.TotalSize / 1MB, 2)) MB</p>
            <p>Duration: $(($stats.EndTime - $stats.StartTime).TotalSeconds) seconds</p>
        </div>
        
        <div class="tree">
"@
    
        function Add-HTMLTreeNode {
            param (
                [string]$Path,
                [int]$Level = 0
            )
            
            $indent = "    " * $Level
            $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | 
                    Where-Object { !(Should-Exclude $_) }
            
            $html = "<ul>`n"
            foreach ($item in $items) {
                $size = if (!$item.PSIsContainer) { 
                    $sizeInKB = [math]::Round($item.Length / 1KB, 2)
                    "<span class='size'>($sizeInKB KB)</span>" 
                } else { "" }
                
                $timestamp = "<span class='timestamp'>$(($item.LastWriteTime).ToString('yyyy-MM-dd HH:mm'))</span>"
                
                if ($item.PSIsContainer) {
                    $html += "$indent<li><span class='folder' onclick='toggleFolder(this)'>$($item.Name)</span>$timestamp`n"
                    $html += (Add-HTMLTreeNode -Path $item.FullName -Level ($Level + 1))
                    $html += "$indent</li>`n"
                } else {
                    $html += "$indent<li><span class='file'>$($item.Name)</span>$size$timestamp</li>`n"
                }
            }
            $html += "$indent</ul>`n"
            return $html
        }
        
        $html += Add-HTMLTreeNode -Path $Path
        
        $html += @"
        </div>
    </div>
</body>
</html>
"@
        
        $html | Out-File -FilePath $OutputFile -Encoding UTF8
        return $true
    }
    catch {
        Write-Host "Error exporting to HTML: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Write-Progress -Activity "Generating Tree Structure" -Completed
    }
}

function Export-JSONTree {
    param (
        [string]$Path,
        [string]$OutputFile
    )
    
    try {
        if (!(Test-Path $Path)) {
            throw "Path does not exist: $Path"
        }

        function Get-TreeNode {
            param ([string]$Path)
            
            $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue |
                    Where-Object { !(Should-Exclude $_) }
            
            $nodes = @()
            foreach ($item in $items) {
                $node = @{
                    name = $item.Name
                    type = if ($item.PSIsContainer) { "folder" } else { "file" }
                    size = if (!$item.PSIsContainer) { $item.Length } else { $null }
                    lastModified = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
                }
                
                if ($item.PSIsContainer) {
                    $node.children = @(Get-TreeNode -Path $item.FullName)
                }
                
                $nodes += $node
            }
            
            return $nodes
        }

        # Reset and calculate statistics
        $script:stats.TotalFiles = 0
        $script:stats.TotalFolders = 0
        $script:stats.TotalSize = 0
        $script:stats.StartTime = Get-Date
        Get-DirectoryStats -Path $Path
        $script:stats.EndTime = Get-Date

        $treeData = @{
            metadata = @{
                generatedOn = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                path = $Path
                statistics = @{
                    totalFiles = $stats.TotalFiles
                    totalFolders = $stats.TotalFolders
                    totalSize = $stats.TotalSize
                    duration = ($stats.EndTime - $stats.StartTime).TotalSeconds
                }
            }
            tree = @(Get-TreeNode -Path $Path)
        }

        $treeData | ConvertTo-Json -Depth 100 | Out-File -FilePath $OutputFile -Encoding UTF8
        return $true
    }
    catch {
        Write-Host "Error exporting to JSON: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Write-Progress -Activity "Generating Tree Structure" -Completed
    }
}

# Menu Functions
function Show-Menu {
    Clear-Host
    Write-Host "=== Directory Tree Generator ===" -ForegroundColor $config.ColorScheme.Header
    Write-Host "1. Generate tree structure" -ForegroundColor Green
    Write-Host "2. Customize excluded extensions" -ForegroundColor Green
    Write-Host "3. Customize excluded folders" -ForegroundColor Green
    Write-Host "4. Change color scheme" -ForegroundColor Green
    Write-Host "5. Change export format (txt/html/json)" -ForegroundColor Green
    Write-Host "6. View current settings" -ForegroundColor Green
    Write-Host "7. About / GitHub" -ForegroundColor Cyan
    Write-Host "8. Exit" -ForegroundColor Red
    Write-Host "================================" -ForegroundColor $config.ColorScheme.Header
    
    try {
        $choice = Read-Host "Please enter your choice (1-8)"
        if ($choice -notmatch '^[1-8]$') {
            throw "Invalid choice. Please enter a number between 1 and 8."
        }
        return $choice
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return Show-Menu
    }
}

function Get-FolderPath {
    Clear-Host
    Write-Host "Enter the folder path:" -ForegroundColor $config.ColorScheme.Header
    Write-Host "Enter '.' to use current directory" -ForegroundColor Yellow
    Write-Host "Example: C:\Users\Username\Documents" -ForegroundColor Gray
    
    $manualPath = Read-Host "`nPath"
    
    if ([string]::IsNullOrWhiteSpace($manualPath)) {
        Write-Host "Path cannot be empty!" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return Get-FolderPath
    }
    
    # اگر نقطه وارد شد، مسیر جاری برگردانده شود
    if ($manualPath -eq ".") {
        $currentPath = $PSScriptRoot
        if ([string]::IsNullOrEmpty($currentPath)) {
            $currentPath = (Get-Location).Path
        }
        Write-Host "Using current directory: $currentPath" -ForegroundColor Green
        Start-Sleep -Seconds 1
        return $currentPath
    }
    
    # چک کردن مسیر وارد شده
    if (Test-Path $manualPath -PathType Container) {
        return $manualPath
    }
    else {
        Write-Host "Invalid path or folder does not exist!" -ForegroundColor Red
        Write-Host "Press any key to try again..."
        $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
        return Get-FolderPath
    }
}

function Edit-ExcludedExtensions {
    Clear-Host
    Write-Host "Current excluded extensions: $($config.ExcludedExtensions -join ', ')" -ForegroundColor Yellow
    Write-Host "Enter new extensions (comma-separated, include dot, e.g. '.tmp,.log')"
    $input = Read-Host "Leave blank to keep current"
    
    if ($input) {
        $config.ExcludedExtensions = $input.Split(',').Trim()
        Write-Host "Excluded extensions updated!" -ForegroundColor Green
    }
    pause
}

function Edit-ExcludedFolders {
    Clear-Host
    Write-Host "Current excluded folders: $($config.ExcludedFolders -join ', ')" -ForegroundColor Yellow
    Write-Host "Enter new folder names (comma-separated, e.g. 'node_modules,.git')"
    $input = Read-Host "Leave blank to keep current"
    
    if ($input) {
        $config.ExcludedFolders = $input.Split(',').Trim()
        Write-Host "Excluded folders updated!" -ForegroundColor Green
    }
    pause
}

function Edit-ColorScheme {
    Clear-Host
    Write-Host "Available colors: Black, Blue, Cyan, DarkBlue, DarkCyan, DarkGray, DarkGreen, DarkMagenta, DarkRed, DarkYellow, Gray, Green, Magenta, Red, White, Yellow"
    Write-Host "`nCurrent color scheme:"
    Write-Host "1. Folder: $($config.ColorScheme.Folder)"
    Write-Host "2. File: $($config.ColorScheme.File)"
    Write-Host "3. Header: $($config.ColorScheme.Header)"
    Write-Host "4. Back to main menu"
    
    $choice = Read-Host "`nSelect item to change (1-4)"
    switch ($choice) {
        "1" {
            $color = Read-Host "Enter new color for folders"
            $config.ColorScheme.Folder = $color
        }
        "2" {
            $color = Read-Host "Enter new color for files"
            $config.ColorScheme.File = $color
        }
        "3" {
            $color = Read-Host "Enter new color for headers"
            $config.ColorScheme.Header = $color
        }
        "4" { return }
    }
    
    Write-Host "Color scheme updated!" -ForegroundColor Green
    pause
}

function Edit-ExportFormat {
    Clear-Host
    Write-Host "Current export format: $($config.ExportFormat)"
    Write-Host "Available formats:"
    Write-Host "1. Text (txt)"
    Write-Host "2. HTML (html)"
    Write-Host "3. JSON (json)"
    
    $choice = Read-Host "Select format (1-3)"
    switch ($choice) {
        "1" { $config.ExportFormat = "txt" }
        "2" { $config.ExportFormat = "html" }
        "3" { $config.ExportFormat = "json" }
        default { 
            Write-Host "Invalid choice. Keeping current format." -ForegroundColor Red
            pause
            return
        }
    }
    
    Write-Host "Export format updated to $($config.ExportFormat)!" -ForegroundColor Green
    pause
}

function Show-CurrentSettings {
    Clear-Host
    Write-Host "Current Settings:" -ForegroundColor $config.ColorScheme.Header
    Write-Host "─────────────────────────"
    Write-Host "Export Format: $($config.ExportFormat)"
    Write-Host "Color Scheme:"
    Write-Host "  - Folder: $($config.ColorScheme.Folder)"
    Write-Host "  - File: $($config.ColorScheme.File)"
    Write-Host "  - Header: $($config.ColorScheme.Header)"
    Write-Host "Excluded Extensions: $($config.ExcludedExtensions -join ', ')"
    Write-Host "Excluded Folders: $($config.ExcludedFolders -join ', ')"
    Write-Host "Show Hidden Files: $($config.ShowHiddenFiles)"
    Write-Host "─────────────────────────"
    pause
}

function Open-GitHub {
    $githubUrl = $config.GitHubUrl
    try {
        Write-Host "`nDirectory Tree Generator" -ForegroundColor Cyan
        Write-Host "Version: $($config.Version)" -ForegroundColor Gray
        Write-Host "Created by: $($config.Author)" -ForegroundColor Gray
        Write-Host "GitHub: $githubUrl" -ForegroundColor Blue
        Write-Host "`nOpening GitHub repository in your default browser..." -ForegroundColor Yellow
        
        Start-Process $githubUrl
    }
    catch {
        Write-Host "Error opening GitHub: $_" -ForegroundColor Red
    }
    pause
}

# Main Program Loop
do {
    $choice = Show-Menu
    switch ($choice) {
        "1" {
            $path = Get-FolderPath
            if ($path) {
                $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
                $outputFile = Join-Path $path "tree_$timestamp.$($config.ExportFormat)"
                
                switch ($config.ExportFormat) {
                    "txt" {
                        $writer = New-Object System.IO.StreamWriter($outputFile)
                        Export-TextTree -Path $path -Writer $writer
                        $writer.Close()
                    }
                    "html" {
                        Export-HTMLTree -Path $path -OutputFile $outputFile
                    }
                    "json" {
                        Export-JSONTree -Path $path -OutputFile $outputFile
                    }
                }
                
                Write-Host "`nTree structure exported to: $outputFile" -ForegroundColor Green
                pause
            }
        }
        "2" { Edit-ExcludedExtensions }
        "3" { Edit-ExcludedFolders }
        "4" { Edit-ColorScheme }
        "5" { Edit-ExportFormat }
        "6" { Show-CurrentSettings }
        "7" { Open-GitHub }
        "8" { 
            Write-Host "Thank you for using Directory Tree Generator!" -ForegroundColor Green
            return 
        }
    }
} while ($true)