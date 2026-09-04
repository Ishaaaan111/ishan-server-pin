import { McpApp, Module, ConfigModule, OAuthModule } from '@nitrostack/core';
import { PinterestModule } from './modules/pinterest/pinterest.module.js';
import { WeatherModule } from './modules/weather/weather.module.js';
import { SystemHealthCheck } from './health/system.health.js';

/**
 * Root Application Module
 * 
 * Main module that bootstraps the Pinterest MCP server.
 * It registers the Pinterest feature module, OAuth authentication, and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'pinterest-server',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})
@Module({
  name: 'app',
  description: 'Pinterest MCP server with OAuth 2.1 authentication and official API v5 integration',
  imports: [
    ConfigModule.forRoot(),

    // Enable OAuth 2.1 authentication
    OAuthModule.forRoot({
      // Whether OAuth is enforced. Defaults to false (dev-friendly): the server
      // runs out-of-the-box and protected endpoints are reachable without a token.
      // Set OAUTH_REQUIRED=true to enforce auth (fail-closed).
      required: process.env.OAUTH_REQUIRED === 'true',

      // Resource URI - YOUR MCP server's public URL
      resourceUri: process.env.RESOURCE_URI || 'https://mcplocal',

      // Authorization Server(s) - The OAuth provider URL(s)
      authorizationServers: [
        process.env.AUTH_SERVER_URL || 'https://dev-5dt0utuk31h13tjm.us.auth0.com',
      ],

      // Supported scopes for this MCP server
      scopesSupported: [
        'read',        // Read access to resources
        'write',       // Write/modify resources
        'admin',       // Administrative operations
      ],

      // Token Introspection (RFC 7662) - For opaque tokens
      tokenIntrospectionEndpoint: process.env.INTROSPECTION_ENDPOINT,
      tokenIntrospectionClientId: process.env.INTROSPECTION_CLIENT_ID,
      tokenIntrospectionClientSecret: process.env.INTROSPECTION_CLIENT_SECRET,

      // Expected audience (defaults to resourceUri if not provided)
      audience: process.env.TOKEN_AUDIENCE,

      // Expected issuer (optional but recommended)
      issuer: process.env.TOKEN_ISSUER,

      // Custom validation (optional)
      customValidation: async (tokenPayload) => {
        return true;
      },
    }),

    PinterestModule,
    WeatherModule,
  ],
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class AppModule { }

