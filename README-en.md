# GOV.BR Authentication Library

[![npm version](https://badge.fury.io/js/govbr-auth.svg)](https://badge.fury.io/js/govbr-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

English | [Português](./README.md)

A TypeScript/JavaScript library for integrating with GOV.BR authentication services.

## 🚀 Features

- ✨ Full TypeScript support
- 🔒 PKCE implementation for enhanced security
- 🌐 Support for staging and production environments
- 🔄 Complete OAuth 2.0 and OpenID Connect flow management
- 🌟 Trust levels and seals
- 📡 Request management with Axios

## 📦 Installation

```bash
npm install govbr-auth
```

## 🎯 Use Cases

### 1. Basic Authentication

```typescript
import { GovBRAuth } from 'govbr-auth';

// Initialize the client
const auth = new GovBRAuth({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://your-app.com/callback',
  environment: 'staging' // or 'production'
});

// 1. Generate authorization URL and redirect user
const authUrl = auth.generateAuthorizationUrl();
// Redirect to authUrl

// 2. In callback, exchange code for tokens
const tokens = await auth.getTokens(code, codeVerifier);

// 3. Get user information
const userInfo = await auth.getUserInfo(tokens.access_token);
```

### 2. Trust Level Verification

```typescript
// Get trust levels
const levels = await auth.getConfiabilidadeNiveis(tokens.access_token, userInfo.sub);

// Get trust seals
const seals = await auth.getConfiabilidadeSelos(tokens.access_token, userInfo.sub);

// Check specific level
const hasSilverLevel = levels.some((level) => level.id === 'prata');
```

### 3. Logout

```typescript
const logoutUrl = auth.generateLogoutUrl('https://your-app.com');
// Redirect to logoutUrl
```

## 📚 Complete API

### `GovBRAuth`

#### Constructor

```typescript
const auth = new GovBRAuth({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://your-app.com/callback',
  environment: 'production', // optional, default: 'production'
  scopes: ['openid', 'email', 'profile'] // optional
});
```

#### Methods

##### `generateAuthorizationUrl()`

Generates the authorization URL to start the login flow.

```typescript
// Basic usage
const url = auth.generateAuthorizationUrl();

// With custom parameters
const url = auth.generateAuthorizationUrl({
  state: 'custom-state',
  nonce: 'custom-nonce'
});

// Example with Express
app.get('/login', (req, res) => {
  const state = generateState();
  req.session.state = state;

  const url = auth.generateAuthorizationUrl({ state });
  res.redirect(url);
});
```

##### `getTokens()`

Exchanges the authorization code for access tokens.

```typescript
// In OAuth callback
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const { codeVerifier } = req.session;

  try {
    const tokens = await auth.getTokens(code, codeVerifier);
    // tokens.access_token - Token to access resources
    // tokens.id_token - Token with user information
    // tokens.expires_in - Expiration time in seconds
  } catch (error) {
    console.error('Error getting tokens:', error);
  }
});
```

##### `getUserInfo()`

Gets information about the authenticated user.

```typescript
// Example with email validation
const userInfo = await auth.getUserInfo(accessToken);

if (!userInfo.email_verified) {
  throw new Error('Email not verified');
}

// Example with social name
const displayName = userInfo.social_name || userInfo.name;

// Example of complete profile
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

Gets and verifies user trust levels.

```typescript
// Minimum security level verification
const levels = await auth.getConfiabilidadeNiveis(accessToken, userInfo.sub);

const minimumLevel = {
  bronze: levels.some((n) => n.id === 'bronze'),
  silver: levels.some((n) => n.id === 'prata'),
  gold: levels.some((n) => n.id === 'ouro')
};

// Example of authorization middleware
function requireTrustLevel(level) {
  return async (req, res, next) => {
    const levels = await auth.getConfiabilidadeNiveis(
      req.session.accessToken,
      req.session.user.sub
    );

    if (!levels.some((n) => n.id === level)) {
      return res.status(403).json({
        error: 'Insufficient trust level'
      });
    }

    next();
  };
}

// Middleware usage
app.get('/secure-area', requireTrustLevel('prata'), (req, res) => {
  res.json({ message: 'Access authorized' });
});
```

##### `getConfiabilidadeSelos()`

Gets and verifies user trust seals.

```typescript
// Specific seal verification
const seals = await auth.getConfiabilidadeSelos(accessToken, userInfo.sub);

const hasDigitalCertificate = seals.some((seal) => seal.id === 'certificado_digital');

// Example of multiple verifications
const verifications = {
  digitalCertificate: seals.some((s) => s.id === 'certificado_digital'),
  biometricValidation: seals.some((s) => s.id === 'validacao_biometrica'),
  facialValidation: seals.some((s) => s.id === 'validacao_facial'),
  bankRegistered: seals.some((s) => s.id === 'banco_cadastrado')
};

// Example in protected route
app.post('/digital-signature', async (req, res) => {
  const seals = await auth.getConfiabilidadeSelos(req.session.accessToken, req.session.user.sub);

  if (!seals.some((s) => s.id === 'certificado_digital')) {
    return res.status(403).json({
      error: 'Digital certificate required'
    });
  }

  // Process digital signature
});
```

##### `generateLogoutUrl()`

Generates the URL to perform user logout.

```typescript
// Basic logout
app.get('/logout', (req, res) => {
  const logoutUrl = auth.generateLogoutUrl('https://your-app.com');

  req.session.destroy(() => {
    res.redirect(logoutUrl);
  });
});

// Logout with custom callback
app.get('/logout', (req, res) => {
  const logoutUrl = auth.generateLogoutUrl('https://your-app.com/post-logout');

  // Clear session data
  req.session.destroy(() => {
    res.redirect(logoutUrl);
  });
});

// Post-logout handling
app.get('/post-logout', (req, res) => {
  res.render('logout-success', {
    message: 'Logout successful'
  });
});
```

## 🔒 Security Considerations

1. **Token Storage**

   - Never store tokens in localStorage
   - Use httpOnly cookies for tokens
   - Implement refresh tokens properly

2. **HTTPS**

   - Use HTTPS in production
   - Configure HSTS
   - Keep certificates up to date

3. **Validation**

   - Validate all received tokens
   - Verify JWT signatures
   - Confirm expected claims

4. **Security**

   - Never expose client_secret in frontend
   - Use environment variables
   - Rotate secrets periodically

5. **Sessions**
   - Implement proper timeouts
   - Allow only one session per user
   - Monitor suspicious login attempts

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: new feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT © [@mdiniz97](github.com/mdiniz97)
