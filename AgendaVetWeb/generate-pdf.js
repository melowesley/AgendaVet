const fs = require('fs');
const path = require('path');

// Read both markdown files
const guia1 = fs.readFileSync(path.join(__dirname, 'GUIA-AGENDAVET.md'), 'utf-8');
const guia2 = fs.readFileSync(path.join(__dirname, 'GUIA-IA-ENGENHARIA.md'), 'utf-8');

// Simple markdown to HTML converter
function mdToHtml(md) {
  let html = md
    // Code blocks with language
    .replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="code-block${lang ? ' lang-'+lang : ''}"><code>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;').trim()}</code></pre>`;
    })
    // Tables
    .replace(/\|(.+)\|\r?\n\|[-| :]+\|\r?\n((?:\|.+\|\r?\n?)*)/g, (match, header, body) => {
      const hCells = header.split('|').filter(c=>c.trim()).map(c=>`<th>${c.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(row => {
        const cells = row.split('|').filter(c=>c.trim()).map(c=>`<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<div class="table-wrap"><table><thead><tr>${hCells}</tr></thead><tbody>${rows}</tbody></table></div>`;
    })
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline">$1</code>')
    // Checkboxes
    .replace(/^- \[x\] (.+)$/gm, '<div class="check done">✅ $1</div>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="check">⬜ $1</div>')
    .replace(/^○ (.+)$/gm, '<div class="check">⬜ $1</div>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // List items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li><span class="num">$1.</span> $2</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Paragraphs
    .replace(/^(?!<[hbloudtp]|<pre|<div|<hr|<li|<block)((?!^\s*$).+)$/gm, '<p>$1</p>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return html;
}

function getStyles(isDark) {
  const bg = isDark ? '#0d1117' : '#ffffff';
  const bg2 = isDark ? '#161b22' : '#f6f8fa';
  const bg3 = isDark ? '#1c2333' : '#eef1f5';
  const text = isDark ? '#e6edf3' : '#1f2937';
  const text2 = isDark ? '#8b949e' : '#6b7280';
  const accent = '#00d4aa';
  const accent2 = '#7c3aed';
  const border = isDark ? '#30363d' : '#d1d5db';
  const codeBg = isDark ? '#0d1117' : '#1e1e2e';
  const codeText = isDark ? '#79c0ff' : '#a5d6ff';
  const tableBg = isDark ? '#1a2332' : '#f0f4f8';
  const tableHead = isDark ? 'linear-gradient(135deg, #00d4aa22, #7c3aed22)' : 'linear-gradient(135deg, #00d4aa15, #7c3aed15)';

  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    
    * { margin:0; padding:0; box-sizing:border-box; }
    
    @page { 
      size: A4; 
      margin: ${isDark ? '15mm' : '20mm'}; 
    }
    
    ${isDark ? '' : `
    @media print {
      body { background: #fff !important; }
      .page-break { page-break-before: always; }
      .no-print { display: none !important; }
    }`}
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: ${bg};
      color: ${text};
      line-height: 1.7;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 50px;
    }
    
    /* Cover Page */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 40%, ${accent}08, transparent 50%),
                  radial-gradient(circle at 70% 60%, ${accent2}08, transparent 50%);
    }
    .cover .logo {
      font-size: 72px;
      margin-bottom: 20px;
      filter: drop-shadow(0 0 30px ${accent}40);
    }
    .cover h1 {
      font-size: 42px;
      font-weight: 800;
      background: linear-gradient(135deg, ${accent}, ${accent2});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      letter-spacing: -1px;
    }
    .cover .subtitle {
      font-size: 18px;
      color: ${text2};
      font-weight: 300;
      margin-bottom: 40px;
    }
    .cover .meta {
      font-size: 12px;
      color: ${text2};
      border-top: 1px solid ${border};
      padding-top: 20px;
      margin-top: 40px;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      background: linear-gradient(135deg, ${accent}20, ${accent2}20);
      border: 1px solid ${accent}40;
      color: ${accent};
      margin-bottom: 30px;
    }
    
    /* Section divider */
    .section-divider {
      page-break-before: always;
      padding: 60px 0 30px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, ${accent}, ${accent2}, transparent) 1;
      margin-bottom: 30px;
    }
    .section-divider h2 {
      font-size: 28px;
    }
    
    /* Typography */
    h1 { font-size: 32px; font-weight: 800; margin: 40px 0 16px; color: ${isDark ? '#fff' : '#111'}; }
    h2 { 
      font-size: 24px; font-weight: 700; margin: 36px 0 16px; 
      padding-bottom: 8px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, ${accent}, ${accent2}, transparent) 1;
      color: ${isDark ? '#fff' : '#111'};
    }
    h3 { 
      font-size: 18px; font-weight: 600; margin: 28px 0 12px; 
      color: ${accent};
    }
    p { margin: 8px 0; color: ${text}; }
    a { color: ${accent}; text-decoration: none; border-bottom: 1px dashed ${accent}60; }
    strong { color: ${isDark ? '#fff' : '#111'}; font-weight: 600; }
    hr { 
      border: none; height: 1px; margin: 32px 0;
      background: linear-gradient(90deg, transparent, ${border}, transparent);
    }
    
    /* Lists */
    li { 
      margin: 4px 0; padding-left: 20px; list-style: none; position: relative;
    }
    li::before {
      content: '›';
      position: absolute; left: 4px; color: ${accent}; font-weight: 700;
    }
    .num { color: ${accent}; font-weight: 700; margin-right: 4px; }
    li .num + * { margin-left: 0; }
    li:has(.num)::before { display: none; }
    
    /* Code */
    .code-block {
      background: ${codeBg};
      border: 1px solid ${border};
      border-radius: 10px;
      padding: 16px 20px;
      margin: 14px 0;
      overflow-x: auto;
      font-size: 12.5px;
      line-height: 1.6;
      position: relative;
    }
    .code-block::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, ${accent}, ${accent2});
      border-radius: 10px 10px 0 0;
    }
    .code-block code {
      font-family: 'JetBrains Mono', monospace;
      color: ${codeText};
      white-space: pre-wrap;
      word-break: break-word;
    }
    code.inline {
      font-family: 'JetBrains Mono', monospace;
      background: ${isDark ? '#1c2333' : '#e8ecf1'};
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 12.5px;
      color: ${isDark ? '#ff7b72' : '#d63384'};
    }
    
    /* Tables */
    .table-wrap { overflow-x: auto; margin: 16px 0; border-radius: 10px; border: 1px solid ${border}; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead { background: ${tableHead}; }
    th { 
      padding: 10px 14px; text-align: left; font-weight: 600; 
      color: ${accent}; border-bottom: 2px solid ${accent}30;
      font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    td { padding: 9px 14px; border-bottom: 1px solid ${border}20; }
    tr:nth-child(even) { background: ${tableBg}; }
    tr:hover { background: ${accent}08; }
    
    /* Blockquote */
    blockquote {
      border-left: 3px solid ${accent};
      background: ${accent}08;
      padding: 14px 20px;
      margin: 16px 0;
      border-radius: 0 10px 10px 0;
      font-style: italic;
      color: ${text2};
    }
    
    /* Checkboxes */
    .check { 
      padding: 4px 0 4px 8px; font-size: 13.5px;
    }
    .check.done { color: ${accent}; }
    
    /* Part separator */
    .part-separator {
      page-break-before: always;
      text-align: center;
      padding: 80px 0;
    }
    .part-separator h1 {
      font-size: 36px;
      background: linear-gradient(135deg, ${accent}, ${accent2});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .part-separator .line {
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, ${accent}, ${accent2});
      margin: 20px auto;
      border-radius: 2px;
    }
    
    /* TOC */
    .toc {
      background: ${bg2};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 24px 30px;
      margin: 20px 0 30px;
    }
    .toc li { font-size: 13.5px; padding: 3px 0 3px 20px; }
    .toc li::before { content: '→'; color: ${accent2}; }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 40px 0 20px;
      color: ${text2};
      font-size: 11px;
      border-top: 1px solid ${border};
      margin-top: 40px;
    }
    .footer .gradient-text {
      background: linear-gradient(135deg, ${accent}, ${accent2});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
  `;
}

function buildPage(isDark) {
  const mode = isDark ? 'Leitura (Dark Mode)' : 'Impressão (Light Mode)';
  const content1 = mdToHtml(guia1);
  const content2 = mdToHtml(guia2);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgendaVet — Guia Completo | ${mode}</title>
  <style>${getStyles(isDark)}</style>
</head>
<body>
  <div class="container">
    <!-- COVER PAGE -->
    <div class="cover">
      <div class="logo">🐾</div>
      <div class="badge">Documentação Técnica Oficial</div>
      <h1>AgendaVet</h1>
      <p class="subtitle">Guia Completo do Fundador + Engenharia de IA</p>
      <p class="subtitle" style="font-size:14px; margin-top:-20px;">Sistema de Gestão para Clínicas Veterinárias</p>
      <div class="meta">
        <p>Versão Unificada — Março 2026</p>
        <p>Versão: ${isDark ? 'Digital (Dark Mode)' : 'Impressão (Light Mode)'}</p>
        <p style="margin-top:8px;">Gerado automaticamente • AgendaVet Platform</p>
      </div>
    </div>

    <!-- PART 1 -->
    <div class="part-separator">
      <p style="color:#8b949e;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Parte I</p>
      <h1>Guia do Fundador</h1>
      <div class="line"></div>
      <p style="color:#8b949e;font-size:14px;">Visão geral, arquitetura e operações do AgendaVet</p>
    </div>

    ${content1}

    <!-- PART 2 -->
    <div class="part-separator">
      <p style="color:#8b949e;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Parte II</p>
      <h1>Engenharia de IA</h1>
      <div class="line"></div>
      <p style="color:#8b949e;font-size:14px;">Do fundamento ao sistema autônomo — VetCopilot</p>
    </div>

    ${content2}

    <!-- FOOTER -->
    <div class="footer">
      <p>🐾 <span class="gradient-text">AgendaVet</span> — Sistema de Gestão Veterinária</p>
      <p style="margin-top:6px;">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} • Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;
}

// Generate both versions
const darkHtml = buildPage(true);
const lightHtml = buildPage(false);

const outDir = path.join(__dirname);
fs.writeFileSync(path.join(outDir, 'AgendaVet-Guia-Completo-DARK.html'), darkHtml, 'utf-8');
fs.writeFileSync(path.join(outDir, 'AgendaVet-Guia-Completo-PRINT.html'), lightHtml, 'utf-8');

console.log('');
console.log('✅ Arquivos gerados com sucesso!');
console.log('');
console.log('📄 AgendaVet-Guia-Completo-DARK.html  → Para leitura na tela (dark mode)');
console.log('📄 AgendaVet-Guia-Completo-PRINT.html  → Para impressão (light mode)');
console.log('');
console.log('📌 Como salvar em PDF:');
console.log('   1. Abra o arquivo .html no Chrome');
console.log('   2. Pressione Ctrl+P');
console.log('   3. Destino: "Salvar como PDF"');
console.log('   4. Margens: "Nenhuma" (para melhor resultado)');
console.log('   5. Marque "Gráficos de plano de fundo" (importante para o dark mode!)');
console.log('   6. Clique em "Salvar"');
console.log('');
