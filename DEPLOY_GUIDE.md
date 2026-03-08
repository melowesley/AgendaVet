# 🚀 Guia de Deploy: AgendaVet - Configuração de Domínios

## 📋 Visão Geral

Este guia explica como configurar o sistema de domínios unificado para hospedar os 3 sistemas AgendaVet (Web PWA + Apps Mobile) usando **um domínio principal** com subdomínios inteligentes.

## 🏗️ Arquitetura de Domínios

```
📱 agendavet.com (Domínio Principal)
├── 🌐 / (Web PWA - Interface principal)
├── 📱 /apps (Página de download dos apps)
├── 🔄 /redirect/tutor (Redirecionamento inteligente → App Tutor)
├── 🔄 /redirect/vet (Redirecionamento inteligente → App Vet)
├── 🐾 tutor.agendavet.com (Subdomínio - Versão web limitada do App Tutor)
└── 🩺 vet.agendavet.com (Subdomínio - Versão web limitada do App Vet)
```

## ⚙️ Configuração no Vercel

### Passo 1: Deploy do Projeto Web
```bash
# No diretório AgendaVetWeb
npm install
npm run build
```

### Passo 2: Configuração do Domínio Principal
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto `agendavet-web`
3. Vá para **Settings** → **Domains**
4. Adicione o domínio: `agendavet.com`
5. Configure os registros DNS conforme instruído pelo Vercel

### Passo 3: Configuração dos Subdomínios
No Vercel, adicione os subdomínios:

#### Subdomínio 1: `tutor.agendavet.com`
- **Source:** `tutor.agendavet.com`
- **Destination:** `agendavet.com/tutor-web`
- **Type:** Redirect (302)

#### Subdomínio 2: `vet.agendavet.com`
- **Source:** `vet.agendavet.com`
- **Destination:** `agendavet.com/vet-web`
- **Type:** Redirect (302)

#### Subdomínio 3: `app.agendavet.com` (Opcional)
- **Source:** `app.agendavet.com`
- **Destination:** `agendavet.com/apps`
- **Type:** Redirect (302)

## 🔧 Configuração Técnica Detalhada

### vercel.json (Já configurado)
```json
{
  "name": "agendavet-web",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/app/tutor",
      "destination": "/redirect/tutor"
    },
    {
      "source": "/app/vet",
      "destination": "/redirect/vet"
    },
    {
      "source": "/tutor/:path*",
      "destination": "/tutor-web/:path*"
    },
    {
      "source": "/vet/:path*",
      "destination": "/vet-web/:path*"
    }
  ],
  "redirects": [
    {
      "source": "/tutor",
      "destination": "/redirect/tutor",
      "permanent": false
    },
    {
      "source": "/vet",
      "destination": "/redirect/vet",
      "permanent": false
    }
  ]
}
```

### Deep Links dos Apps Mobile
Certifique-se de que os apps estão configurados com os schemes corretos:

#### App Tutor (`app.json`):
```json
{
  "expo": {
    "scheme": "agendavettutorapp"
  }
}
```

#### App Vet (`app.json`):
```json
{
  "expo": {
    "scheme": "agendavetvetapp"
  }
}
```

## 📱 Fluxo de Redirecionamento Inteligente

### 1. Usuário acessa `agendavet.com`
- ✅ Carrega a Web PWA completa
- ✅ Interface principal com todas as funcionalidades

### 2. Usuário clica "Abrir App Tutor" na Web PWA
- 📱 **Mobile:** Tenta abrir `agendavettutorapp://`
- 🖥️ **Desktop:** Redireciona para `tutor.agendavet.com`
- 📥 **Fallback:** Se app não instalado, vai para App Store

### 3. Mesmo fluxo para App Vet
- 📱 **Mobile:** Tenta abrir `agendavetvetapp://`
- 🖥️ **Desktop:** Redireciona para `vet.agendavet.com`
- 📥 **Fallback:** Se app não instalado, vai para App Store

## 🧪 Testes de Configuração

### Teste 1: Domínio Principal
```bash
curl -I https://agendavet.com
# Deve retornar 200 OK
```

### Teste 2: Subdomínios
```bash
curl -I https://tutor.agendavet.com
# Deve redirecionar para https://agendavet.com/tutor-web

curl -I https://vet.agendavet.com
# Deve redirecionar para https://agendavet.com/vet-web
```

### Teste 3: Redirecionamentos Internos
```bash
curl -I https://agendavet.com/app/tutor
# Deve carregar /redirect/tutor

curl -I https://agendavet.com/apps
# Deve carregar página de downloads
```

## 🚀 Próximos Passos

### 1. Registrar Domínio
- Compre `agendavet.com` em provedor de domínio (GoDaddy, Namecheap, etc.)
- Configure DNS conforme instruções do Vercel

### 2. Deploy dos Apps Mobile
- Publique App Tutor na Play Store e App Store
- Publique App Vet na Play Store e App Store
- Atualize os links de download nas páginas

### 3. Configuração Final
- Teste todos os redirecionamentos
- Configure SSL (automático no Vercel)
- Configure analytics e monitoramento

## 🔍 Monitoramento e Analytics

### Métricas Importantes:
- **Conversão:** Usuários que instalam apps via web
- **Engajamento:** Tempo gasto em cada versão (web vs app)
- **Performance:** Tempo de carregamento dos redirecionamentos

### Ferramentas Recomendadas:
- **Google Analytics:** Para rastrear comportamento dos usuários
- **Vercel Analytics:** Para métricas de performance
- **Firebase Crashlytics:** Para monitorar crashes nos apps

## 🆘 Troubleshooting

### Problema: Subdomínios não redirecionam
**Solução:** Verifique se os registros CNAME estão corretos no provedor de domínio

### Problema: Apps não abrem via deep link
**Solução:** Verifique se os schemes estão corretos no `app.json`

### Problema: Páginas web limitadas não carregam
**Solução:** Verifique se as rotas estão corretas no Next.js

## 📞 Suporte

Se encontrar problemas durante a configuração:

1. Verifique os logs do Vercel
2. Teste com ferramentas online de DNS
3. Confirme que os apps estão publicados corretamente
4. Verifique a configuração do Supabase (autenticação unificada)

---

**🎉 Pronto!** Com esta configuração, você terá um sistema unificado e profissional hospedado em um único domínio com redirecionamentos inteligentes para todos os usuários.
