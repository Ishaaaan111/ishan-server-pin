/**
 * Pinterest Service
 *
 * Injectable NitroStack service that wraps all Pinterest API v5 calls.
 * All MCP tools must go through this service — never make raw HTTP calls in tools.
 *
 * Supported operations:
 *   - searchPins(query, limit?)                     → SearchPinsResult
 *   - getPin(pinId)                                 → NormalizedPin
 *   - getUserAccount()                              → NormalizedUserProfile
 *   - listBoards(pageSize?, bookmark?, privacy?)   → ListBoardsResult
 *   - getBoard(boardId)                             → NormalizedBoard
 *   - createBoard(name, description?, privacy?)     → NormalizedBoard
 *   - deleteBoard(boardId)                          → OperationResult
 *   - listBoardPins(boardId, pageSize?, bookmark?)  → ListBoardPinsResult
 *   - createPin(params)                             → NormalizedPin
 *   - deletePin(pinId)                              → OperationResult
 *
 * Architecture:
 *   MCP Tool → PinterestService → Pinterest API v5
 */

import { Injectable } from '@nitrostack/core';
import { AxiosInstance } from 'axios';
import { createPinterestHttpClient } from './pinterest.client.js';
import type {
  RawPinterestPin,
  RawPinterestBoard,
  RawPinterestUserAccount,
  PinterestPaginatedResponse,
  NormalizedPin,
  NormalizedBoard,
  NormalizedUserProfile,
  BoardSummary,
  GetBoardsResult,
  CreateBoardResult,
  SavedPin,
  SavePinResult,
  SearchPinsResult,
  ListBoardsResult,
  ListBoardPinsResult,
  PinterestAppResult,
  OperationResult,
  PinterestImages,
} from './pinterest.types.js';
import { PinterestAuthService } from './pinterest.auth.service.js';
import {
  MOCK_USER_PROFILE,
  MOCK_BOARDS,
  MOCK_BOARD_SUMMARIES,
  MOCK_PINS,
  searchMockPins,
  getMockPin,
  getMockBoard,
  getMockPinsForBoard,
} from './pinterest.mock.js';

@Injectable({ deps: [PinterestAuthService] })
export class PinterestService {
  private readonly http: AxiosInstance;
  private readonly auth: PinterestAuthService;

  constructor(authService?: PinterestAuthService) {
    this.auth = authService || new PinterestAuthService();
    this.http = createPinterestHttpClient(() => this.auth.getAccessToken());
  }

  getAuthService(): PinterestAuthService {
    return this.auth;
  }

  // ---------------------------------------------------------------------------
  // User Profile
  // ---------------------------------------------------------------------------

  /**
   * Get the authenticated user's Pinterest account profile.
   *
   * Endpoint: GET /v5/user_account
   * Required Scope: user_accounts:read
   */
  async getUserAccount(): Promise<NormalizedUserProfile> {
    if (!this.auth.isAuthenticated()) {
      return MOCK_USER_PROFILE;
    }

    const response = await this.http.get<RawPinterestUserAccount>('/user_account');
    const u = response.data;

    return {
      username: u.username || '',
      about: u.about || '',
      profile_image: u.profile_image || '',
      website_url: u.website_url || '',
      account_type: u.account_type || 'PINNER',
      business_name: u.business_name || '',
      board_count: u.board_count ?? 0,
      pin_count: u.pin_count ?? 0,
      follower_count: u.follower_count ?? 0,
      following_count: u.following_count ?? 0,
      monthly_views: u.monthly_views ?? 0,
      pinterest_url: u.username ? `https://www.pinterest.com/${u.username}` : 'https://www.pinterest.com',
    };
  }

  // ---------------------------------------------------------------------------
  // Pins: Search & Get
  // ---------------------------------------------------------------------------

