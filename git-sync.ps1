# Script simplificado - versão rápida sem confirmação
# Uso: .\git-sync.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$MensagemCommit
)

Write-Host "🚀 Sincronizando com GitHub..." -ForegroundColor Cyan

git add . 2>&1 | Out-Null
git commit -m $MensagemCommit 2>&1 | Out-Null

# Tentar push para master ou main
git push origin master 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    git push origin main 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Concluído! Aguarde alguns segundos para o Lovable sincronizar." -ForegroundColor Green
} else {
    Write-Host "❌ Erro no push. Execute manualmente: git push origin master" -ForegroundColor Red
}
