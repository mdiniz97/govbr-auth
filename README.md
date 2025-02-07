# GOV.BR Authentication Library

[![npm version](https://badge.fury.io/js/govbr-auth.svg)](https://badge.fury.io/js/govbr-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README-en.md) | Português

Uma biblioteca em TypeScript/JavaScript para integração com os serviços de autenticação do GOV.BR.

## 🚀 Recursos

- ✨ Suporte completo a TypeScript
- 🔒 Implementação PKCE para segurança aprimorada
- 🌐 Suporte a ambientes de homologação e produção
- 🔄 Gerenciamento completo do fluxo OAuth 2.0 e OpenID Connect
- 🌟 Níveis de confiabilidade e selos
- 📡 Gerenciamento de requisições com Axios

## 📦 Instalação

```bash
npm install govbr-auth
```

## 🎯 Casos de Uso

### 1. Autenticação Básica

```typescript
import { GovBRAuth } from 'govbr-auth';

// Inicializar o cliente
const auth = new GovBRAuth({
  clientId: 'seu-client-id',
  clientSecret: 'seu-client-secret',
  redirectUri: 'https://sua-aplicacao.com/callback',
  environment: 'staging' // ou 'production'
});

// 1. Gerar URL de autorização e redirecionar o usuário
const authUrl = auth.generateAuthorizationUrl();
// Redirecionar para authUrl

// 2. No callback, trocar o código por tokens
const tokens = await auth.getTokens(code, codeVerifier);

// 3. Obter informações do usuário
const userInfo = await auth.getUserInfo(tokens.access_token);
```

### 2. Verificação de Confiabilidade

```typescript
// Obter níveis de confiabilidade
const niveis = await auth.getConfiabilidadeNiveis(tokens.access_token, userInfo.sub);

// Obter selos de confiabilidade
const selos = await auth.getConfiabilidadeSelos(tokens.access_token, userInfo.sub);

// Verificar nível específico
const temNivelPrata = niveis.some((nivel) => nivel.id === 'prata');
```

### 3. Logout

```typescript
const logoutUrl = auth.generateLogoutUrl('https://sua-aplicacao.com');
// Redirecionar para logoutUrl
```

## 📚 API Completa

### `GovBRAuth`

#### Construtor

```typescript
const auth = new GovBRAuth({
  clientId: 'seu-client-id',
  clientSecret: 'seu-client-secret',
  redirectUri: 'https://sua-aplicacao.com/callback',
  environment: 'production', // opcional, padrão: 'production'
  scopes: ['openid', 'email', 'profile'] // opcional
});
```

#### Métodos

##### `generateAuthorizationUrl()`

Gera a URL de autorização para iniciar o fluxo de login.

```typescript
// Uso básico
const url = auth.generateAuthorizationUrl();

// Com parâmetros personalizados
const url = auth.generateAuthorizationUrl({
  state: 'estado-personalizado',
  nonce: 'nonce-personalizado'
});

// Exemplo de uso com Express
app.get('/login', (req, res) => {
  const state = generateState();
  req.session.state = state;

  const url = auth.generateAuthorizationUrl({ state });
  res.redirect(url);
});
```

##### `getTokens()`

Troca o código de autorização por tokens de acesso.

```typescript
// No callback do OAuth
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const { codeVerifier } = req.session;

  try {
    const tokens = await auth.getTokens(code, codeVerifier);
    // tokens.access_token - Token para acessar recursos
    // tokens.id_token - Token com informações do usuário
    // tokens.expires_in - Tempo de expiração em segundos
  } catch (error) {
    console.error('Erro ao obter tokens:', error);
  }
});
```

##### `getUserInfo()`

Obtém informações do usuário autenticado.

```typescript
// Exemplo de uso com validação de email
const userInfo = await auth.getUserInfo(accessToken);

if (!userInfo.email_verified) {
  throw new Error('Email não verificado');
}

// Exemplo de uso com nome social
const displayName = userInfo.social_name || userInfo.name;

// Exemplo de perfil completo
const profile = {
  id: userInfo.sub,
  name: userInfo.name,
  email: userInfo.email,
  picture: userInfo.picture,
  socialName: userInfo.social_name,
  phoneNumber: userInfo.phone_number,
  phoneVerified: userInfo.phone_number_verified
};
```

##### `getConfiabilidadeNiveis()`

Obtém e verifica os níveis de confiabilidade do usuário.

```typescript
// Verificação de nível mínimo de segurança
const niveis = await auth.getConfiabilidadeNiveis(accessToken, userInfo.sub);

const nivelMinimo = {
  bronze: niveis.some((n) => n.id === 'bronze'),
  prata: niveis.some((n) => n.id === 'prata'),
  ouro: niveis.some((n) => n.id === 'ouro')
};

// Exemplo de middleware de autorização
function requireTrustLevel(level) {
  return async (req, res, next) => {
    const niveis = await auth.getConfiabilidadeNiveis(
      req.session.accessToken,
      req.session.user.sub
    );

    if (!niveis.some((n) => n.id === level)) {
      return res.status(403).json({
        error: 'Nível de confiabilidade insuficiente'
      });
    }

    next();
  };
}

// Uso do middleware
app.get('/area-segura', requireTrustLevel('prata'), (req, res) => {
  res.json({ message: 'Acesso autorizado' });
});
```

##### `getConfiabilidadeSelos()`

Obtém e verifica os selos de confiabilidade do usuário.

```typescript
// Verificação de selos específicos
const selos = await auth.getConfiabilidadeSelos(accessToken, userInfo.sub);

const temCertificadoDigital = selos.some((selo) => selo.id === 'certificado_digital');

// Exemplo de verificação múltipla
const verificacoes = {
  certificadoDigital: selos.some((s) => s.id === 'certificado_digital'),
  validacaoBiometrica: selos.some((s) => s.id === 'validacao_biometrica'),
  validacaoFacial: selos.some((s) => s.id === 'validacao_facial'),
  bancoCadastrado: selos.some((s) => s.id === 'banco_cadastrado')
};

// Exemplo de uso em rota protegida
app.post('/assinatura-digital', async (req, res) => {
  const selos = await auth.getConfiabilidadeSelos(req.session.accessToken, req.session.user.sub);

  if (!selos.some((s) => s.id === 'certificado_digital')) {
    return res.status(403).json({
      error: 'Certificado digital necessário'
    });
  }

  // Processa a assinatura digital
});
```

##### `generateLogoutUrl()`

Gera a URL para realizar o logout do usuário.

```typescript
// Logout básico
app.get('/logout', (req, res) => {
  const logoutUrl = auth.generateLogoutUrl('https://sua-aplicacao.com');

  req.session.destroy(() => {
    res.redirect(logoutUrl);
  });
});

// Logout com callback personalizado
app.get('/logout', (req, res) => {
  const logoutUrl = auth.generateLogoutUrl('https://sua-aplicacao.com/pos-logout');

  // Limpa dados da sessão
  req.session.destroy(() => {
    res.redirect(logoutUrl);
  });
});

// Tratamento pós-logout
app.get('/pos-logout', (req, res) => {
  res.render('logout-success', {
    message: 'Logout realizado com sucesso'
  });
});
```

## 🔒 Considerações de Segurança

1. **Armazenamento de Tokens**

   - Nunca armazene tokens no localStorage
   - Use cookies httpOnly para tokens
   - Implemente refresh tokens adequadamente

2. **HTTPS**

   - Use HTTPS em produção
   - Configure HSTS
   - Mantenha certificados atualizados

3. **Validação**

   - Valide todos os tokens recebidos
   - Verifique assinaturas JWT
   - Confirme claims esperadas

4. **Segurança**

   - Nunca exponha client_secret no frontend
   - Use variáveis de ambiente
   - Rotacione segredos periodicamente

5. **Sessões**
   - Implemente timeouts adequados
   - Permita apenas uma sessão por usuário
   - Monitore tentativas de login suspeitas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT © [@mdiniz97](github.com/mdiniz97)
