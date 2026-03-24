const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Iniciando geração do PDF Dark Mode...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, 'AgendaVet-Guia-Completo-DARK.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('📄 Carregando HTML...');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Espera as fontes do Google carregarem
  await new Promise(r => setTimeout(r, 3000));

  const outputPath = path.join(__dirname, 'AgendaVet-Guia-Completo-DARK.pdf');

  console.log('🖨️  Gerando PDF com fundo escuro...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,  // ESSENCIAL para manter o fundo escuro
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '10mm',
      right: '10mm',
    },
    displayHeaderFooter: false,
    preferCSSPageSize: false,
  });

  await browser.close();

  console.log('');
  console.log('✅ PDF Dark Mode gerado com sucesso!');
  console.log('📁 Arquivo: ' + outputPath);
  console.log('');
  console.log('🐾 Agora é só abrir no celular ou enviar pelo WhatsApp!');
})();
