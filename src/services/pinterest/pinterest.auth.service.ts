/**
 * Pinterest OAuth 2.0 Authentication Service
 *
 * Implements official Pinterest OAuth 2.0 Authorization Code Flow:
 *   1. Generates official Pinterest authorization URL with exact required scopes.
 *   2. Starts a local HTTP callback listener to handle Pinterest redirects.
 *   3. Exchanges authorization code for an OAuth 2.0 access token via POST https://api.pinterest.com/v5/oauth/token.
 *   4. Stores tokens in-memory and in persistent local file (.pinterest-tokens.json).
 *   5. Automatically provides valid access tokens to Pinterest API HTTP client.
 *
 * Scopes:
 *   - user_accounts:read : View user profile and account metrics
 *   - boards:read        : List and view user boards
 *   - boards:write       : Create and update boards
 *   - pins:read          : Search and view pins
 *   - pins:write         : Create pins and save pins to boards
 */

import { Injectable } from '@nitrostack/core';
import axios from 'axios';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

export interface PinterestTokenData {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  scope?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export const REQUIRED_PINTEREST_SCOPES = [
  'user_accounts:read',
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
];

const PINTEREST_AUTH_BASE = 'https://www.pinterest.com/oauth/';
const PINTEREST_TOKEN_ENDPOINT = 'https://api.pinterest.com/v5/oauth/token';
const TOKEN_FILE_PATH = path.resolve(process.cwd(), '.pinterest-tokens.json');

@Injectable()
export class PinterestAuthService {
  private inMemoryToken: string | null = null;
  private tokenData: PinterestTokenData | null = null;
  private serverInstance: http.Server | null = null;

  constructor() {
    this.loadTokens();
    this.startLocalOAuthServerIfConfigured();
  }

  /**
   * Retrieves the currently active Pinterest OAuth access token.
   * Priority:
   *  1. In-memory access token (from recent OAuth exchange)
   *  2. Persisted token in .pinterest-tokens.json
   *  3. PINTEREST_ACCESS_TOKEN environment variable
   */
  getAccessToken(): string | null {
    if (this.inMemoryToken) {
      return this.inMemoryToken;
    }

    if (this.tokenData?.access_token) {
      this.inMemoryToken = this.tokenData.access_token;
      return this.inMemoryToken;
    }

    const envToken = process.env.PINTEREST_ACCESS_TOKEN?.trim();
    if (envToken && envToken !== 'your-pinterest-user-access-token' && envToken.length > 10) {
      return envToken;
    }

    return null;
  }

  /**
   * Checks whether the user is currently authenticated with Pinterest.
   */
  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  /**
   * Checks whether OAuth app credentials (client ID & secret) are present.
   */
  hasAppCredentials(): boolean {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    return Boolean(clientId && clientSecret);
  }

  getClientId(): string | null {
    const id = process.env.PINTEREST_CLIENT_ID?.trim();
    return id && id !== 'your-pinterest-app-id' ? id : null;
  }

  getClientSecret(): string | null {
    const secret = process.env.PINTEREST_CLIENT_SECRET?.trim();
    return secret && secret !== 'your-pinterest-app-secret' ? secret : null;
  }

  getRedirectUri(): string {
    return (
      process.env.PINTEREST_REDIRECT_URI?.trim() ||
      'http://localhost:3005/oauth/callback'
    );
  }

  /**
   * Generates the official Pinterest OAuth 2.0 authorization URL.
   */
  getAuthorizationUrl(state = 'mcp-pinterest-auth'): string | null {
    const clientId = this.getClientId();
    if (!clientId) return null;

    const redirectUri = this.getRedirectUri();
    const scopes = REQUIRED_PINTEREST_SCOPES.join(',');

    const url = new URL(PINTEREST_AUTH_BASE);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);

    return url.toString();
  }

