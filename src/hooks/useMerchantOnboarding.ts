import { useState, useCallback, useEffect } from 'react';
import { tokenService } from '../utils/token/tokenService';
import { storage } from '../utils/token/storage';
import { ErrorHandler, AppError } from '../error/errorHandler';
import { CreateMerchantPayload, MerchantCreateResponse, MerchantStatusResponse } from '../types/merchantTypes';
import { STORAGE_KEYS } from '../etc/constants';
import { sdkEvents } from '../events/sdkEvents';

interface UseMerchantOnboardingReturn {
  loading: boolean;
  error: AppError | null;
  merchantData: MerchantCreateResponse | null;
  merchantStatus: MerchantStatusResponse | null;
  token: string | null;
  createMerchant: (payload: CreateMerchantPayload, backendApi?: (data: any) => Promise<any>) => Promise<MerchantCreateResponse | null>;
  fetchStatus: (merchantId?: string) => Promise<MerchantStatusResponse | null>;
  clearError: () => void;
  reset: () => void;
  getToken: () => Promise<string | null>;
}

export const useMerchantOnboarding = (): UseMerchantOnboardingReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  const [merchantData, setMerchantData] = useState<MerchantCreateResponse | null>(null);
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatusResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      const cached = await storage.get<MerchantCreateResponse>(STORAGE_KEYS.MERCHANT_DATA);
      if (cached) {
        setMerchantData(cached);
      }
      
      const storedToken = await tokenService.getToken();
      if (storedToken) {
        setToken(storedToken);
      }
    };
    loadCachedData();
  }, []);

  const createMerchant = useCallback(async (
    payload: CreateMerchantPayload,
    backendApi?: (data: any) => Promise<any>
  ): Promise<MerchantCreateResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      sdkEvents.emitEvent('onboarding:submitting');
      
      // REMOVED: Token check - SDK must not block flow if token is missing
      // Call developer's backend API if provided
      let backendResponse;
      if (backendApi) {
        backendResponse = await backendApi(payload);
      }

      // Mock response for demo - in production, this would call your actual API
      const response: MerchantCreateResponse = {
        success: true,
        token: await tokenService.getToken() || '', // Get token if exists, empty string if not
        merchant: {
          merchantId: 'mch_' + Date.now(),
          merchantName: payload.merchantName,
          merchantEmail: payload.merchantEmail,
          merchantPhone: payload.merchantPhone,
          businessName: payload.businessName,
          businessType: payload.businessType || 'individual',
          mode: payload.mode || 'test',
          kycStatus: 'pending',
          isKycCompleted: false,
          isBankDetailsCompleted: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      // Store merchant data
      await storage.set(STORAGE_KEYS.MERCHANT_DATA, response);
      setMerchantData(response);
      
      sdkEvents.emitEvent('onboarding:success', { 
        merchantId: response.merchant.merchantId,
        backendResponse 
      });

      return response;
    } catch (err) {
      const appError = ErrorHandler.handle(err);
      setError(appError);
      sdkEvents.emitEvent('onboarding:error', appError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async (merchantId?: string): Promise<MerchantStatusResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      // REMOVED: Token check - fetch status without token
      const token = await tokenService.getToken();
      
      // Mock status response
      const status: MerchantStatusResponse = {
        merchantId: merchantId || 'mch_123',
        merchantName: 'Test Merchant',
        merchantEmail: 'test@example.com',
        status: 'active',
        kycStatus: 'verified',
        kycCompleted: true,
        bankDetailsCompleted: true,
        mode: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMerchantStatus(status);
      return status;
    } catch (err) {
      const appError = ErrorHandler.handle(err);
      setError(appError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return await tokenService.getToken();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setMerchantData(null);
    setMerchantStatus(null);
    setToken(null);
    setError(null);
    setLoading(false);
    tokenService.clearToken();
    storage.remove(STORAGE_KEYS.MERCHANT_DATA);
  }, []);

  return {
    loading,
    error,
    merchantData,
    merchantStatus,
    token,
    createMerchant,
    fetchStatus,
    clearError,
    reset,
    getToken
  };
};