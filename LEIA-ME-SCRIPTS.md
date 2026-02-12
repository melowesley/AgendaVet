# 🚀 Scripts de Sincronização com GitHub/Lovable

Dois scripts PowerShell foram criados para facilitar o envio de suas alterações para o GitHub (e consequentemente para o Lovable).

---

## 📋 Scripts Disponíveis

### 1. `git-push-all.ps1` - Script Completo (Recomendado)

**Uso:**
```powershell
.\git-push-all.ps1 "mensagem do commit"
```

**Características:**
- ✅ Mostra quais arquivos serão commitados
- ✅ Pede confirmação antes de prosseguir
- ✅ Detecta automaticamente a branch (master/main)
- ✅ Mensagens de erro claras e úteis
- ✅ Mais seguro e informativo

**Exemplo:**
```powershell
.\git-push-all.ps1 "feat: adiciona componente de login"
```

---

### 2. `git-sync.ps1` - Script Rápido

**Uso:**
```powershell
.\git-sync.ps1 "mensagem do commit"
```

**Características:**
- ⚡ Execução rápida, sem confirmações
- ✅ Executa tudo de uma vez (add, commit, push)
- ✅ Ideal quando você tem certeza das alterações

**Exemplo:**
```powershell
.\git-sync.ps1 "fix: corrige bug no formulário"
```

---

## 🎯 Como Usar

### Passo 1: Abra o PowerShell
- Pressione `Win + X` e escolha "Windows PowerShell"
- OU pressione `Win + R`, digite `powershell` e pressione Enter

### Passo 2: Navegue até a pasta do projeto
```powershell
cd "C:\Users\Computador\OneDrive\Desktop\pet-care-companion-main"
```

### Passo 3: Execute o script
```powershell
.\git-push-all.ps1 "sua mensagem de commit aqui"
```

### Passo 4: Aguarde
- O script fará tudo automaticamente
- Aguarde 10-30 segundos após o push
- O Lovable sincronizará automaticamente

---

## 💡 Dicas de Mensagens de Commit

Use mensagens descritivas seguindo o padrão:

- `feat: adiciona novo componente de login`
- `fix: corrige bug no cálculo de preço`
- `style: melhora layout da página inicial`
- `refactor: reorganiza estrutura de pastas`
- `docs: atualiza documentação`

---

## ⚠️ Solução de Problemas

### Erro: "execution of scripts is disabled"
**Solução:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "não é reconhecido como cmdlet"
**Solução:** Certifique-se de estar na pasta correta do projeto e que o arquivo `.ps1` existe.

### Erro no push
**Solução:** Verifique:
- Conexão com internet
- Credenciais do GitHub configuradas
- Permissões no repositório

---

## 📚 Alternativa Manual

Se preferir fazer manualmente:

```powershell
git add .
git commit -m "sua mensagem"
git push origin master
```

---

**Pronto! Agora é só usar os scripts e suas alterações aparecerão no Lovable automaticamente! 🎉**
