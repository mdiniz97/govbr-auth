import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { ENDPOINTS, DEFAULT_SCOPES } from '../config';
import { GovBRAuthError } from '../errors';
import {
  generateNonce,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  base64URLEncode
} from '../utils';
import type {
  GovBRConfig,
  AuthorizeParams,
  TokenResponse,
  UserInfo,
  ConfiabilidadeNivel,
  ConfiabilidadeSelo,
  Environment
} from '../types';

/**
 * Core service for handling GOV.BR authentication and authorization.
 * Serviço principal para gerenciamento de autenticação e autorização do GOV.BR.
 */
export class AuthService {
  private readonly config: Required<GovBRConfig>;
  private readonly endpoints: (typeof ENDPOINTS)[Environment];
  private readonly client: AxiosInstance;

  /**
   * Creates a new instance of AuthService.
   * Cria uma nova instância do AuthService.
   *
   * @param config - Configuration object / Objeto de configuração
   * @throws {Error} If required configuration parameters are missing
   *                 Se parâmetros obrigatórios de configuração estiverem faltando
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
   * Sets up Axios interceptors for error handling.
   * Configura interceptadores do Axios para tratamento de erros.
   *
   * @private
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
   * Generates the authorization URL for the OAuth flow.
   * Gera a URL de autorização para o fluxo OAuth.
   *
   * @param params - Optional authorization parameters / Parâmetros opcionais de autorização
   * @returns Authorization URL string / String da URL de autorização
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
   * Exchanges authorization code for access tokens.
   * Troca o código de autorização por tokens de acesso.
   *
   * @param code - Authorization code from callback / Código de autorização do callback
   * @param codeVerifier - PKCE code verifier / Verificador de código PKCE
   * @returns Promise with token response / Promise com resposta dos tokens
   */
  public async getTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
    const basicAuth = base64URLEncode(`${this.config.clientId}:${this.config.clientSecret}`);

    const response: AxiosResponse<TokenResponse> = await this.client.post(
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
   * Retrieves user information using the access token.
   * Obtém informações do usuário usando o token de acesso.
   *
   * @param accessToken - Valid access token / Token de acesso válido
   * @returns Promise with user information / Promise com informações do usuário
   */
  public async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response: AxiosResponse<UserInfo> = await this.client.get(this.endpoints.userinfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  /**
   * Gets user's trust levels.
   * Obtém os níveis de confiabilidade do usuário.
   *
   * @param accessToken - Valid access token / Token de acesso válido
   * @param cpf - User's CPF / CPF do usuário
   * @returns Promise with trust levels / Promise com níveis de confiabilidade
   */
  public async getConfiabilidadeNiveis(
    accessToken: string,
    cpf: string
  ): Promise<ConfiabilidadeNivel[]> {
    const response: AxiosResponse<ConfiabilidadeNivel[]> = await this.client.get(
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
   * Gets user's trust seals.
   * Obtém os selos de confiabilidade do usuário.
   *
   * @param accessToken - Valid access token / Token de acesso válido
   * @param cpf - User's CPF / CPF do usuário
   * @returns Promise with trust seals / Promise com selos de confiabilidade
   */
  public async getConfiabilidadeSelos(
    accessToken: string,
    cpf: string
  ): Promise<ConfiabilidadeSelo[]> {
    const response: AxiosResponse<ConfiabilidadeSelo[]> = await this.client.get(
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
   * Generates the logout URL.
   * Gera a URL de logout.
   *
   * @param postLogoutRedirectUri - URL to redirect after logout / URL para redirecionamento após logout
   * @returns Logout URL string / String da URL de logout
   */
  public generateLogoutUrl(postLogoutRedirectUri: string): string {
    const queryParams = new URLSearchParams({
      post_logout_redirect_uri: postLogoutRedirectUri
    });

    return `${this.endpoints.logout}?${queryParams.toString()}`;
  }
}
