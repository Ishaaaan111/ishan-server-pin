/**
 * Pinterest API v5 — HTTP Client
 *
 * Reusable Axios-based client for all Pinterest API v5 calls.
 * Handles:
 *  - Bearer token auth from environment variables
 *  - Consistent error mapping (no secrets in errors)
 *  - HTTP 400/401/403/404/429/5xx → descriptive Error objects
 *  - Rate-limit detection (Retry-After header)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { PinterestApiErrorResponse } from './pinterest.types.js';

// Pinterest API v5 base URL
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

/**
 * Classifies a Pinterest API HTTP error into a descriptive message.
 * MUST NOT leak access tokens, client secrets, or internal stack traces.
 */
function buildErrorMessage(status: number, body: PinterestApiErrorResponse | null, retryAfter?: string): string {
  const code = body?.code;
  const serverMsg = body?.message;

  switch (status) {
    case 400:
      return `Pinterest API: Bad request — ${serverMsg || 'invalid parameters'} (code ${code ?? status})`;

    case 401:
      return (
        'Pinterest API: Authentication failed (401). ' +
        'Your PINTEREST_ACCESS_TOKEN may be missing, invalid, or expired. ' +
        'Refresh your token and update the environment variable.'
      );

    case 403:
      return (
        'Pinterest API: Forbidden (403). ' +
        `The access token lacks required permissions. ${serverMsg ? `Detail: ${serverMsg}.` : ''} ` +
        'Ensure the token has the necessary Pinterest OAuth scopes (e.g. pins:read).'
      );

    case 404:
      return `Pinterest API: Resource not found (404). ${serverMsg || 'The requested pin or resource does not exist.'}`;

    case 429: {
      const after = retryAfter ? ` Retry after ${retryAfter} seconds.` : '';
      return `Pinterest API: Rate limit exceeded (429).${after} Please slow down your requests.`;
    }

    default:
      if (status >= 500) {
        return `Pinterest API: Server error (${status}). Pinterest may be temporarily unavailable. Please retry later.`;
      }
      return `Pinterest API: Unexpected error (${status}). ${serverMsg || ''}`.trim();
  }
}

/**
 * Creates and returns a configured Axios instance for Pinterest API v5.
 * Dynamically resolves the active access token per request from the provided
 * token getter or process.env.PINTEREST_ACCESS_TOKEN.
 */
export function createPinterestHttpClient(tokenGetter?: () => string | null): AxiosInstance {
  const client = axios.create({
    baseURL: PINTEREST_API_BASE,
    timeout: 15_000, // 15 seconds
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor: dynamically inject current access token
  client.interceptors.request.use((config) => {
    const token = tokenGetter ? tokenGetter() : process.env.PINTEREST_ACCESS_TOKEN?.trim();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: normalize errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<PinterestApiErrorResponse>) => {
      if (error.response) {
        const { status, data, headers } = error.response;
        const retryAfter = headers?.['retry-after'];
        const message = buildErrorMessage(status, data ?? null, retryAfter as string | undefined);
        throw new Error(message);
      }

      if (error.request) {
        throw new Error(
          'Pinterest API: No response received. Check your internet connection or Pinterest API availability.'
        );
      }

      // Generic request setup error
      throw new Error(`Pinterest API: Request failed — ${error.message}`);
    }
  );

  return client;
}
