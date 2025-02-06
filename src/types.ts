/**
 * Environment type for GOV.BR API
 * Tipo de ambiente para a API do GOV.BR
 */
export type Environment = 'production' | 'staging';

/**
 * Configuration interface for GovBRAuth
 * Interface de configuração para GovBRAuth
 */
export interface GovBRConfig {
  /** Client ID provided by GOV.BR / ID do cliente fornecido pelo GOV.BR */
  clientId: string;
  /** Client secret provided by GOV.BR / Chave secreta fornecida pelo GOV.BR */
  clientSecret: string;
  /** Redirect URI for OAuth flow / URI de redirecionamento para o fluxo OAuth */
  redirectUri: string;
  /** Environment selection / Seleção de ambiente */
  environment?: Environment;
  /** OAuth scopes / Escopos OAuth */
  scopes?: string[];
}

/**
 * Parameters for authorization URL generation
 * Parâmetros para geração da URL de autorização
 */
export interface AuthorizeParams {
  /** Response type for OAuth flow / Tipo de resposta para o fluxo OAuth */
  responseType?: string;
  /** Nonce for OpenID Connect / Nonce para OpenID Connect */
  nonce?: string;
  /** State for CSRF protection / State para proteção CSRF */
  state?: string;
  /** PKCE code challenge / Desafio de código PKCE */
  codeChallenge?: string;
  /** PKCE code challenge method / Método de desafio de código PKCE */
  codeChallengeMethod?: string;
}

/**
 * Token response from GOV.BR
 * Resposta de tokens do GOV.BR
 */
export interface TokenResponse {
  /** Access token / Token de acesso */
  access_token: string;
  /** ID token for OpenID Connect / Token de ID para OpenID Connect */
  id_token: string;
  /** Token type (usually "Bearer") / Tipo do token (geralmente "Bearer") */
  token_type: string;
  /** Token expiration time in seconds / Tempo de expiração do token em segundos */
  expires_in: number;
}

/**
 * User information from GOV.BR
 * Informações do usuário do GOV.BR
 */
export interface UserInfo {
  /** User identifier / Identificador do usuário */
  sub: string;
  /** User's full name / Nome completo do usuário */
  name: string;
  /** User's email / Email do usuário */
  email?: string;
  /** User's phone number / Número de telefone do usuário */
  phone_number?: string;
  /** Email verification status / Status de verificação do email */
  email_verified?: boolean;
  /** Phone number verification status / Status de verificação do telefone */
  phone_number_verified?: boolean;
  /** User's profile picture URL / URL da foto de perfil do usuário */
  picture?: string;
  /** Authentication methods used / Métodos de autenticação utilizados */
  amr: string[];
  /** User's social name / Nome social do usuário */
  social_name?: string;
  /** User's CNPJ if available / CNPJ do usuário se disponível */
  cnpj?: string;
}

/**
 * Trust level information
 * Informação de nível de confiabilidade
 */
export interface ConfiabilidadeNivel {
  /** Trust level ID / ID do nível de confiabilidade */
  id: string;
  /** Last update date / Data da última atualização */
  dataAtualizacao: string;
}

/**
 * Trust seal information
 * Informação de selo de confiabilidade
 */
export interface ConfiabilidadeSelo {
  /** Trust seal ID / ID do selo de confiabilidade */
  id: string;
  /** Last update date / Data da última atualização */
  dataAtualizacao: string;
}