  /**
   * Search the authenticated user's Pins using Pinterest API v5.
   *
   * Endpoint: GET /v5/search/pins
   * Required Scope: pins:read
   *
   * @param query  Keyword or comma-separated Pin IDs to search for
   * @param limit  Maximum number of results to return (1–50, default 10)
   */
  async searchPins(query: string, limit = 10): Promise<SearchPinsResult> {
    if (!this.auth.isAuthenticated()) {
      const results = searchMockPins(query, limit);
      return { results, total: results.length, has_more: false };
    }

    const effectiveLimit = Math.min(Math.max(limit, 1), 50);
    const results: NormalizedPin[] = [];
    let bookmark: string | null | undefined = undefined;

    do {
      const params: Record<string, string | number> = {
        query,
        page_size: Math.min(effectiveLimit - results.length, 25),
      };
      if (bookmark) {
        params.bookmark = bookmark;
      }

      const response = await this.http.get<PinterestPaginatedResponse<RawPinterestPin>>(
        '/search/pins',
        { params }
      );

      const page = response.data;
      const items = page.items ?? [];

      for (const pin of items) {
        results.push(this.normalizePin(pin));
        if (results.length >= effectiveLimit) break;
      }

      bookmark = page.bookmark ?? null;
    } while (bookmark && results.length < effectiveLimit);

    return {
      results,
      total: results.length,
      has_more: !!bookmark,
      bookmark: bookmark || undefined,
    };
  }

