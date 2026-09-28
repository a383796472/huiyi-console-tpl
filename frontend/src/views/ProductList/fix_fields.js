const fs = require('fs');
const filepath = 'creatProduct.vue';
let content = fs.readFileSync(filepath, 'utf-8');

const replacements = {
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
};

for (const [old, rep] of Object.entries(replacements)) {
  content = content.split(old).join(rep);
}

content = content.replace(/^  name: ''/m, "  productName: ''");
content = content.replace('name: formData.productName,', 'productName: formData.productName,');
content = content.replace('productImages: JSON.stringify(productImages.value)', 'productImage: JSON.stringify(productImages.value)');
content = content.replace('brandImages: JSON.stringify(brandImages.value)', 'brandPackageImage: JSON.stringify(brandImages.value)');
content = content.replace("formData.productStatus = data.product_status.split(',')", "formData.productSupplying = data.product_status");

fs.writeFileSync(filepath, content, 'utf-8');
console.log('Done!');
