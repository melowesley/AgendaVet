# 🔄 Como Sincronizar Alterações Locais com o Lovable

## ⚠️ Importante: Como Funciona a Sincronização

O **Lovable** sincroniza com o **repositório Git remoto** (GitHub), não com seu código local.

### Fluxo de Sincronização:

```
┌─────────────┐         ┌──────────┐         ┌──────────┐
│   Lovable   │ ──────► │  GitHub  │ ◄────── │  Local   │
│  (Editor)   │  Auto   │ (Repositório)      │ (Seu PC) │
└─────────────┘ Commit  └──────────┘  Push   └──────────┘
```

- **Lovable → GitHub**: Automático (quando você edita no Lovable)
- **Local → GitHub**: Manual (você precisa fazer commit + push)
- **GitHub → Lovable**: Automático (o Lovable lê do GitHub)

---

## ⚡ Método Rápido: Usar Scripts Automatizados

Criamos dois scripts PowerShell para facilitar sua vida! 🎉

### 🚀 Script Completo (Recomendado)
```powershell
.\git-push-all.ps1 "feat: adiciona novo componente"
```
**Características:**
- ✅ Mostra o que será commitado
- ✅ Pede confirmação antes de prosseguir
- ✅ Detecta automaticamente a branch (master/main)
- ✅ Mensagens de erro claras
- ✅ Mais seguro e informativo

### ⚡ Script Rápido (Sem Confirmação)
```powershell
.\git-sync.ps1 "feat: adiciona novo componente"
```
**Características:**
- ⚡ Mais rápido, sem confirmações
- ✅ Executa tudo de uma vez
- ✅ Ideal para quando você tem certeza

**Exemplo de uso:**
```powershell
# No PowerShell, dentro da pasta do projeto:
.\git-push-all.ps1 "feat: corrige bug no formulário de login"
```

---

## 📝 Passo a Passo Manual: Enviar Alterações Locais para o Lovable

### 1️⃣ Verificar o que foi alterado

```bash
git status
```

Isso mostra quais arquivos foram modificados.

### 2️⃣ Adicionar arquivos ao staging

```bash
# Adicionar todos os arquivos alterados
git add .

# OU adicionar arquivos específicos
git add src/components/MeuComponente.tsx
```

### 3️⃣ Fazer commit das alterações

```bash
git commit -m "Descrição das alterações feitas"
```

**Exemplos de mensagens:**
- `git commit -m "feat: adiciona novo componente de login"`
- `git commit -m "fix: corrige bug no formulário"`
- `git commit -m "style: melhora layout da página inicial"`

### 4️⃣ Enviar para o GitHub (push)

```bash
git push origin master
```

**OU se sua branch principal for `main`:**
```bash
git push origin main
```

### 5️⃣ Aguardar sincronização

Após o push:
- ⏱️ Aguarde alguns segundos (geralmente 10-30 segundos)
- 🔄 O Lovable sincroniza automaticamente com o GitHub
- ✅ Suas alterações aparecerão no Lovable

---

## 🚀 Comandos Rápidos (Tudo de Uma Vez)

Se você quer fazer tudo rapidamente:

```bash
# Ver o que mudou
git status

# Adicionar tudo, commitar e enviar
git add .
git commit -m "feat: minhas alterações"
git push origin master
```

---

## 🔍 Verificar se Funcionou

### No Terminal:
```bash
# Ver o último commit
git log --oneline -1

# Verificar se está sincronizado
git status
```

### No Lovable:
1. Abra seu projeto no Lovable
2. Aguarde alguns segundos
3. Verifique se suas alterações aparecem

---

## ⚠️ Problemas Comuns

### ❌ "Your branch is ahead of 'origin/master'"
**Solução:** Você fez commit local mas não fez push. Execute:
```bash
git push origin master
```

### ❌ "Your branch is behind 'origin/master'"
**Solução:** O Lovable fez alterações que você não tem localmente. Execute:
```bash
git pull origin master
```

### ❌ Conflitos de merge
**Solução:** Resolva os conflitos manualmente ou use:
```bash
git pull origin master
# Resolver conflitos
git add .
git commit -m "fix: resolve conflitos"
git push origin master
```

---

## 💡 Dica: Criar um Alias para Facilitar

Você pode criar um alias no PowerShell para facilitar:

```powershell
# Adicionar ao seu perfil PowerShell
function GitPushAll {
    git add .
    git commit -m $args[0]
    git push origin master
}

# Usar assim:
GitPushAll "feat: minhas alterações"
```

---

## 📚 Comandos Git Úteis

```bash
# Ver histórico de commits
git log --oneline -10

# Ver diferenças antes de commitar
git diff

# Ver o que está no staging
git diff --cached

# Desfazer alterações em um arquivo (CUIDADO!)
git checkout -- nome-do-arquivo.tsx

# Ver branches
git branch -a

# Criar uma nova branch
git checkout -b minha-nova-feature
```

---

## ✅ Checklist Antes de Fazer Push

- [ ] Testei minhas alterações localmente (`npm run dev`)
- [ ] Verifiquei o que será commitado (`git status`)
- [ ] Escrevi uma mensagem de commit descritiva
- [ ] Fiz pull antes do push (se necessário)
- [ ] Fiz push para o repositório remoto

---

**Lembre-se:** O Lovable só vê o que está no GitHub, então sempre faça push das suas alterações locais! 🚀
