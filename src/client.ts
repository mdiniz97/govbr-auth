import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS, DEFAULT_SCOPES } from './config';
import { GovBRAuthError } from './errors';
import {
  generateNonce,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  base64URLEncode
} from './utils';
import type {
  GovBRConfig,
  AuthorizeParams,
  TokenResponse,
  UserInfo,
  ConfiabilidadeNivel,
  ConfiabilidadeSelo,
  Environment
} from './types';

/**
 * Main class for GOV.BR authentication integration
 * Classe principal para integração com autenticação do GOV.BR
 */
export class GovBRAuth {
  private readonly config: Required<GovBRConfig>;
  private readonly endpoints: (typeof ENDPOINTS)[Environment];
  private readonly client: AxiosInstance;

  /**
   * Creates a new instance of GovBRAuth
   * Cria uma nova instância do GovBRAuth
   *
   * @param config - Configuration object / Objeto de configuração
   * @throws Error if required parameters are missing / Erro se parâmetros obrigatórios estiverem faltando
   */
  constructor(config: GovBRConfig) {
    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error('Missing required configuration parameters');
    }

    this.config = {
      ...config,
      environment: config.environment || 'production',
      scopes: config.scopes || [...DEFAULT_SCOPES]
    };

    this.endpoints = ENDPOINTS[this.config.environment];
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupAxiosInterceptors();
  }

  /**
   * Sets up axios interceptors for error handling
   * Configura interceptadores do axios para tratamento de erros
   */
  private setupAxiosInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error)) {
          throw new GovBRAuthError(error.message, 'API_ERROR', error.response?.status, error);
        }
        throw error;
      }
    );
  }

  /**
   * Generates the authorization URL for the OAuth flow
   * Gera a URL de autorização para o fluxo OAuth
   *
   * @param params - Optional parameters for the authorization URL / Parâmetros opcionais para a URL de autorização
   * @returns Authorization URL / URL de autorização
   */
  public generateAuthorizationUrl(params: AuthorizeParams = {}): string {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const queryParams = new URLSearchParams({
      response_type: params.responseType || 'code',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      nonce: params.nonce || generateNonce(),
      state: params.state || generateState(),
      code_challenge: params.codeChallenge || codeChallenge,
      code_challenge_method: params.codeChallengeMethod || 'S256'
    });

    return `${this.endpoints.authorize}?${queryParams.toString()}`;
  }

  /**
   * Exchanges the authorization code for access tokens
   * Troca o código de autorização por tokens de acesso
   *
   * @param code - Authorization code / Código de autorização
   * @param codeVerifier - PKCE code verifier / Verificador de código PKCE
   * @returns Token response / Resposta com tokens
   */
  public async getTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
    const basicAuth = base64URLEncode(`${this.config.clientId}:${this.config.clientSecret}`);

    const response = await this.client.post(
      this.endpoints.token,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`
        }
      }
    );

    return response.data;
  }

  /**
   * Gets user information using the access token
   * Obtém informações do usuário usando o token de acesso
   *
   * @param accessToken - Access token / Token de acesso
   * @returns User information / Informações do usuário
   */
  public async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await this.client.get(this.endpoints.userinfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  /**
   * Gets user trust levels
   * Obtém níveis de confiabilidade do usuário
   *
   * @param accessToken - Access token / Token de acesso
   * @param cpf - User's CPF / CPF do usuário
   * @returns Trust levels / Níveis de confiabilidade
   */
  public async getConfiabilidadeNiveis(
    accessToken: string,
    cpf: string
  ): Promise<ConfiabilidadeNivel[]> {
    const response = await this.client.get(
      `${this.endpoints.confiabilidades}/contas/${cpf}/niveis`,
      {
        params: { 'response-type': 'ids' },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  }

  /**
   * Gets user trust seals
   * Obtém selos de confiabilidade do usuário
   *
   * @param accessToken - Access token / Token de acesso
   * @param cpf - User's CPF / CPF do usuário
   * @returns Trust seals / Selos de confiabilidade
   */
  public async getConfiabilidadeSelos(
    accessToken: string,
    cpf: string
  ): Promise<ConfiabilidadeSelo[]> {
    const response = await this.client.get(
      `${this.endpoints.confiabilidades}/contas/${cpf}/confiabilidades`,
      {
        params: { 'response-type': 'ids' },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  }

  /**
   * Generates the logout URL
   * Gera a URL de logout
   *
   * @param postLogoutRedirectUri - URL to redirect after logout / URL para redirecionamento após o logout
   * @returns Logout URL / URL de logout
   */
  public generateLogoutUrl(postLogoutRedirectUri: string): string {
    const queryParams = new URLSearchParams({
      post_logout_redirect_uri: postLogoutRedirectUri
    });

    return `${this.endpoints.logout}?${queryParams.toString()}`;
  }
}
