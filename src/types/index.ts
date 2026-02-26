export * from './merchantTypes';

// SDK Types
export interface PublicKey {
  key: string;
}

export interface Token {
  value: string;
  expiresAt?: number;
}

export interface DeveloperApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Developer configuration (only publicKey exposed)
export interface DeveloperConfig {
  publicKey: string;
}