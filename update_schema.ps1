$dir = "D:\Projects\Jewar\Backend-Services\NodeJS-Bun\ShopOwnerProfile-Services"
$files = Get-ChildItem -Path $dir -Recurse -Include *.ts, *.js

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content

    $content = $content -replace 'ChiefProfileSchema\.js', 'ShopOwnerProfileSchema.js'
    $content = $content -replace 'ChiefProfileSchema\.ts', 'ShopOwnerProfileSchema.ts'
    $content = $content -replace 'ChiefProfileSchema', 'ShopOwnerProfileSchema'
    $content = $content -replace 'kitchen_open', 'shop_open'
    $content = $content -replace 'kitchen_address', 'shop_address'
    $content = $content -replace 'Items_Can_Make_Status', 'Products_Status'
    $content = $content -replace 'Health_Certificate', 'Commercial_Register'
    $content = $content -replace 'Health_Certificate_Status', 'Commercial_Register_Status'
    
    # Optional: Update method names if they use HealthCertificate or KitchenStatus
    $content = $content -replace 'uploadHealthCertificate', 'uploadCommercialRegister'
    $content = $content -replace 'setKitchenStatus', 'setShopStatus'
    $content = $content -replace 'health-certificate', 'commercial-register'
    $content = $content -replace 'kitchen-status', 'shop-status'
    $content = $content -replace 'kitchenOpen', 'shopOpen'

    if ($original -cne $content) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($file.FullName)"
    }
}
