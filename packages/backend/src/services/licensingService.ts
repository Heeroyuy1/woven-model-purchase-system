import { env } from '../config/env';

interface LicenseResult {
  id: number;
  license_key: string;
  license_type: string;
  status: string;
  product_code: string;
  user_email: string;
  user_name: string;
  max_activations: number;
  current_activations: number;
  expiration_date: string | null;
  perpetual: boolean;
  created_at: string;
}

interface ProductResult {
  id: number;
  code: string;
  name: string;
  description: string;
  version: string;
  price: number;
}

interface CustomerResult {
  id: number;
  email: string;
  name: string;
}

interface GenerateLicenseParams {
  userId: number;
  productCode: string;
  licenseType: string;
  maxActivations: number;
  expirationDays: number;
  perpetual: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type?: string;
}

export class LicensingApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = (env.LICENSING_API_URL || 'https://woven-licensing-production.up.railway.app/api/v1').replace(/\/+$/, '');
  }

  private async authenticate(): Promise<string> {
    if (this.authToken && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    const email = env.ADMIN_EMAIL || 'admin@wovenmodel.com';
    const password = env.ADMIN_PASSWORD || env.LICENSING_API_KEY || '';

    if (!password) {
      throw new Error('Licensing API: No admin credentials configured');
    }

    const resp = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Licensing API auth failed (${resp.status}): ${errText}`);
    }

    const data: AuthResponse = await resp.json() as AuthResponse;
    this.authToken = data.access_token;
    this.tokenExpiry = Date.now() + 55 * 60 * 1000;
    return this.authToken!;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    retries = 2,
    delayMs = 1000
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const token = await this.authenticate();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage: string;
          try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.detail || errorJson.message || errorText; }
          catch { errorMessage = errorText; }

          if (response.status === 401 && attempt === 0) {
            this.authToken = null;
            this.tokenExpiry = 0;
            continue;
          }
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Licensing API ${response.status} error: ${errorMessage}`);
          }
          throw new Error(`Licensing API ${response.status} error: ${errorMessage}`);
        }

        return await response.json() as T;
      } catch (error: any) {
        if (error.message?.includes('auth failed')) throw error;
        if (attempt < retries) {
          console.warn(`[LicensingClient] attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Licensing API request failed after all retries');
  }

  async generateLicense(params: GenerateLicenseParams): Promise<LicenseResult> {
    return this.request<LicenseResult>('POST', '/admin/licenses/generate', {
      user_id: params.userId,
      product_code: params.productCode,
      license_type: params.licenseType,
      max_activations: params.maxActivations,
      expiration_days: params.expirationDays,
      perpetual: params.perpetual,
    });
  }

  async getLicenseInfo(licenseKey: string): Promise<LicenseResult> {
    return this.request<LicenseResult>('GET', `/licenses/${licenseKey}`);
  }

  async listProducts(): Promise<ProductResult[]> {
    return this.request<ProductResult[]>('GET', '/products');
  }

  async createCustomer(customerData: { email: string; name: string; password: string }): Promise<CustomerResult> {
    return this.request<CustomerResult>('POST', '/auth/register', customerData);
  }
}

// Lazy initialization - don't crash on module load
let _licensingClient: LicensingApiClient | null = null;
export function getLicensingClient(): LicensingApiClient {
  if (!_licensingClient) {
    _licensingClient = new LicensingApiClient();
  }
  return _licensingClient;
}
export const licensingClient = _licensingClient as any; // backward compat
