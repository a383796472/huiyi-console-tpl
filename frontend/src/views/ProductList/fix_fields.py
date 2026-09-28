import re

filepath = r'creatProduct.vue'

with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# formData reactive object property names
replacements = {
    'suggestedSalePrice:': 'suggestedPrice:',
    'suggestedSalePrice1:': 'suggestedPrice1:',
    'competitorPriceUsSp:': 'competitorPriceSp:',
    'competitorPriceUsQuadlock:': 'competitorPriceQl:',
    'competitorPriceUsSpLabel:': 'competitorPriceSpNum:',
    'competitorPriceUsQlLabel:': 'competitorPriceQlNum:',
    'specifications:': 'specs:',
    'packagingEnglishName:': 'packageEnglishName:',
    'packagingSizeMm:': 'packagingSize:',
    'innerBoxSizeMm:': 'innerBoxSize:',
    'outerBoxSizeMm:': 'outerBoxSize:',
    'innerSkuCodeIcs:': 'innerBoxSku:',
    'outerSkuCodeMcs:': 'outerBoxSku:',
    'innerBarcodeIcb:': 'innerBarcode:',
    'productSupplyStatus:': 'productSupplying:',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Fix the 'name' property in reactive object only
content = re.sub(r'^\s+name:\s+\'\'', '  productName: \\'\\'', content, flags=re.MULTILINE)

# Fix submitData 'name' key
content = content.replace('name: formData.productName,', 'productName: formData.productName,')

# submitData image fields
content = content.replace('productImages: JSON.stringify(productImages.value)', 'productImage: JSON.stringify(productImages.value)')
content = content.replace('brandImages: JSON.stringify(brandImages.value)', 'brandPackageImage: JSON.stringify(brandImages.value)')

# fetchProductDetail: update special case for product_status
old_fetch = "formData.productStatus = data.product_status.split(',')"
new_fetch = "formData.productSupplying = data.product_status"
content = content.replace(old_fetch, new_fetch)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
