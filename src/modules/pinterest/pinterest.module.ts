/**
 * Pinterest Module
 *
 * NitroStack feature module that registers the Pinterest MCP tools
 * and their required service dependency.
 *
 * Imported by AppModule.
 */

import { Module } from '@nitrostack/core';
import { PinterestTools } from './pinterest.tools.js';
import { PinterestPrompts } from './pinterest.prompts.js';
import { PinterestService } from '../../services/pinterest/pinterest.service.js';
import { PinterestAuthService } from '../../services/pinterest/pinterest.auth.service.js';

@Module({
  name: 'pinterest',
  description: 'Pinterest MCP server — search and retrieve Pins via the official Pinterest API v5',
  controllers: [PinterestTools, PinterestPrompts],
  providers: [PinterestAuthService, PinterestService, PinterestPrompts],
  exports: [PinterestAuthService, PinterestService, PinterestPrompts],
})
export class PinterestModule {}
