import { AuthService } from './services/authService';
import type { GovBRConfig } from './types';

export class GovBRAuth extends AuthService {
  constructor(config: GovBRConfig) {
    super(config);
  }
}