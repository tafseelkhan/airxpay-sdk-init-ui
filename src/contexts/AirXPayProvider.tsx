import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyPublicKey } from '../api/clients/verifyPublicKey';
import { tokenService } from '../utils/token/tokenService';
import { Logger } from '../utils/log/logger';

interface AirXPayContextType {
  publicKey: string;
  isValid: boolean;
  loading: boolean;
  hasToken: boolean;
  error?: string;
  merchantId?: string;
  mode: 'test' | 'live';
}

const AirXPayContext = createContext<AirXPayContextType | null>(null);

interface Props {
  publicKey: string;
  children: React.ReactNode;
  enableLogging?: boolean;
}

const logger = new Logger({ prefix: '[AirXPay Provider]' });

export const AirXPayProvider: React.FC<Props> = ({ 
  publicKey, 
  children,
  enableLogging = __DEV__ 
}) => {
  const [state, setState] = useState<AirXPayContextType>({
    publicKey,
    isValid: false,
    loading: true,
    hasToken: false,
    mode: 'test'
  });

  useEffect(() => {
    logger.setEnabled(enableLogging);

    const initialize = async () => {
      if (!publicKey?.trim()) {
        setState(prev => ({ 
          ...prev, 
          isValid: false, 
          loading: false,
          error: 'Public key is required'
        }));
        return;
      }

      try {
        logger.info('Initializing AirXPay...');
        
        // Verify public key
        const verification = await verifyPublicKey(publicKey);
        
        // Check for existing token
        const hasToken = await tokenService.hasToken();
        
        // Extract merchantId from token if available
        let merchantId: string | undefined;
        if (hasToken) {
          const token = await tokenService.getToken();
          if (token) {
            try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              merchantId = payload.merchantId || payload.sub;
            } catch {
              // Ignore decode errors
            }
          }
        }

        setState({
          publicKey,
          isValid: verification.valid,
          loading: false,
          hasToken,
          merchantId,
          mode: verification.merchantData?.mode || 'test'
        });

        logger.info('AirXPay initialized successfully');
      } catch (error) {
        logger.error('Initialization failed:', error);
        setState({
          publicKey,
          isValid: false,
          loading: false,
          hasToken: false,
          error: 'Invalid public key',
          mode: 'test'
        });
      }
    };

    initialize();
  }, [publicKey, enableLogging]);

  return (
    <AirXPayContext.Provider value={state}>
      {children}
    </AirXPayContext.Provider>
  );
};

export const useAirXPay = (): AirXPayContextType => {
  const context = useContext(AirXPayContext);
  if (!context) {
    throw new Error('useAirXPay must be used within AirXPayProvider');
  }
  return context;
};

export const useAirXPaySafe = (): AirXPayContextType | null => {
  try {
    return useAirXPay();
  } catch {
    return null;
  }
};