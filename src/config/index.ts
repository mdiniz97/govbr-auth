import type { Environment } from '../types';

export const ENDPOINTS = {
  staging: {
    authorize: 'https://sso.staging.acesso.gov.br/authorize',
    token: 'https://sso.staging.acesso.gov.br/token',
    userinfo: 'https://sso.staging.acesso.gov.br/userinfo',
    logout: 'https://sso.staging.acesso.gov.br/logout',
    confiabilidades: 'https://api.staging.acesso.gov.br/confiabilidades/v3'
  },
  production: {
    authorize: 'https://sso.acesso.gov.br/authorize',
    token: 'https://sso.acesso.gov.br/token',
    userinfo: 'https://sso.acesso.gov.br/userinfo',
    logout: 'https://sso.acesso.gov.br/logout',
    confiabilidades: 'https://api.acesso.gov.br/confiabilidades/v3'
  }
} as const;

export const DEFAULT_SCOPES = ['openid', 'email', 'profile', 'govbr_confiabilidades'] as const;

export type Endpoints = typeof ENDPOINTS[Environment];