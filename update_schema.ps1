$dir = "D:\Projects\Jewar\Backend-Services\NodeJS-Bun\CustomerProfile-Services"
$files = Get-ChildItem -Path $dir -Recurse -Include *.ts, *.js -Exclude *node_modules*

foreach ($file in $files) {
    if ($file.FullName -match "node_modules") { continue }
    $content = Get-Content $file.FullName -Raw
    $original = $content

    $content = $content -replace 'preferred_dishes', 'favorite_items'
    $content = $content -replace 'Dish', 'Product'

    if ($original -cne $content) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($file.FullName)"
    }
}
