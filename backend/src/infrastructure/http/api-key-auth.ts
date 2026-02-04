import { Request, Response, NextFunction } from 'express';

/**
 * API Key Configuration
 * 
 * SPEC REFERENCE: Optional - "Basic API key auth per partner"
 * 
 * In production, these would be stored securely (e.g., AWS Secrets Manager, HashiCorp Vault)
 * and loaded via environment variables.
 */
export interface ApiKeyConfig {
  [partnerId: string]: string[];
}

// Default API keys for development/testing
const DEFAULT_API_KEYS: ApiKeyConfig = {
  PARTNER_A: [
    process.env.PARTNER_A_API_KEY || 'pk_partner_a_dev_key_123',
    process.env.PARTNER_A_API_KEY_SECONDARY || 'pk_partner_a_backup_456',
  ],
  PARTNER_B: [
    process.env.PARTNER_B_API_KEY || 'pk_partner_b_dev_key_789',
    process.env.PARTNER_B_API_KEY_SECONDARY || 'pk_partner_b_backup_012',
  ],
};

// Master key for admin operations (use with caution)
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'pk_master_admin_key_999';

/**
 * Options for configuring API key authentication middleware.
 */
export interface ApiKeyAuthOptions {
  /** Whether authentication is enabled (default: true in production) */
  enabled?: boolean;
  
  /** Header name for the API key (default: 'X-API-Key') */
  headerName?: string;
  
  /** Custom API key configuration */
  apiKeys?: ApiKeyConfig;
  
  /** Allow master key to bypass partner checks */
  allowMasterKey?: boolean;
  
  /** Paths to exclude from authentication */
  excludePaths?: string[];
}

/**
 * Extract partner ID from request path.
 * 
 * Examples:
 * - /api/feed/partner-a → PARTNER_A
 * - /api/feed/partner-b → PARTNER_B
 * - /api/feed/partner-a/batch → PARTNER_A
 */
function extractPartnerFromPath(path: string): string | null {
  const partnerAMatch = path.match(/\/partner-a(\/|$)/i);
  if (partnerAMatch) return 'PARTNER_A';
  
  const partnerBMatch = path.match(/\/partner-b(\/|$)/i);
  if (partnerBMatch) return 'PARTNER_B';
  
  return null;
}

/**
 * Create API key authentication middleware.
 * 
 * This middleware validates that:
 * 1. The X-API-Key header is present
 * 2. The key is valid for the partner making the request
 * 
 * Usage:
 * ```typescript
 * app.use('/api/feed', createApiKeyAuth());
 * ```
 */
export function createApiKeyAuth(options: ApiKeyAuthOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_API_AUTH === 'true',
    headerName = 'X-API-Key',
    apiKeys = DEFAULT_API_KEYS,
    allowMasterKey = true,
    excludePaths = ['/health', '/api/orders', '/api/orders/stats'],
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if authentication is disabled
    if (!enabled) {
      return next();
    }

    // Skip excluded paths
    const isExcluded = excludePaths.some(path => req.path.startsWith(path) || req.originalUrl.startsWith(path));
    if (isExcluded) {
      return next();
    }

    // Only apply to feed endpoints
    if (!req.path.includes('/feed/') && !req.originalUrl.includes('/feed/')) {
      return next();
    }

    // Get API key from header
    const apiKey = req.header(headerName);

    if (!apiKey) {
      res.status(401).json({
        status: 'error',
        code: 'MISSING_API_KEY',
        message: `Missing required header: ${headerName}`,
      });
      return;
    }

    // Check master key first
    if (allowMasterKey && apiKey === MASTER_API_KEY) {
      // Attach auth info to request for logging
      (req as any).auth = { type: 'master', partnerId: null };
      return next();
    }

    // Extract partner from path
    const partnerId = extractPartnerFromPath(req.path) || extractPartnerFromPath(req.originalUrl);

    if (!partnerId) {
      res.status(400).json({
        status: 'error',
        code: 'UNKNOWN_PARTNER',
        message: 'Could not determine partner from request path',
      });
      return;
    }

    // Validate API key for the specific partner
    const validKeys = apiKeys[partnerId] || [];
    
    if (!validKeys.includes(apiKey)) {
      // Log failed authentication attempt (without exposing the key)
      console.warn(`[AUTH] Failed authentication attempt for ${partnerId} from ${req.ip}`);
      
      res.status(403).json({
        status: 'error',
        code: 'INVALID_API_KEY',
        message: 'Invalid or unauthorized API key for this partner',
      });
      return;
    }

    // Attach auth info to request
    (req as any).auth = { 
      type: 'partner', 
      partnerId,
      keyIndex: validKeys.indexOf(apiKey),
    };

    // Log successful authentication
    console.log(`[AUTH] Authenticated request for ${partnerId}`);

    next();
  };
}

/**
 * Middleware to require authentication info on the request.
 * Use after createApiKeyAuth to ensure auth was successful.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).auth) {
    res.status(401).json({
      status: 'error',
      code: 'NOT_AUTHENTICATED',
      message: 'Authentication required',
    });
    return;
  }
  next();
}

/**
 * Get authentication info from request.
 */
export function getAuthInfo(req: Request): { type: string; partnerId: string | null } | null {
  return (req as any).auth || null;
}
