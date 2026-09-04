/**
 * Pinterest MCP Tools with Interactive UI Widgets
 *
 * Implements:
 *   - search_pins       [@Widget('pin-search-results')] : Search user Pins (Phase 1)
 *   - get_pin           [@Widget('pin-details')]        : Retrieve Pin details by ID (Phase 1)
 *   - get_user_account  [@Widget('user-profile')]       : Get profile & account metrics (Phase 1)
 *   - get_boards        [@Widget('board-list')]         : List user boards (Phase 2)
 *   - create_board      [@Widget('board-details')]      : Create a new board (Phase 2)
 *   - save_pin          [@Widget('pin-details')]        : Save existing pin to a board (Phase 2)
 *
 * Architecture:
 *   MCP Client / LLM → PinterestTools (@Tool + @Widget) → PinterestService → Pinterest API v5
 */

import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { PinterestService } from '../../services/pinterest/pinterest.service.js';

@Injectable({ deps: [PinterestService] })
export class PinterestTools {
  constructor(private readonly pinterestService: PinterestService) {}

  // ---------------------------------------------------------------------------
  // Tool: pinterest_auth_status
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'pinterest_auth_status',
    description:
      'Check the current Pinterest OAuth 2.0 authentication status and retrieve the authorization URL if not authenticated.',
    inputSchema: z.object({}),
    examples: {
      request: {},
      response: {
        authenticated: true,
        authorization_url: null,
        message: 'Successfully authenticated with Pinterest.',
      },
    },
  })
  async getAuthStatus(_input: Record<string, never>, ctx: ExecutionContext) {
    const authService = this.pinterestService.getAuthService();
    const authenticated = authService.isAuthenticated();
    const authUrl = authService.getAuthorizationUrl();

    ctx.logger.info('pinterest_auth_status called', {
      authenticated,
      user: ctx.auth?.subject,
    });

    if (authenticated) {
      return {
        authenticated: true,
        authorization_url: null,
        message: 'Successfully authenticated with Pinterest. All Pinterest MCP tools are ready to use.',
      };
    }

    return {
      authenticated: false,
      authorization_url: authUrl,
      message: authService.getAuthErrorMessage(),
    };
  }

  // ---------------------------------------------------------------------------
  // Tool: pinterest_app (Interactive Pinterest Explorer Widget)
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'pinterest_app',
    description:
      'Open the full interactive Pinterest application widget. ' +
      'Features Pinterest Login, Sign Up, live search bar, category discovery pills (Dogs, Cats, Interior, Nature, etc.), ' +
      'masonry grid view, and pin saving.',
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .default('')
        .describe('Optional search keyword (e.g. "dog", "puppy", "interior design", "nature")'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(20)
        .describe('Maximum number of pins to return (1–50, default 20)'),
    }),
    examples: {
      request: { query: 'dog' },
      response: {
        query: 'dog',
        authenticated: false,
        auth_url: 'http://localhost:3005/auth',
        total: 8,
        pins: [
          {
            id: '900101',
            title: 'Golden Retriever Puppy in Autumn Leaves',
            description: 'Adorable golden retriever puppy playing outdoors in crisp golden autumn leaves.',
            image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
            pinterest_url: 'https://www.pinterest.com/pin/900101',
            author: 'Canine Inspirations',
            likes: 1840,
            tag: 'Dogs',
          },
        ],
        categories: [
          '🐶 Dogs',
          '🐱 Cats',
          '🛋️ Interior Design',
          '🌿 Nature & Travel',
          '☕ Coffee & Food',
          '🚗 Automotive',
          '🎨 Art & Design',
        ],
        message: 'Showing 8 Pinterest pins for "dog"',
      },
    },
  })
  @Widget('pin-search-results')
  async openPinterestApp(
    input: { query?: string; limit?: number },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('pinterest_app called', {
      query: input?.query,
      limit: input?.limit,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.explorePins(input?.query ?? '', input?.limit ?? 20);
      ctx.logger.info('pinterest_app completed', {
        returned: result.total,
        authenticated: result.authenticated,
      });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error exploring Pinterest';
      ctx.logger.error('pinterest_app failed', { error: message });
      throw new Error(`pinterest_app failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: search_pins
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'search_pins',
    description:
      'Search Pinterest Pins with live interactive UI widget. ' +
      'Returns matching Pins with image URLs, titles, descriptions, and Pinterest links. ' +
      'Supports searching for any topic such as "dog", "puppy", "interior design", "nature", etc.',
    inputSchema: z.object({
      query: z
        .string()
        .min(1, 'query must not be empty')
        .describe(
          'The search keyword or phrase to look for in Pinterest Pins (e.g. "dog", "puppy", "modern bedroom", "nature").'
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(12)
        .describe('Maximum number of Pins to return (1–50, default 12)'),
    }),
    examples: {
      request: { query: 'dog', limit: 8 },
      response: {
        results: [
          {
            id: '900101',
            title: 'Golden Retriever Puppy in Autumn Leaves',
            description: 'Adorable golden retriever puppy playing outdoors in crisp golden autumn leaves',
            image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
            pinterest_url: 'https://www.pinterest.com/pin/900101',
            author: 'Canine Inspirations',
            likes: 1840,
            tag: 'Dogs',
          },
        ],
        total: 1,
        has_more: false,
      },
    },
  })
  @Widget('pin-search-results')
  async searchPins(
    input: { query: string; limit?: number },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('search_pins called', {
      query: input.query,
      limit: input.limit,
      user: ctx.auth?.subject,
    });

    try {
      if (this.pinterestService.getAuthService().isAuthenticated()) {
        try {
          const apiResult = await this.pinterestService.searchPins(input.query, input.limit);
          if (apiResult.results.length > 0) {
            return apiResult;
          }
        } catch {
          // If user pins search returns 0 or scope limitation, fall back to explore search
        }
      }

      const exploreResult = await this.pinterestService.explorePins(input.query, input.limit ?? 12);
      return {
        query: input.query,
        results: exploreResult.pins,
        pins: exploreResult.pins,
        total: exploreResult.total,
        has_more: false,
        authenticated: exploreResult.authenticated,
        auth_url: exploreResult.auth_url,
        categories: exploreResult.categories,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error searching Pinterest';
      ctx.logger.error('search_pins failed', { query: input.query, error: message });
      throw new Error(`search_pins failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: get_pin
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'get_pin',
    description:
      'Retrieve detailed information about a specific Pinterest Pin by its numeric ID. ' +
      'Returns the Pin\'s title, description, image URL, and direct link to the Pinterest page.',
    inputSchema: z.object({
      pin_id: z
        .string()
        .min(1, 'pin_id must not be empty')
        .describe(
          'The numeric Pinterest Pin ID. ' +
          'You can find this in the Pin URL: pinterest.com/pin/{pin_id}. ' +
          'Example: "123456789012345678"'
        ),
    }),
    examples: {
      request: { pin_id: '123456789012345678' },
      response: {
        id: '123456789012345678',
        title: 'Modern Minimal Living Room',
        description: 'A bright, airy living room with Scandinavian design touches and warm ambient lighting',
        image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/123456789012345678',
      },
    },
  })
  @Widget('pin-details')
  async getPin(input: { pin_id: string }, ctx: ExecutionContext) {
    ctx.logger.info('get_pin called', {
      pin_id: input.pin_id,
      user: ctx.auth?.subject,
    });

    try {
      const pin = await this.pinterestService.getPin(input.pin_id);

      ctx.logger.info('get_pin completed', { pin_id: input.pin_id });

      return pin;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching Pinterest Pin';
      ctx.logger.error('get_pin failed', { pin_id: input.pin_id, error: message });
      throw new Error(`get_pin failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: get_user_account
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'get_user_account',
    description:
      'Retrieve the Pinterest profile details and account metrics for the authenticated user. ' +
      'Returns username, bio, profile image, website URL, board count, pin count, and follower numbers.',
    inputSchema: z.object({}),
    examples: {
      request: {},
      response: {
        username: 'janedoe',
        about: 'Designer & Architect curating minimalist spaces, architectural interiors, and modern decor.',
        profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop',
        website_url: 'https://example.com',
        account_type: 'PINNER',
        business_name: '',
        board_count: 12,
        pin_count: 340,
        follower_count: 1250,
        following_count: 420,
        monthly_views: 45000,
        pinterest_url: 'https://www.pinterest.com/janedoe',
      },
    },
  })
  @Widget('user-profile')
  async getUserAccount(_input: Record<string, never>, ctx: ExecutionContext) {
    ctx.logger.info('get_user_account called', {
      user: ctx.auth?.subject,
    });

    try {
      const profile = await this.pinterestService.getUserAccount();

      ctx.logger.info('get_user_account completed', {
        username: profile.username,
        pin_count: profile.pin_count,
        board_count: profile.board_count,
      });

      return profile;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching Pinterest account profile';
      ctx.logger.error('get_user_account failed', { error: message });
      throw new Error(`get_user_account failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: get_boards (Phase 2)
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'get_boards',
    description:
      'Return the authenticated user\'s Pinterest boards. ' +
      'Returns a list of boards with their ID, name, description, and Pinterest URL.',
    inputSchema: z.object({
      page_size: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe('Optional maximum number of boards to return (1–100, default 25)'),
      bookmark: z
        .string()
        .optional()
        .describe('Optional pagination cursor bookmark from a previous get_boards response'),
      privacy: z
        .enum(['ALL', 'PUBLIC', 'PROTECTED', 'SECRET'])
        .optional()
        .default('ALL')
        .describe('Optional filter by board privacy setting (ALL, PUBLIC, PROTECTED, SECRET)'),
    }).default({}),
    examples: {
      request: {},
      response: {
        boards: [
          {
            id: '987654321098765432',
            name: 'Dream Home',
            description: 'Home design inspiration and modern architecture',
            url: 'https://www.pinterest.com/board/987654321098765432',
          },
        ],
      },
    },
  })
  @Widget('board-list')
  async getBoards(
    input: { page_size?: number; bookmark?: string; privacy?: 'ALL' | 'PUBLIC' | 'PROTECTED' | 'SECRET' },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('get_boards called', {
      page_size: input?.page_size,
      privacy: input?.privacy,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.getBoards(
        input?.page_size,
        input?.bookmark,
        input?.privacy
      );

      ctx.logger.info('get_boards completed', {
        returned: result.boards.length,
        has_more: result.has_more,
      });

      return {
        boards: result.boards,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching Pinterest boards';
      ctx.logger.error('get_boards failed', { error: message });
      throw new Error(`get_boards failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: create_board (Phase 2)
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'create_board',
    description:
      'Create a new Pinterest board for the authenticated user using the official Pinterest API v5. ' +
      'Requires a board name and accepts an optional description and privacy setting.',
    inputSchema: z.object({
      name: z
        .string()
        .min(1, 'name is required and must not be empty')
        .max(50, 'name must be 50 characters or fewer')
        .describe('The title/name of the board (required, up to 50 characters)'),
      description: z
        .string()
        .max(500, 'description must be 500 characters or fewer')
        .optional()
        .describe('Optional detailed description of what this board is about'),
      privacy: z
        .enum(['PUBLIC', 'SECRET'])
        .optional()
        .default('PUBLIC')
        .describe('Optional board privacy level: "PUBLIC" (default) or "SECRET"'),
    }),
    examples: {
      request: {
        name: 'Dream Home',
        description: 'Home design inspiration',
      },
      response: {
        success: true,
        board: {
          id: '987654321098765432',
          name: 'Dream Home',
          description: 'Home design inspiration',
          url: 'https://www.pinterest.com/board/987654321098765432',
        },
      },
    },
  })
  @Widget('board-details')
  async createBoard(
    input: { name: string; description?: string; privacy?: 'PUBLIC' | 'SECRET' },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('create_board called', {
      name: input.name,
      privacy: input.privacy,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.createBoard(
        input.name,
        input.description,
        input.privacy
      );

      ctx.logger.info('create_board completed', {
        board_id: result.board.id,
        name: result.board.name,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error creating Pinterest board';
      ctx.logger.error('create_board failed', { name: input.name, error: message });
      throw new Error(`create_board failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: save_pin (Phase 2)
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'save_pin',
    description:
      'Save/add an existing Pinterest Pin to a specified board using the official Pinterest API v5. ' +
      'Requires pin_id and board_id.',
    inputSchema: z.object({
      pin_id: z
        .string()
        .min(1, 'pin_id is required and must not be empty')
        .describe('The numeric ID of the Pin to save (e.g. "123456789012345678")'),
      board_id: z
        .string()
        .min(1, 'board_id is required and must not be empty')
        .describe('The numeric ID of the destination board (e.g. "987654321098765432")'),
      board_section_id: z
        .string()
        .optional()
        .describe('Optional numeric ID of a specific section inside the board'),
    }),
    examples: {
      request: {
        pin_id: '123456789012345678',
        board_id: '987654321098765432',
      },
      response: {
        success: true,
        message: 'Pin 123456789012345678 was successfully saved to board 987654321098765432.',
        pin: {
          id: '123456789012345678',
          board_id: '987654321098765432',
          title: 'Scandinavian Living Room',
          description: 'Aesthetic Scandinavian living room setup',
          url: 'https://www.pinterest.com/pin/123456789012345678',
        },
      },
    },
  })
  @Widget('pin-details')
  async savePin(
    input: { pin_id: string; board_id: string; board_section_id?: string },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('save_pin called', {
      pin_id: input.pin_id,
      board_id: input.board_id,
      board_section_id: input.board_section_id,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.savePin(
        input.pin_id,
        input.board_id,
        input.board_section_id
      );

      ctx.logger.info('save_pin completed', {
        pin_id: input.pin_id,
        board_id: input.board_id,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error saving Pin to board';
      ctx.logger.error('save_pin failed', {
        pin_id: input.pin_id,
        board_id: input.board_id,
        error: message,
      });
      throw new Error(`save_pin failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: delete_board
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'delete_board',
    description:
      'Permanently delete a Pinterest board by its numeric ID. ' +
      '⚠️ Warning: Deleting a board also deletes all Pins saved inside it.',
    inputSchema: z.object({
      board_id: z
        .string()
        .min(1, 'board_id must not be empty')
        .describe('The numeric Pinterest Board ID to delete'),
    }),
    examples: {
      request: { board_id: '987654321098765432' },
      response: {
        success: true,
        message: 'Board 987654321098765432 was successfully deleted.',
        id: '987654321098765432',
      },
    },
  })
  async deleteBoard(input: { board_id: string }, ctx: ExecutionContext) {
    ctx.logger.info('delete_board called', {
      board_id: input.board_id,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.deleteBoard(input.board_id);

      ctx.logger.info('delete_board completed', { board_id: input.board_id });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error deleting Pinterest board';
      ctx.logger.error('delete_board failed', { board_id: input.board_id, error: message });
      throw new Error(`delete_board failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: list_board_pins
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'list_board_pins',
    description:
      'List all Pins saved to a specific Pinterest board by its board ID. ' +
      'Returns a list of Pins with IDs, titles, descriptions, images, and links.',
    inputSchema: z.object({
      board_id: z
        .string()
        .min(1, 'board_id must not be empty')
        .describe('The numeric Pinterest Board ID'),
      page_size: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe('Maximum number of Pins to return (1–100, default 25)'),
      bookmark: z
        .string()
        .optional()
        .describe('Pagination cursor from a previous list_board_pins response'),
    }),
    examples: {
      request: { board_id: '987654321098765432', page_size: 10 },
      response: {
        board_id: '987654321098765432',
        pins: [
          {
            id: '123456789012345678',
            title: 'Oak Dining Table',
            description: 'Solid white oak dining table with curved edges and minimalist silhouettes',
            image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop',
            pinterest_url: 'https://www.pinterest.com/pin/123456789012345678',
          },
        ],
        total: 1,
        has_more: false,
      },
    },
  })
  @Widget('pin-search-results')
  async listBoardPins(
    input: { board_id: string; page_size?: number; bookmark?: string },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('list_board_pins called', {
      board_id: input.board_id,
      page_size: input.page_size,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.listBoardPins(
        input.board_id,
        input.page_size,
        input.bookmark
      );

      ctx.logger.info('list_board_pins completed', {
        board_id: input.board_id,
        returned: result.total,
        has_more: result.has_more,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error listing board pins';
      ctx.logger.error('list_board_pins failed', { board_id: input.board_id, error: message });
      throw new Error(`list_board_pins failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: create_pin
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'create_pin',
    description:
      'Create a new Pin on a Pinterest board. ' +
      'Requires a destination board ID and a publicly accessible image URL. ' +
      'Supports optional title, description, destination link, and accessibility alt text.',
    inputSchema: z.object({
      board_id: z
        .string()
        .min(1, 'board_id must not be empty')
        .describe('The numeric ID of the board to save this Pin to (e.g. "987654321098765432")'),
      image_url: z
        .string()
        .url('image_url must be a valid URL')
        .describe('Direct public HTTP/HTTPS URL of the image to Pin'),
      title: z
        .string()
        .max(100, 'title must be 100 characters or fewer')
        .optional()
        .describe('Optional Pin title (up to 100 characters)'),
      description: z
        .string()
        .max(800, 'description must be 800 characters or fewer')
        .optional()
        .describe('Optional Pin description (up to 800 characters)'),
      link: z
        .string()
        .url('link must be a valid URL')
        .optional()
        .describe('Optional destination URL when users click the Pin'),
      alt_text: z
        .string()
        .max(500, 'alt_text must be 500 characters or fewer')
        .optional()
        .describe('Optional accessibility alt text for the image'),
      board_section_id: z
        .string()
        .optional()
        .describe('Optional numeric ID of a specific section inside the board'),
    }),
    examples: {
      request: {
        board_id: '987654321098765432',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
        title: 'Modern Green Velvet Sofa',
        description: 'Contemporary living room centerpiece with walnut legs',
        link: 'https://example.com/furniture/sofa',
        alt_text: 'Green velvet sofa in an airy living room',
      },
      response: {
        id: '123456789012345678',
        title: 'Modern Green Velvet Sofa',
        description: 'Contemporary living room centerpiece with walnut legs',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/123456789012345678',
      },
    },
  })
  @Widget('pin-details')
  async createPin(
    input: {
      board_id: string;
      image_url: string;
      title?: string;
      description?: string;
      link?: string;
      alt_text?: string;
      board_section_id?: string;
    },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('create_pin called', {
      board_id: input.board_id,
      title: input.title,
      image_url: input.image_url,
      user: ctx.auth?.subject,
    });

    try {
      const pin = await this.pinterestService.createPin(input);

      ctx.logger.info('create_pin completed', {
        pin_id: pin.id,
        board_id: input.board_id,
      });

      return pin;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error creating Pinterest Pin';
      ctx.logger.error('create_pin failed', { board_id: input.board_id, error: message });
      throw new Error(`create_pin failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: delete_pin
  // ---------------------------------------------------------------------------

  @Tool({
    name: 'delete_pin',
    description:
      'Permanently delete a Pinterest Pin by its numeric ID. ' +
      '⚠️ Note: The authenticated user must own the Pin to delete it.',
    inputSchema: z.object({
      pin_id: z
        .string()
        .min(1, 'pin_id must not be empty')
        .describe('The numeric Pinterest Pin ID to delete (e.g. "123456789012345678")'),
    }),
    examples: {
      request: { pin_id: '123456789012345678' },
      response: {
        success: true,
        message: 'Pin 123456789012345678 was successfully deleted.',
        id: '123456789012345678',
      },
    },
  })
  async deletePin(input: { pin_id: string }, ctx: ExecutionContext) {
    ctx.logger.info('delete_pin called', {
      pin_id: input.pin_id,
      user: ctx.auth?.subject,
    });

    try {
      const result = await this.pinterestService.deletePin(input.pin_id);

      ctx.logger.info('delete_pin completed', { pin_id: input.pin_id });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error deleting Pinterest Pin';
      ctx.logger.error('delete_pin failed', { pin_id: input.pin_id, error: message });
      throw new Error(`delete_pin failed: ${message}`);
    }
  }
}