  /**
   * Exchanges an authorization code for an access token via official Pinterest API.
   * Endpoint: POST https://api.pinterest.com/v5/oauth/token
   * Header: Authorization: Basic <base64(client_id:client_secret)>
   * Body: grant_type=authorization_code&code=...&redirect_uri=...
   */
  async exchangeCodeForToken(code: string): Promise<PinterestTokenData> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing Pinterest App Credentials. PINTEREST_CLIENT_ID and PINTEREST_CLIENT_SECRET must be set.'
      );
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code.trim());
    params.set('redirect_uri', redirectUri);

    try {
      const response = await axios.post<PinterestTokenData>(
        PINTEREST_TOKEN_ENDPOINT,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
          timeout: 15_000,
        }
      );

      const data = response.data;
      if (!data.access_token) {
        throw new Error('Pinterest token response did not contain an access_token.');
      }

      this.saveTokens(data);
      return data;
    } catch (error: any) {
      if (error.response?.data) {
        const errData = error.response.data;
        const msg = errData.message || errData.error_description || JSON.stringify(errData);
        throw new Error(`Pinterest token exchange failed (${error.response.status}): ${msg}`);
      }
      throw new Error(`Pinterest token exchange failed: ${error.message}`);
    }
  }

  /**
   * Saves tokens to in-memory cache, environment variable, and .pinterest-tokens.json.
   */
  saveTokens(data: PinterestTokenData): void {
    const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;
    this.tokenData = {
      ...data,
      expires_at: expiresAt,
    };
    this.inMemoryToken = data.access_token;
    process.env.PINTEREST_ACCESS_TOKEN = data.access_token;

    try {
      fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(this.tokenData, null, 2), {
        encoding: 'utf-8',
        mode: 0o600, // Read/write by owner only
      });
      console.error('✅ Pinterest OAuth access token successfully saved.');
    } catch (err) {
      console.error('⚠️  Failed to persist Pinterest token to disk:', err);
    }
  }

  /**
   * Loads persisted tokens from .pinterest-tokens.json on initialization.
   */
  private loadTokens(): void {
    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as PinterestTokenData;
        if (parsed.access_token) {
          this.tokenData = parsed;
          this.inMemoryToken = parsed.access_token;
          process.env.PINTEREST_ACCESS_TOKEN = parsed.access_token;
        }
      }
    } catch {
      // Ignore corrupted token file on boot
    }
  }

  /**
   * Generates a comprehensive, user-friendly authentication message
   * with exact authorization URL and configuration steps.
   */
  getAuthErrorMessage(): string {
    const authUrl = this.getAuthorizationUrl();
    const redirectUri = this.getRedirectUri();
    const hasCreds = this.hasAppCredentials();

    if (hasCreds && authUrl) {
      return (
        'Pinterest authentication is required. Authorize the MCP server with Pinterest first:\n\n' +
        `👉 Authorization Link:\n${authUrl}\n\n` +
        'Instructions:\n' +
        '1. Click or open the link above in your browser.\n' +
        '2. Log in to Pinterest and click "Authorize".\n' +
        `3. You will be redirected to ${redirectUri} and authenticated automatically.\n\n` +
        'After authorization completes, retry your request.'
      );
    }

    return (
      'Pinterest OAuth access token is not configured.\n\n' +
      'To connect with Pinterest, choose one of these two methods:\n\n' +
      'Method A: OAuth 2.0 Authorization Flow (Recommended)\n' +
      '1. Add your Pinterest App credentials to your .env file:\n' +
      '   PINTEREST_CLIENT_ID=your_app_id\n' +
      '   PINTEREST_CLIENT_SECRET=your_app_secret\n' +
      `   PINTEREST_REDIRECT_URI=${redirectUri}\n` +
      '2. Restart the server and run any Pinterest tool to receive your authorization link.\n\n' +
      'Method B: Direct Access Token\n' +
      '1. Generate an access token from Pinterest Developer Portal (developers.pinterest.com/apps).\n' +
      '2. Add it to .env: PINTEREST_ACCESS_TOKEN=pina_...\n' +
      '3. Ensure scopes include: user_accounts:read, boards:read, boards:write, pins:read, pins:write.'
    );
  }

  /**
   * Starts a local HTTP server on the port defined by PINTEREST_REDIRECT_URI
   * (e.g. port 3005) to capture the OAuth redirect callback.
   */
  private startLocalOAuthServerIfConfigured(): void {
    if (!this.hasAppCredentials()) return;

    try {
      const redirectUrl = new URL(this.getRedirectUri());
      const port = Number(redirectUrl.port) || 3005;
      const callbackPath = redirectUrl.pathname || '/oauth/callback';

      this.serverInstance = http.createServer(async (req, res) => {
        const reqUrl = new URL(req.url || '/', `http://localhost:${port}`);

        // Route: /auth or /authorize -> redirect to Pinterest OAuth
        if (reqUrl.pathname === '/auth' || reqUrl.pathname === '/authorize') {
          const authUrl = this.getAuthorizationUrl();
          if (authUrl) {
            res.writeHead(302, { Location: authUrl });
            res.end();
            return;
          }
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Pinterest Client ID is not configured.');
          return;
        }

        // Route: OAuth callback
        if (reqUrl.pathname === callbackPath) {
          const code = reqUrl.searchParams.get('code');
          const error = reqUrl.searchParams.get('error');
          const errorDescription = reqUrl.searchParams.get('error_description');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(this.renderHtmlResponse(false, `Authorization error: ${errorDescription || error}`));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(this.renderHtmlResponse(false, 'Missing authorization code in Pinterest redirect callback.'));
            return;
          }

          try {
            await this.exchangeCodeForToken(code);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.renderHtmlResponse(true, 'Pinterest authentication was successful! You may now return to your MCP client or AI pair programmer and use all Pinterest tools.'));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(this.renderHtmlResponse(false, `Failed to exchange token: ${err.message}`));
          }
          return;
        }

        // Default 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      });

      this.serverInstance.listen(port, () => {
        console.error(`🔐 Pinterest OAuth callback listener listening on http://localhost:${port}${callbackPath}`);
      });

      this.serverInstance.on('error', (err: any) => {
        // Port might be in use or unavailable
        console.error(`⚠️  Pinterest OAuth callback listener notice: ${err.message}`);
      });
    } catch (err) {
      console.error('⚠️  Failed to initialize local Pinterest OAuth listener:', err);
    }
  }

  private renderHtmlResponse(success: boolean, message: string): string {
    const title = success ? 'Connected to Pinterest' : 'Authentication Failed';
    const icon = success ? '✅' : '❌';
    const color = success ? '#E60023' : '#DC2626';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #FAFAFA;
      color: #1F2937;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #E5E7EB;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      color: ${color};
      margin: 0 0 12px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #4B5563;
      margin: 0 0 20px 0;
    }
    .badge {
      display: inline-block;
      background: #FEE2E2;
      color: #991B1B;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${success ? '<div class="badge">You can close this tab</div>' : ''}
  </div>
</body>
</html>`;
  }
}
