# Script PowerShell para fazer git add, commit e push de uma vez
# Uso: .\git-push-all.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$MensagemCommit
)

Write-Host "🚀 Iniciando processo de sincronização com GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos em um repositório Git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erro: Este diretório não é um repositório Git!" -ForegroundColor Red
    exit 1
}

# Verificar status antes de começar
Write-Host "📋 Verificando status do repositório..." -ForegroundColor Yellow
$status = git status --short

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  Nenhuma alteração detectada para commitar." -ForegroundColor Yellow
    Write-Host "   Verificando se há commits locais para enviar..." -ForegroundColor Yellow
    
    $branchStatus = git status -sb
    if ($branchStatus -match "ahead") {
        Write-Host "✅ Há commits locais para enviar. Fazendo push..." -ForegroundColor Green
        git push origin master
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao fazer push. Verifique sua conexão e permissões." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Tudo está sincronizado! Nada para fazer." -ForegroundColor Green
    }
    exit 0
}

# Mostrar o que será commitado
Write-Host "📝 Arquivos que serão commitados:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Perguntar confirmação
$confirma = Read-Host "Deseja continuar? (S/N)"
if ($confirma -ne "S" -and $confirma -ne "s" -and $confirma -ne "Y" -and $confirma -ne "y") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Passo 1: Adicionar arquivos
Write-Host "📦 Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Arquivos adicionados com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 2: Fazer commit
Write-Host "💾 Fazendo commit com mensagem: '$MensagemCommit'" -ForegroundColor Yellow
git commit -m $MensagemCommit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer commit." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 3: Verificar branch atual
$branch = git branch --show-current
Write-Host "🌿 Branch atual: $branch" -ForegroundColor Cyan

# Tentar push para master primeiro, depois main
Write-Host "📤 Enviando para o GitHub..." -ForegroundColor Yellow
$pushSuccess = $false

# Tentar master
git push origin master 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push para 'master' realizado com sucesso!" -ForegroundColor Green
    $pushSuccess = $true
} else {
    # Tentar main
    Write-Host "⚠️  Tentando branch 'main'..." -ForegroundColor Yellow
    git push origin main 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push para 'main' realizado com sucesso!" -ForegroundColor Green
        $pushSuccess = $true
    }
}

if (-not $pushSuccess) {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push. Possíveis causas:" -ForegroundColor Red
    Write-Host "   - Sem conexão com a internet" -ForegroundColor Red
    Write-Host "   - Sem permissões no repositório" -ForegroundColor Red
    Write-Host "   - Branch remota diferente da local" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tente executar manualmente:" -ForegroundColor Yellow
    Write-Host "   git push origin $branch" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Sincronização concluída com sucesso!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Alterações enviadas para o GitHub com sucesso!" -ForegroundColor Cyan
Write-Host ""
