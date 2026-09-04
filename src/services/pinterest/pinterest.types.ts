/**
 * Pinterest API v5 — TypeScript Types
 *
 * Raw API response shapes and normalized output types for MCP tools.
 * Never expose raw Pinterest API responses directly to MCP clients.
 */

// ---------------------------------------------------------------------------
// Raw Pinterest API response types (v5)
// ---------------------------------------------------------------------------

/** A single image size entry inside a Pin's media.images map */
export interface PinterestImageEntry {
  url: string;
  width: number;
  height: number;
}

/** The images map returned by the Pinterest API inside pin.media */
export interface PinterestImages {
  '150x150'?: PinterestImageEntry;
  '400x300'?: PinterestImageEntry;
  '600x900'?: PinterestImageEntry;
  '1200x'?: PinterestImageEntry;
  original?: PinterestImageEntry;
  [key: string]: PinterestImageEntry | undefined;
}

/** Raw Pin object as returned by Pinterest API v5 */
export interface RawPinterestPin {
  id: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  alt_text?: string | null;
  board_id?: string | null;
  board_section_id?: string | null;
  created_at?: string | null;
  dominant_color?: string | null;
  media_type?: string | null;
  media?: {
    media_type?: string;
    images?: PinterestImages;
  } | null;
  note?: string | null;
  pin_metrics?: Record<string, unknown> | null;
}

/** Raw Board object as returned by Pinterest API v5 */
export interface RawPinterestBoard {
  id: string;
  name: string;
  description?: string | null;
  privacy?: 'PUBLIC' | 'PROTECTED' | 'SECRET' | null;
  pin_count?: number | null;
  follower_count?: number | null;
  collaborator_count?: number | null;
  created_at?: string | null;
  media?: {
    image_cover_url?: string | null;
    pin_thumbnail_urls?: string[] | null;
  } | null;
  owner?: {
    username?: string | null;
  } | null;
}

/** Raw User Account profile object as returned by Pinterest API v5 */
export interface RawPinterestUserAccount {
  account_type?: 'PINNER' | 'BUSINESS' | string | null;
  profile_image?: string | null;
  website_url?: string | null;
  username?: string | null;
  about?: string | null;
  business_name?: string | null;
  board_count?: number | null;
  pin_count?: number | null;
  follower_count?: number | null;
  following_count?: number | null;
  monthly_views?: number | null;
}

/** Raw paginated list response */
export interface PinterestPaginatedResponse<T> {
  items: T[];
  bookmark?: string | null;
}

/** Pinterest API error item */
export interface PinterestApiErrorItem {
  code: number;
  message: string;
}

/** Pinterest API error response body */
export interface PinterestApiErrorResponse {
  code?: number;
  message?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Normalized MCP output types (clean, client-safe)
// ---------------------------------------------------------------------------

/**
 * Normalized Pin shape returned by all MCP Pinterest tools.
 * Does NOT expose raw API internals.
 */
export interface NormalizedPin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  pinterest_url: string;
  board_id?: string;
  link?: string;
  author?: string;
  likes?: number;
  tag?: string;
}

/**
 * Result shape for search_pins tool
 */
export interface SearchPinsResult {
  results: NormalizedPin[];
  total: number;
  has_more: boolean;
  bookmark?: string | null;
}

/**
 * Result shape for full Pinterest App explorer tool
 */
export interface PinterestAppResult {
  query: string;
  authenticated: boolean;
  auth_url: string | null;
  total: number;
  pins: NormalizedPin[];
  categories: string[];
  message: string;
}

/**
 * Normalized Board shape returned by board MCP tools.
 */
export interface NormalizedBoard {
  id: string;
  name: string;
  description: string;
  privacy: string;
  pin_count: number;
  follower_count: number;
  cover_image_url: string;
  pinterest_url: string;
  created_at?: string;
}

/**
 * Result shape for list_boards tool
 */
export interface ListBoardsResult {
  boards: NormalizedBoard[];
  total: number;
  has_more: boolean;
  bookmark?: string | null;
}

/**
 * Result shape for list_board_pins tool
 */
export interface ListBoardPinsResult {
  board_id: string;
  pins: NormalizedPin[];
  total: number;
  has_more: boolean;
  bookmark?: string | null;
}

/**
 * Normalized User Profile shape returned by get_user_account tool.
 */
export interface NormalizedUserProfile {
  username: string;
  about: string;
  profile_image: string;
  website_url: string;
  account_type: string;
  business_name: string;
  board_count: number;
  pin_count: number;
  follower_count: number;
  following_count: number;
  monthly_views: number;
  pinterest_url: string;
}

/**
 * Normalized Board summary shape for get_boards / create_board MCP tools.
 * Conforms strictly to Phase 2 specification.
 */
export interface BoardSummary {
  id: string;
  name: string;
  description: string;
  url: string;
  privacy?: string;
  pin_count?: number;
  follower_count?: number;
  cover_image_url?: string;
}

/**
 * Result shape for get_boards MCP tool.
 */
export interface GetBoardsResult {
  boards: BoardSummary[];
  total?: number;
  has_more?: boolean;
  bookmark?: string | null;
}

/**
 * Result shape for create_board MCP tool.
 */
export interface CreateBoardResult {
  success: boolean;
  board: BoardSummary;
}

/**
 * Normalized saved Pin shape returned by save_pin MCP tool.
 */
export interface SavedPin {
  id: string;
  board_id: string;
  title: string;
  description: string;
  url: string;
  image_url?: string;
}

/**
 * Result shape for save_pin MCP tool.
 */
export interface SavePinResult {
  success: boolean;
  message: string;
  pin: SavedPin;
}

/**
 * Generic operation status response (for delete operations)
 */
export interface OperationResult {
  success: boolean;
  message: string;
  id: string;
}
