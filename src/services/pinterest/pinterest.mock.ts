/**
 * Pinterest Mock Data
 *
 * Provided by user: ishserverpins
 * Used when Pinterest OAuth is not authenticated.
 * All tools and widgets fall back to this data transparently.
 */

import type {
  NormalizedPin,
  NormalizedBoard,
  NormalizedUserProfile,
  BoardSummary,
} from './pinterest.types.js';

// ---------------------------------------------------------------------------
// Mock User Profile
// ---------------------------------------------------------------------------
export const MOCK_USER_PROFILE: NormalizedUserProfile = {
  username: 'ishserverpins',
  business_name: 'Ishan Server Pins',
  about: 'Curating minimalist workspaces, travel ideas, and delicious recipes.',
  account_type: 'PINNER',
  profile_image:
    'https://i.pinimg.com/75x75_RS/mock/avatar.jpg',
  website_url: 'https://example.com',
  board_count: 3,
  pin_count: 4,
  follower_count: 128,
  following_count: 54,
  monthly_views: 8400,
  pinterest_url: 'https://www.pinterest.com/ishserverpins',
};

// ---------------------------------------------------------------------------
// Mock Boards
// ---------------------------------------------------------------------------
export const MOCK_BOARDS: NormalizedBoard[] = [
  {
    id: '9887761234567891',
    name: 'Home Office Ideas',
    description: 'Mock board for inspiration around home office setups.',
    privacy: 'PUBLIC',
    pin_count: 5,
    follower_count: 42,
    cover_image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/ishserverpins/home-office-ideas/',
    created_at: '2026-02-11T09:15:00Z',
  },
  {
    id: '9887761234567892',
    name: 'Travel Bucket List',
    description: 'Mock board with places to visit.',
    privacy: 'PUBLIC',
    pin_count: 4,
    follower_count: 31,
    cover_image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/ishserverpins/travel-bucket-list/',
    created_at: '2026-03-02T14:40:00Z',
  },
  {
    id: '9887761234567893',
    name: 'Recipe Vault',
    description: 'Mock board of recipes to try.',
    privacy: 'SECRET',
    pin_count: 3,
    follower_count: 0,
    cover_image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/ishserverpins/recipe-vault/',
    created_at: '2026-04-19T18:05:00Z',
  },
];

export const MOCK_BOARD_SUMMARIES: BoardSummary[] = MOCK_BOARDS.map((b) => ({
  id: b.id,
  name: b.name,
  description: b.description,
  url: b.pinterest_url,
  privacy: b.privacy,
  pin_count: b.pin_count,
  follower_count: b.follower_count,
  cover_image_url: b.cover_image_url,
}));

// ---------------------------------------------------------------------------
// Mock Pins
// ---------------------------------------------------------------------------
export const MOCK_PINS: NormalizedPin[] = [
  {
    id: '112233445566778899',
    title: 'Minimalist Desk Setup',
    description: 'A clean, minimalist desk setup with warm lighting.',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/pin/112233445566778899',
    board_id: '9887761234567891',
    link: 'https://example.com/blog/minimalist-desk-setup',
    author: 'ishserverpins',
    likes: 214,
    tag: 'Workspace',
  },
  {
    id: '112233445566778900',
    title: 'Standing Desk Review',
    description: 'Full review of an adjustable standing desk.',
    image_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/pin/112233445566778900',
    board_id: '9887761234567891',
    link: 'https://example.com/blog/standing-desk-review',
    author: 'ishserverpins',
    likes: 189,
    tag: 'Workspace',
  },
  {
    id: '112233445566778901',
    title: 'Kyoto Travel Guide',
    description: 'Top spots to visit in Kyoto, Japan.',
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/pin/112233445566778901',
    board_id: '9887761234567892',
    link: 'https://example.com/blog/kyoto-travel-guide',
    author: 'ishserverpins',
    likes: 473,
    tag: 'Travel',
  },
  {
    id: '112233445566778902',
    title: 'One-Pot Pasta Recipe',
    description: 'Quick weeknight one-pot pasta recipe.',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&auto=format&fit=crop',
    pinterest_url: 'https://www.pinterest.com/pin/112233445566778902',
    board_id: '9887761234567893',
    link: 'https://example.com/blog/one-pot-pasta',
    author: 'ishserverpins',
    likes: 331,
    tag: 'Food',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return pins that belong to a specific board */
export function getMockPinsForBoard(boardId: string): NormalizedPin[] {
  return MOCK_PINS.filter((p) => p.board_id === boardId);
}

/** Search mock pins by keyword (title, description, tag) */
export function searchMockPins(query: string, limit = 20): NormalizedPin[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_PINS.slice(0, limit);

  return MOCK_PINS.filter((pin) => {
    return (
      pin.title.toLowerCase().includes(q) ||
      pin.description.toLowerCase().includes(q) ||
      (pin.tag ?? '').toLowerCase().includes(q) ||
      (pin.board_id ?? '') === q
    );
  }).slice(0, limit);
}

/** Find a single mock pin by ID */
export function getMockPin(pinId: string): NormalizedPin | undefined {
  return MOCK_PINS.find((p) => p.id === pinId);
}

/** Find a single mock board by ID */
export function getMockBoard(boardId: string): NormalizedBoard | undefined {
  return MOCK_BOARDS.find((b) => b.id === boardId);
}
