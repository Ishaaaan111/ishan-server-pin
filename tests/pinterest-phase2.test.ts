/**
 * Pinterest Phase 2 MCP Server & OAuth Test Suite
 *
 * Tests:
 * 1. PinterestAuthService (OAuth 2.0 flow, token exchange, scopes, auth URL)
 * 2. get_boards tool & service
 * 3. create_board tool & service
 * 4. save_pin tool & service
 * 5. pinterest_auth_status tool
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PinterestService } from '../src/services/pinterest/pinterest.service.js';
import { PinterestTools } from '../src/modules/pinterest/pinterest.tools.js';
import { PinterestAuthService, REQUIRED_PINTEREST_SCOPES } from '../src/services/pinterest/pinterest.auth.service.js';

describe('Pinterest MCP OAuth & Phase 2 Tools Suite', () => {
  const originalToken = process.env.PINTEREST_ACCESS_TOKEN;
  const originalClientId = process.env.PINTEREST_CLIENT_ID;
  const originalClientSecret = process.env.PINTEREST_CLIENT_SECRET;
  const originalRedirectUri = process.env.PINTEREST_REDIRECT_URI;

  before(() => {
    process.env.PINTEREST_ACCESS_TOKEN = 'pina_test_valid_access_token_123';
    process.env.PINTEREST_CLIENT_ID = 'test_pinterest_client_id';
    process.env.PINTEREST_CLIENT_SECRET = 'test_pinterest_client_secret';
    process.env.PINTEREST_REDIRECT_URI = 'http://localhost:3005/oauth/callback';
  });

  after(() => {
    process.env.PINTEREST_ACCESS_TOKEN = originalToken;
    process.env.PINTEREST_CLIENT_ID = originalClientId;
    process.env.PINTEREST_CLIENT_SECRET = originalClientSecret;
    process.env.PINTEREST_REDIRECT_URI = originalRedirectUri;
  });

  const mockContext = {
    logger: {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
    },
    auth: {
      subject: 'user_123',
    },
  } as any;

  describe('1. Pinterest OAuth 2.0 Flow & AuthService', () => {
    test('Required scopes include all necessary permissions for implemented tools', () => {
      assert.deepEqual(REQUIRED_PINTEREST_SCOPES, [
        'user_accounts:read',
        'boards:read',
        'boards:write',
        'pins:read',
        'pins:write',
      ]);
    });

    test('getAuthorizationUrl creates official Pinterest OAuth URL with exact parameters', () => {
      const authService = new PinterestAuthService();
      const authUrl = authService.getAuthorizationUrl('custom_state_123');

      assert.ok(authUrl);
      const url = new URL(authUrl);
      assert.equal(url.origin + url.pathname, 'https://www.pinterest.com/oauth/');
      assert.equal(url.searchParams.get('client_id'), 'test_pinterest_client_id');
      assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:3005/oauth/callback');
      assert.equal(url.searchParams.get('response_type'), 'code');
      assert.equal(url.searchParams.get('state'), 'custom_state_123');
      assert.equal(
        url.searchParams.get('scope'),
        'user_accounts:read,boards:read,boards:write,pins:read,pins:write'
      );
    });

    test('getAuthErrorMessage provides clear actionable instructions and auth URL', () => {
      const authService = new PinterestAuthService();
      const errorMsg = authService.getAuthErrorMessage();

      assert.match(errorMsg, /Pinterest authentication is required/);
      assert.match(errorMsg, /https:\/\/www\.pinterest\.com\/oauth\//);
      assert.match(errorMsg, /http:\/\/localhost:3005\/oauth\/callback/);
    });

    test('pinterest_auth_status tool returns active status when authenticated', async () => {
      const service = new PinterestService();
      const tools = new PinterestTools(service);

      const status = await tools.getAuthStatus({}, mockContext);
      assert.equal(status.authenticated, true);
      assert.equal(status.authorization_url, null);
    });

    test('pinterest_auth_status tool returns auth URL when not authenticated', async () => {
      const prevToken = process.env.PINTEREST_ACCESS_TOKEN;
      delete process.env.PINTEREST_ACCESS_TOKEN;

      const authService = new PinterestAuthService();
      // Clear in-memory token
      (authService as any).inMemoryToken = null;
      (authService as any).tokenData = null;

      const service = new PinterestService(authService);
      const tools = new PinterestTools(service);

      const status = await tools.getAuthStatus({}, mockContext);
      assert.equal(status.authenticated, false);
      assert.ok(status.authorization_url?.startsWith('https://www.pinterest.com/oauth/'));

      process.env.PINTEREST_ACCESS_TOKEN = prevToken;
    });
  });

  describe('2. get_boards tool & service', () => {
    test('getBoards normalizes raw Pinterest board items into required structure', async () => {
      const service = new PinterestService();

      (service as any).http.get = async (url: string, config?: any) => {
        assert.equal(url, '/boards');
        assert.equal(config?.params?.page_size, 25);
        return {
          status: 200,
          data: {
            items: [
              {
                id: '112233445566778899',
                name: 'Dream Home',
                description: 'Modern architecture and cozy interiors',
                privacy: 'PUBLIC',
                pin_count: 14,
                follower_count: 8,
                media: {
                  image_cover_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                },
              },
              {
                id: '998877665544332211',
                name: 'Secret Moodboard',
                description: null,
                privacy: 'SECRET',
                pin_count: 2,
                follower_count: 0,
              },
            ],
            bookmark: 'cursor_abc123',
          },
        };
      };

      const result = await service.getBoards();

      assert.equal(result.boards.length, 2);
      assert.deepEqual(result.boards[0], {
        id: '112233445566778899',
        name: 'Dream Home',
        description: 'Modern architecture and cozy interiors',
        url: 'https://www.pinterest.com/board/112233445566778899',
        privacy: 'PUBLIC',
        pin_count: 14,
        follower_count: 8,
        cover_image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      });
      assert.equal(result.boards[1].url, 'https://www.pinterest.com/board/998877665544332211');
      assert.equal(result.boards[1].description, '');
      assert.equal(result.has_more, true);
      assert.equal(result.bookmark, 'cursor_abc123');
    });

    test('get_boards MCP tool handles empty input {} and returns structured boards', async () => {
      const service = new PinterestService();
      (service as any).http.get = async () => ({
        status: 200,
        data: {
          items: [
            {
              id: '123456789012345678',
              name: 'Living Room Inspiration',
              description: 'Cozy sofas and natural light',
            },
          ],
        },
      });

      const tools = new PinterestTools(service);
      const toolOutput = await tools.getBoards({}, mockContext);

      assert.ok(toolOutput.boards);
      assert.equal(toolOutput.boards.length, 1);
      assert.deepEqual(toolOutput.boards[0], {
        id: '123456789012345678',
        name: 'Living Room Inspiration',
        description: 'Cozy sofas and natural light',
        url: 'https://www.pinterest.com/board/123456789012345678',
        privacy: 'PUBLIC',
        pin_count: 0,
        follower_count: 0,
        cover_image_url: '',
      });
    });

    test('get_boards throws clear actionable auth error if access token is missing', async () => {
      const prevToken = process.env.PINTEREST_ACCESS_TOKEN;
      delete process.env.PINTEREST_ACCESS_TOKEN;

      const authService = new PinterestAuthService();
      (authService as any).inMemoryToken = null;
      (authService as any).tokenData = null;

      const service = new PinterestService(authService);
      const tools = new PinterestTools(service);

      await assert.rejects(
        async () => {
          await tools.getBoards({}, mockContext);
        },
        /Pinterest authentication is required/
      );

      process.env.PINTEREST_ACCESS_TOKEN = prevToken;
    });
  });

  describe('3. create_board tool & service', () => {
    test('createBoard sends POST /v5/boards and returns success and board summary', async () => {
      const service = new PinterestService();

      let requestedUrl = '';
      let requestBody: any = null;

      (service as any).http.post = async (url: string, body: any) => {
        requestedUrl = url;
        requestBody = body;
        return {
          status: 201,
          data: {
            id: '556677889900112233',
            name: body.name,
            description: body.description,
            privacy: body.privacy,
            pin_count: 0,
            follower_count: 0,
            created_at: '2026-03-01T12:00:00Z',
          },
        };
      };

      const tools = new PinterestTools(service);
      const result = await tools.createBoard(
        {
          name: 'Dream Home',
          description: 'Home design inspiration',
        },
        mockContext
      );

      assert.equal(requestedUrl, '/boards');
      assert.deepEqual(requestBody, {
        name: 'Dream Home',
        description: 'Home design inspiration',
        privacy: 'PUBLIC',
      });
      assert.equal(result.success, true);
      assert.deepEqual(result.board, {
        id: '556677889900112233',
        name: 'Dream Home',
        description: 'Home design inspiration',
        url: 'https://www.pinterest.com/board/556677889900112233',
        privacy: 'PUBLIC',
        pin_count: 0,
        follower_count: 0,
        cover_image_url: '',
      });
    });

    test('create_board rejects invalid input when name is empty', async () => {
      const service = new PinterestService();
      const tools = new PinterestTools(service);

      await assert.rejects(
        async () => {
          await tools.createBoard({ name: '' }, mockContext);
        },
        /create_board failed: Board name is required/
      );
    });

    test('create_board rejects name exceeding 50 characters', async () => {
      const service = new PinterestService();
      const tools = new PinterestTools(service);

      await assert.rejects(
        async () => {
          await tools.createBoard({ name: 'A'.repeat(51) }, mockContext);
        },
        /create_board failed: Board name must not exceed 50 characters/
      );
    });
  });

  describe('4. save_pin tool & service', () => {
    test('savePin sends POST /v5/pins/{pin_id}/save with board_id in body', async () => {
      const service = new PinterestService();

      let requestedUrl = '';
      let requestBody: any = null;

      (service as any).http.post = async (url: string, body: any) => {
        requestedUrl = url;
        requestBody = body;
        return {
          status: 201,
          data: {
            id: '123456789012345678',
            board_id: '987654321098765432',
            title: 'Scandinavian Living Room',
            description: 'Minimalist interior with warm oak finishes',
            alt_text: 'Scandinavian interior',
            media: {
              images: {
                '600x900': {
                  url: 'https://i.pinimg.com/600x900/sample.jpg',
                  width: 600,
                  height: 900,
                },
              },
            },
          },
        };
      };

      const tools = new PinterestTools(service);
      const result = await tools.savePin(
        {
          pin_id: '123456789012345678',
          board_id: '987654321098765432',
        },
        mockContext
      );

      assert.equal(requestedUrl, '/pins/123456789012345678/save');
      assert.deepEqual(requestBody, {
        board_id: '987654321098765432',
      });
      assert.equal(result.success, true);
      assert.equal(
        result.message,
        'Pin 123456789012345678 was successfully saved to board 987654321098765432.'
      );
      assert.deepEqual(result.pin, {
        id: '123456789012345678',
        board_id: '987654321098765432',
        title: 'Scandinavian Living Room',
        description: 'Minimalist interior with warm oak finishes',
        url: 'https://www.pinterest.com/pin/123456789012345678',
        image_url: 'https://i.pinimg.com/600x900/sample.jpg',
      });
    });

    test('savePin supports optional board_section_id', async () => {
      const service = new PinterestService();

      let requestedUrl = '';
      let requestBody: any = null;

      (service as any).http.post = async (url: string, body: any) => {
        requestedUrl = url;
        requestBody = body;
        return {
          status: 201,
          data: {
            id: '123456789012345678',
            board_id: '987654321098765432',
            board_section_id: '11223344',
            title: 'Saved Pin',
          },
        };
      };

      const tools = new PinterestTools(service);
      const result = await tools.savePin(
        {
          pin_id: '123456789012345678',
          board_id: '987654321098765432',
          board_section_id: '11223344',
        },
        mockContext
      );

      assert.equal(requestedUrl, '/pins/123456789012345678/save');
      assert.deepEqual(requestBody, {
        board_id: '987654321098765432',
        board_section_id: '11223344',
      });
      assert.equal(result.success, true);
    });

    test('save_pin rejects non-numeric pin_id or board_id', async () => {
      const service = new PinterestService();
      const tools = new PinterestTools(service);

      await assert.rejects(
        async () => {
          await tools.savePin(
            {
              pin_id: 'invalid-pin-abc',
              board_id: '987654321098765432',
            },
            mockContext
          );
        },
        /save_pin failed: Invalid Pin ID/
      );

      await assert.rejects(
        async () => {
          await tools.savePin(
            {
              pin_id: '123456789012345678',
              board_id: 'invalid-board-xyz',
            },
            mockContext
          );
        },
        /save_pin failed: Invalid Board ID/
      );
    });
  });
});