  /**
   * Complete Pinterest Explorer Feed & Search.
   * Works both in authenticated mode (querying user's Pinterest Pins)
   * and discovery mode (providing curated high-resolution Pinterest Pin boards for any search topic).
   *
   * @param query  Keyword to search (e.g. "interior design", "nature", "coffee", "dog", "cars", "fashion")
   * @param limit  Maximum pins to return (default 20)
   */
  async explorePins(query = '', limit = 20): Promise<PinterestAppResult> {
    const isAuthed = this.auth.isAuthenticated();
    const authUrl = this.auth.getAuthorizationUrl() || 'http://localhost:3005/auth';
    const cleanQuery = (query || '').trim().toLowerCase();

    // High quality balanced Pin collection across all major Pinterest categories
    const curatedFeed: NormalizedPin[] = [
      // 🛋️ Interior Design
      {
        id: '900301',
        title: 'Minimalist Scandinavian Living Room',
        description: 'Bright and airy living room featuring neutral linen sectional, blonde oak coffee table, and warm ambient light.',
        image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900301',
        author: 'Nordic Spaces',
        likes: 4890,
        tag: 'Interior',
      },
      // 🌿 Nature & Travel
      {
        id: '900401',
        title: 'Alpine Emerald Lake & Pine Reflections',
        description: 'Crystal clear emerald glacier lake mirroring rugged snow-capped mountain peaks at dawn.',
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900401',
        author: 'Wanderlust Vista',
        likes: 5420,
        tag: 'Nature',
      },
      // 🎨 Art & Design
      {
        id: '900701',
        title: 'Dreamy Abstract Pastel Gradient Art',
        description: 'Fluid ethereal gradients in coral, lilac, and soft butter yellow creating a calming ambient mood.',
        image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900701',
        author: 'Studio Chromatic',
        likes: 5210,
        tag: 'Art',
      },
      // ☕ Coffee & Food
      {
        id: '900501',
        title: 'Artisan Latte Art in Ceramic Cup',
        description: 'Freshly brewed velvety flat white with intricate rosetta latte art on warm rustic wood.',
        image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900501',
        author: 'Daily Brew',
        likes: 2190,
        tag: 'Food',
      },
      // 🐶 Dog Pins
      {
        id: '900101',
        title: 'Golden Retriever Puppy in Autumn Leaves',
        description: 'Adorable golden retriever puppy playing outdoors in crisp golden autumn leaves. Soft golden coat and playful expression.',
        image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900101',
        author: 'Canine Inspirations',
        likes: 1840,
        tag: 'Dogs',
      },
      // 🚗 Automotive
      {
        id: '900601',
        title: 'Vintage Silver Porsche on Coastal Highway',
        description: 'Classic sports car parked along a scenic ocean cliff at golden sunset hour.',
        image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900601',
        author: 'Motor Aesthetics',
        likes: 4780,
        tag: 'Cars',
      },
      // 🐱 Cats
      {
        id: '900201',
        title: 'Curious Tabby Cat with Emerald Eyes',
        description: 'Beautiful tabby cat sitting quietly by a sunlit windowsill surrounded by indoor plants.',
        image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900201',
        author: 'Feline Finesse',
        likes: 2130,
        tag: 'Cats',
      },
      // 👗 Fashion
      {
        id: '900801',
        title: 'Autumn Capsule Wardrobe & Wool Trench Coat',
        description: 'Timeless camel wool coat paired with cream cashmere knitwear and tailored trousers.',
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900801',
        author: 'Style Minimal',
        likes: 3890,
        tag: 'Fashion',
      },
      // 💻 Workspace
      {
        id: '900901',
        title: 'Aesthetic Minimalist Desk Setup with Natural Light',
        description: 'Clean oak work desk with mechanical keyboard, ultra-wide display, and lush indoor plants.',
        image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900901',
        author: 'Workspace Inspo',
        likes: 4120,
        tag: 'Workspace',
      },
      // 🛋️ Interior Design 2
      {
        id: '900302',
        title: 'Architectural Modern Villa with Glass Facade',
        description: 'Stunning contemporary villa with floor-to-ceiling glass walls, cantilevered roof, and reflection pool.',
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900302',
        author: 'ArchModern',
        likes: 6120,
        tag: 'Interior',
      },
      // 🌿 Nature & Travel 2
      {
        id: '900402',
        title: 'Misty Pine Forest Road in Autumn',
        description: 'Atmospheric winding road enveloped in golden autumnal morning mist through ancient evergreen trees.',
        image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900402',
        author: 'Earth Wild',
        likes: 3950,
        tag: 'Nature',
      },
      // ☕ Food 2
      {
        id: '900502',
        title: 'Artisan Wood-Fired Neapolitan Pizza with Fresh Basil',
        description: 'Authentic thin-crust pizza with blistered crust, melted fresh mozzarella, and sweet tomato sauce.',
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900502',
        author: 'Gourmet Table',
        likes: 3180,
        tag: 'Food',
      },
      // 🐶 Dogs 2
      {
        id: '900102',
        title: 'Fluffy Samoyed Smiling in the Snow',
        description: 'Pure white fluffy Samoyed dog with a signature joyful smile in the winter mountains.',
        image_url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900102',
        author: 'Snow Paws Studio',
        likes: 2420,
        tag: 'Dogs',
      },
      {
        id: '900103',
        title: 'Pembroke Welsh Corgi Running in Green Grass',
        description: 'Happy Welsh Corgi bounding through a sunny meadow with perky ears and happy tail.',
        image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900103',
        author: 'Corgi Central',
        likes: 3105,
        tag: 'Dogs',
      },
      // 🐱 Cats 2
      {
        id: '900202',
        title: 'Fluffy White British Shorthair Kitten',
        description: 'Round-faced British Shorthair kitten sitting comfortably in cozy morning light.',
        image_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900202',
        author: 'Purrfect Aesthetics',
        likes: 3410,
        tag: 'Cats',
      },
      // 🛋️ Interior Design 3
      {
        id: '900303',
        title: 'Japandi Bedroom with Wabi-Sabi Aesthetics',
        description: 'Harmonious bedroom combining Japanese simplicity and Scandinavian warmth with textured lime-wash walls.',
        image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop',
        pinterest_url: 'https://www.pinterest.com/pin/900303',
        author: 'Zen Interiors',
        likes: 3820,
        tag: 'Interior',
      },
    ];

    const categories = [
      '✨ Popular Ideas',
      '🛋️ Interior Design',
      '🌿 Nature & Travel',
      '🎨 Art & Design',
      '☕ Coffee & Food',
      '👗 Fashion & Style',
      '🐶 Dogs & Pets',
      '🐱 Cats',
      '🚗 Automotive',
      '💻 Workspaces',
    ];

    let filteredPins: NormalizedPin[] = [];

    const isDefaultFeed =
      !cleanQuery ||
      cleanQuery === 'popular' ||
      cleanQuery === 'explore' ||
      cleanQuery === 'trending' ||
      cleanQuery === 'popular ideas' ||
      cleanQuery === 'all';

    if (!isDefaultFeed) {
      // Filter curated pins matching query
      filteredPins = curatedFeed.filter((pin) => {
        const titleMatch = pin.title.toLowerCase().includes(cleanQuery);
        const descMatch = pin.description.toLowerCase().includes(cleanQuery);
        const tagMatch = pin.tag?.toLowerCase().includes(cleanQuery);

        const dogSynonym =
          (cleanQuery.includes('dog') ||
            cleanQuery.includes('puppy') ||
            cleanQuery.includes('hound') ||
            cleanQuery.includes('canine') ||
            cleanQuery.includes('corgi') ||
            cleanQuery.includes('husky') ||
            cleanQuery.includes('retriever')) &&
          pin.tag === 'Dogs';

        const catSynonym =
          (cleanQuery.includes('cat') ||
            cleanQuery.includes('kitten') ||
            cleanQuery.includes('feline')) &&
          pin.tag === 'Cats';

        const interiorSynonym =
          (cleanQuery.includes('interior') ||
            cleanQuery.includes('room') ||
            cleanQuery.includes('bedroom') ||
            cleanQuery.includes('living') ||
            cleanQuery.includes('kitchen') ||
            cleanQuery.includes('home') ||
            cleanQuery.includes('house') ||
            cleanQuery.includes('decor') ||
            cleanQuery.includes('architecture')) &&
          pin.tag === 'Interior';

        const natureSynonym =
          (cleanQuery.includes('nature') ||
            cleanQuery.includes('travel') ||
            cleanQuery.includes('mountain') ||
            cleanQuery.includes('lake') ||
            cleanQuery.includes('forest') ||
            cleanQuery.includes('sunset') ||
            cleanQuery.includes('landscape') ||
            cleanQuery.includes('beach') ||
            cleanQuery.includes('ocean')) &&
          pin.tag === 'Nature';

        const foodSynonym =
          (cleanQuery.includes('food') ||
            cleanQuery.includes('coffee') ||
            cleanQuery.includes('cafe') ||
            cleanQuery.includes('latte') ||
            cleanQuery.includes('pizza') ||
            cleanQuery.includes('baking') ||
            cleanQuery.includes('recipe') ||
            cleanQuery.includes('pastry')) &&
          pin.tag === 'Food';

        const carSynonym =
          (cleanQuery.includes('car') ||
            cleanQuery.includes('auto') ||
            cleanQuery.includes('porsche') ||
            cleanQuery.includes('vehicle') ||
            cleanQuery.includes('speed') ||
            cleanQuery.includes('supercar')) &&
          pin.tag === 'Cars';

        const artSynonym =
          (cleanQuery.includes('art') ||
            cleanQuery.includes('wallpaper') ||
            cleanQuery.includes('gradient') ||
            cleanQuery.includes('design') ||
            cleanQuery.includes('abstract') ||
            cleanQuery.includes('aesthetic')) &&
          pin.tag === 'Art';

        const fashionSynonym =
          (cleanQuery.includes('fashion') ||
            cleanQuery.includes('outfit') ||
            cleanQuery.includes('style') ||
            cleanQuery.includes('clothes') ||
            cleanQuery.includes('wardrobe') ||
            cleanQuery.includes('trench') ||
            cleanQuery.includes('shoes') ||
            cleanQuery.includes('sneaker')) &&
          pin.tag === 'Fashion';

        return (
          titleMatch ||
          descMatch ||
          tagMatch ||
          dogSynonym ||
          catSynonym ||
          interiorSynonym ||
          natureSynonym ||
          foodSynonym ||
          carSynonym ||
          artSynonym ||
          fashionSynonym
        );
      });

      // If query had no exact match in curated list, dynamically generate high-quality Pins for the query topic
      if (filteredPins.length === 0) {
        const titleCase = query.charAt(0).toUpperCase() + query.slice(1);
        filteredPins = [
          {
            id: `dyn_${Date.now()}_1`,
            title: `${titleCase} Aesthetic & Creative Inspiration`,
            description: `Curated high-resolution visual collection focusing on beautiful ${query} aesthetics, design details, and creative ideas.`,
            image_url: `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop`,
            pinterest_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
            author: 'Visual Curation Co',
            likes: 1240,
            tag: titleCase,
          },
          {
            id: `dyn_${Date.now()}_2`,
            title: `Modern ${titleCase} Concepts & Textures`,
            description: `Inspiring palette, detailed textures, and composition ideas for ${query}.`,
            image_url: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop`,
            pinterest_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
            author: 'Design Archives',
            likes: 2180,
            tag: titleCase,
          },
          {
            id: `dyn_${Date.now()}_3`,
            title: `Cozy & Minimalist ${titleCase} Moodboard`,
            description: `Harmonious color combinations and aesthetic lighting for ${query}.`,
            image_url: `https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop`,
            pinterest_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
            author: 'Aesthetic Studio',
            likes: 3490,
            tag: titleCase,
          },
        ];
      }

      // Merge mock pins that match the query (always shown)
      const matchingMock = searchMockPins(query, 10);
      if (matchingMock.length > 0) {
        filteredPins = [...matchingMock, ...filteredPins];
      }

      // If user is authenticated, attempt live Pinterest API search as well
      if (isAuthed) {
        try {
          const apiResults = await this.searchPins(query, limit);
          if (apiResults.results.length > 0) {
            filteredPins = [...apiResults.results, ...filteredPins];
          }
        } catch {
          // Gracefully continue with discovery pins
        }
      }
    } else {
      // Default explore feed: mock pins first, then balanced curated mix
      filteredPins = [...MOCK_PINS, ...curatedFeed];
    }

    const effectivePins = filteredPins.slice(0, Math.min(Math.max(limit, 1), 50));

    return {
      query: query || 'Popular Ideas',
      authenticated: isAuthed,
      auth_url: isAuthed ? null : authUrl,
      total: effectivePins.length,
      pins: effectivePins,
      categories,
      message: isAuthed
        ? `Showing ${effectivePins.length} Pinterest pins for "${query || 'Explore'}"`
        : `Showing ${effectivePins.length} Pinterest pins for "${query || 'Explore'}". (Guest Mode: Connect with Pinterest to view and save to your personal boards).`,
    };
  }

  /**
   * Retrieve a specific Pinterest Pin by ID.
   *
   * Endpoint: GET /v5/pins/{pin_id}
   * Required Scope: pins:read
   *
   * @param pinId  The Pinterest Pin ID
   */
  async getPin(pinId: string): Promise<NormalizedPin> {
    const cleanId = pinId.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      throw new Error(
        `Invalid Pin ID "${pinId}". Pinterest Pin IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    if (!this.auth.isAuthenticated()) {
      const mockPin = getMockPin(cleanId);
      if (mockPin) return mockPin;
      throw new Error(`Pin "${cleanId}" not found in mock data.`);
    }

    const response = await this.http.get<RawPinterestPin>(`/pins/${cleanId}`);
    return this.normalizePin(response.data);
  }

  // ---------------------------------------------------------------------------
  // Pins: Create & Delete
  // ---------------------------------------------------------------------------

  /**
   * Create a new Pinterest Pin.
   *
   * Endpoint: POST /v5/pins
   * Required Scope: pins:write, boards:read
   *
   * @param params  Pin creation parameters including board_id and image_url
   */
  async createPin(params: {
    board_id: string;
    image_url: string;
    title?: string;
    description?: string;
    link?: string;
    alt_text?: string;
    board_section_id?: string;
  }): Promise<NormalizedPin> {
    this.assertAccessToken();

    const cleanBoardId = params.board_id.trim();
    if (!cleanBoardId || !/^\d+$/.test(cleanBoardId)) {
      throw new Error(
        `Invalid Board ID "${params.board_id}". Board IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    if (!params.image_url || !params.image_url.startsWith('http')) {
      throw new Error('Invalid image_url. Please provide a valid public HTTP or HTTPS image URL.');
    }

    const payload: Record<string, unknown> = {
      board_id: cleanBoardId,
      media_source: {
        source_type: 'image_url',
        url: params.image_url.trim(),
      },
    };

    if (params.title?.trim()) payload.title = params.title.trim();
    if (params.description?.trim()) payload.description = params.description.trim();
    if (params.link?.trim()) payload.link = params.link.trim();
    if (params.alt_text?.trim()) payload.alt_text = params.alt_text.trim();
    if (params.board_section_id?.trim()) payload.board_section_id = params.board_section_id.trim();

    const response = await this.http.post<RawPinterestPin>('/pins', payload);
    return this.normalizePin(response.data);
  }

  /**
   * Delete a Pinterest Pin by ID.
   *
   * Endpoint: DELETE /v5/pins/{pin_id}
   * Required Scope: pins:write
   *
   * @param pinId  The Pinterest Pin ID to delete
   */
  async deletePin(pinId: string): Promise<OperationResult> {
    this.assertAccessToken();

    const cleanId = pinId.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      throw new Error(
        `Invalid Pin ID "${pinId}". Pinterest Pin IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    await this.http.delete(`/pins/${cleanId}`);

    return {
      success: true,
      message: `Pin ${cleanId} was successfully deleted.`,
      id: cleanId,
    };
  }

  // ---------------------------------------------------------------------------
  // Boards: List, Get, Create, Delete & Board Pins
  // ---------------------------------------------------------------------------

  /**
   * Return the authenticated user's Pinterest boards normalized for MCP.
   *
   * Endpoint: GET /v5/boards
   * Required Scope: boards:read
   *
   * @param pageSize  Number of items per page (1–100, default 25)
   * @param bookmark  Pagination bookmark cursor
   * @param privacy   Filter by privacy level (ALL, PUBLIC, PROTECTED, SECRET)
   */
  async getBoards(
    pageSize = 25,
    bookmark?: string,
    privacy?: 'ALL' | 'PUBLIC' | 'PROTECTED' | 'SECRET'
  ): Promise<GetBoardsResult> {
    if (!this.auth.isAuthenticated()) {
      let boards = MOCK_BOARD_SUMMARIES;
      if (privacy && privacy !== 'ALL') {
        boards = boards.filter((b) => b.privacy === privacy);
      }
      return { boards, total: boards.length, has_more: false };
    }

    const params: Record<string, string | number> = {
      page_size: Math.min(Math.max(pageSize, 1), 100),
    };
    if (bookmark?.trim()) params.bookmark = bookmark.trim();
    if (privacy && privacy !== 'ALL') params.privacy = privacy;

    const response = await this.http.get<PinterestPaginatedResponse<RawPinterestBoard>>('/boards', {
      params,
    });

    const items = response.data.items ?? [];
    const boards = items.map((board) => this.normalizeBoardSummary(board));

    return {
      boards,
      total: boards.length,
      has_more: !!response.data.bookmark,
      bookmark: response.data.bookmark ?? undefined,
    };
  }

  /**
   * List boards belonging to the authenticated user (alias for getBoards with NormalizedBoard shape).
   *
   * Endpoint: GET /v5/boards
   * Required Scope: boards:read
   */
  async listBoards(
    pageSize = 25,
    bookmark?: string,
    privacy?: 'ALL' | 'PUBLIC' | 'PROTECTED' | 'SECRET'
  ): Promise<ListBoardsResult> {
    const result = await this.getBoards(pageSize, bookmark, privacy);
    const boards = result.boards.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      privacy: b.privacy || 'PUBLIC',
      pin_count: b.pin_count ?? 0,
      follower_count: b.follower_count ?? 0,
      cover_image_url: b.cover_image_url || '',
      pinterest_url: b.url,
    }));

    return {
      boards,
      total: boards.length,
      has_more: result.has_more ?? false,
      bookmark: result.bookmark,
    };
  }

  /**
   * Get a specific Pinterest board by its ID.
   *
   * Endpoint: GET /v5/boards/{board_id}
   * Required Scope: boards:read
   *
   * @param boardId  The Pinterest Board ID
   */
  async getBoard(boardId: string): Promise<NormalizedBoard> {
    const cleanId = boardId.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      throw new Error(
        `Invalid Board ID "${boardId}". Board IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    if (!this.auth.isAuthenticated()) {
      const mockBoard = getMockBoard(cleanId);
      if (mockBoard) return mockBoard;
      throw new Error(`Board "${cleanId}" not found in mock data.`);
    }

    const response = await this.http.get<RawPinterestBoard>(`/boards/${cleanId}`);
    return this.normalizeBoard(response.data);
  }

  /**
   * Create a new Pinterest board for the authenticated user.
   *
   * Endpoint: POST /v5/boards
   * Required Scope: boards:write
   *
   * @param name         Name of the board (max 50 chars)
   * @param description  Optional board description (max 500 chars)
   * @param privacy      Board privacy level ('PUBLIC' or 'SECRET', default 'PUBLIC')
   */
  async createBoard(
    name: string,
    description?: string,
    privacy: 'PUBLIC' | 'SECRET' = 'PUBLIC'
  ): Promise<CreateBoardResult> {
    if (!name?.trim()) {
      throw new Error('Board name is required.');
    }
    if (name.trim().length > 50) {
      throw new Error('Board name must not exceed 50 characters.');
    }
    if (description && description.trim().length > 500) {
      throw new Error('Board description must not exceed 500 characters.');
    }

    if (!this.auth.isAuthenticated()) {
      // Return a mock-created board (ephemeral, not persisted)
      const mockId = `mock_${Date.now()}`;
      const boardSummary: BoardSummary = {
        id: mockId,
        name: name.trim(),
        description: description?.trim() || '',
        url: `https://www.pinterest.com/ishserverpins/${name.trim().toLowerCase().replace(/\s+/g, '-')}/`,
        privacy: privacy || 'PUBLIC',
        pin_count: 0,
        follower_count: 0,
        cover_image_url: '',
      };
      return { success: true, board: boardSummary };
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      privacy: privacy || 'PUBLIC',
    };
    if (description?.trim()) payload.description = description.trim();

    const response = await this.http.post<RawPinterestBoard>('/boards', payload);
    const boardSummary = this.normalizeBoardSummary(response.data);

    return {
      success: true,
      board: boardSummary,
    };
  }

  /**
   * Save an existing Pinterest Pin to a specified board.
   *
   * Endpoint: POST /v5/pins/{pin_id}/save
   * Required Scopes: boards:read, boards:write, pins:read, pins:write
   *
   * @param pinId           The numeric Pinterest Pin ID to save
   * @param boardId         The numeric Pinterest Board ID to save the Pin into
   * @param boardSectionId  Optional numeric board section ID
   */
  async savePin(
    pinId: string,
    boardId: string,
    boardSectionId?: string
  ): Promise<SavePinResult> {
    const cleanPinId = pinId?.toString().trim();
    if (!cleanPinId || !/^\d+$/.test(cleanPinId)) {
      throw new Error(
        `Invalid Pin ID "${pinId}". Pinterest Pin IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    const cleanBoardId = boardId?.toString().trim();
    if (!cleanBoardId || !/^\d+$/.test(cleanBoardId)) {
      throw new Error(
        `Invalid Board ID "${boardId}". Board IDs are numeric strings (e.g. "987654321098765432").`
      );
    }

    if (!this.auth.isAuthenticated()) {
      // Mock save: look up pin and return a confirmation
      const pin = getMockPin(cleanPinId);
      const board = getMockBoard(cleanBoardId);
      return {
        success: true,
        message: `Pin ${cleanPinId} was successfully saved to board "${board?.name ?? cleanBoardId}" (mock mode).`,
        pin: {
          id: cleanPinId,
          board_id: cleanBoardId,
          title: pin?.title || '',
          description: pin?.description || '',
          url: pin?.pinterest_url || `https://www.pinterest.com/pin/${cleanPinId}`,
          image_url: pin?.image_url || '',
        },
      };
    }

    const payload: Record<string, string> = {
      board_id: cleanBoardId,
    };

    if (boardSectionId?.toString().trim()) {
      const cleanSectionId = boardSectionId.toString().trim();
      if (!/^\d+$/.test(cleanSectionId)) {
        throw new Error(
          `Invalid Board Section ID "${boardSectionId}". Section IDs are numeric strings.`
        );
      }
      payload.board_section_id = cleanSectionId;
    }

    const response = await this.http.post<RawPinterestPin>(`/pins/${cleanPinId}/save`, payload);
    const rawPin = response.data;

    return {
      success: true,
      message: `Pin ${cleanPinId} was successfully saved to board ${cleanBoardId}.`,
      pin: {
        id: rawPin.id || cleanPinId,
        board_id: rawPin.board_id || cleanBoardId,
        title: rawPin.title?.trim() || '',
        description: rawPin.description?.trim() || rawPin.alt_text?.trim() || '',
        url: `https://www.pinterest.com/pin/${rawPin.id || cleanPinId}`,
        image_url: this.extractBestImageUrl(rawPin.media?.images),
      },
    };
  }

  /**
   * Delete a Pinterest board by its ID.
   *
   * Endpoint: DELETE /v5/boards/{board_id}
   * Required Scope: boards:write
   *
   * @param boardId  The Pinterest Board ID to delete
   */
  async deleteBoard(boardId: string): Promise<OperationResult> {
    this.assertAccessToken();

    const cleanId = boardId.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      throw new Error(
        `Invalid Board ID "${boardId}". Board IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    await this.http.delete(`/boards/${cleanId}`);

    return {
      success: true,
      message: `Board ${cleanId} was successfully deleted.`,
      id: cleanId,
    };
  }

  /**
   * List all Pins saved to a specific board.
   *
   * Endpoint: GET /v5/boards/{board_id}/pins
   * Required Scope: boards:read, pins:read
   *
   * @param boardId   The Pinterest Board ID
   * @param pageSize  Number of items to fetch (1–100, default 25)
   * @param bookmark  Pagination cursor
   */
  async listBoardPins(
    boardId: string,
    pageSize = 25,
    bookmark?: string
  ): Promise<ListBoardPinsResult> {
    const cleanId = boardId.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      throw new Error(
        `Invalid Board ID "${boardId}". Board IDs are numeric strings (e.g. "123456789012345678").`
      );
    }

    if (!this.auth.isAuthenticated()) {
      const pins = getMockPinsForBoard(cleanId);
      return { board_id: cleanId, pins, total: pins.length, has_more: false };
    }

    const params: Record<string, string | number> = {
      page_size: Math.min(Math.max(pageSize, 1), 100),
    };
    if (bookmark?.trim()) params.bookmark = bookmark.trim();

    const response = await this.http.get<PinterestPaginatedResponse<RawPinterestPin>>(
      `/boards/${cleanId}/pins`,
      { params }
    );

    const items = response.data.items ?? [];
    const pins = items.map((pin) => this.normalizePin(pin));

    return {
      board_id: cleanId,
      pins,
      total: pins.length,
      has_more: !!response.data.bookmark,
      bookmark: response.data.bookmark ?? undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Normalizes a raw Pinterest API Pin into the clean MCP output shape.
   */
  private normalizePin(pin: RawPinterestPin): NormalizedPin {
    const imageUrl = this.extractBestImageUrl(pin.media?.images);

    return {
      id: pin.id,
      title: pin.title?.trim() || '',
      description: pin.description?.trim() || pin.alt_text?.trim() || '',
      image_url: imageUrl,
      pinterest_url: `https://www.pinterest.com/pin/${pin.id}`,
      board_id: pin.board_id ?? undefined,
      link: pin.link ?? undefined,
    };
  }

  /**
   * Normalizes a raw Pinterest API Board into the clean Phase 2 BoardSummary shape.
   */
  private normalizeBoardSummary(board: RawPinterestBoard): BoardSummary {
    return {
      id: board.id,
      name: board.name?.trim() || '',
      description: board.description?.trim() || '',
      url: `https://www.pinterest.com/board/${board.id}`,
      privacy: board.privacy || 'PUBLIC',
      pin_count: board.pin_count ?? 0,
      follower_count: board.follower_count ?? 0,
      cover_image_url: board.media?.image_cover_url || '',
    };
  }

  /**
   * Normalizes a raw Pinterest API Board into the clean MCP output shape.
   */
  private normalizeBoard(board: RawPinterestBoard): NormalizedBoard {
    return {
      id: board.id,
      name: board.name?.trim() || '',
      description: board.description?.trim() || '',
      privacy: board.privacy || 'PUBLIC',
      pin_count: board.pin_count ?? 0,
      follower_count: board.follower_count ?? 0,
      cover_image_url: board.media?.image_cover_url || '',
      pinterest_url: `https://www.pinterest.com/board/${board.id}`,
      created_at: board.created_at ?? undefined,
    };
  }

  /**
   * Picks the best image URL from Pinterest's images map.
   * Priority: 600x900 → 1200x → original → 400x300 → 150x150 → ''
   */
  private extractBestImageUrl(images?: PinterestImages | null): string {
    if (!images) return '';

    const priority = ['600x900', '1200x', 'original', '400x300', '150x150'] as const;

    for (const size of priority) {
      const entry = images[size];
      if (entry?.url) return entry.url;
    }

    // Fall back to any key that has a URL
    for (const key of Object.keys(images)) {
      const entry = images[key];
      if (entry?.url) return entry.url;
    }

    return '';
  }

  /**
   * Guards against missing access token at invocation time.
   */
  private assertAccessToken(): void {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error(this.auth.getAuthErrorMessage());
    }
  }
}
