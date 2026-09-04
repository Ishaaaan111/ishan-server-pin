# Pinterest MCP Server & Interactive Widgets

A production-grade [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Pinterest built with [NitroStack](https://nitrostack.ai) and [Next.js](https://nextjs.org). Features official Pinterest API v5 integration, an automated OAuth 2.0 Authorization Code flow, multi-tier token resolution, and rich interactive frontend widgets for AI clients and NitroStudio.

---

## 🌟 Key Features

- **Official Pinterest API v5**: Pure official endpoints with schema validation via Zod and full TypeScript typing.
- **Interactive React UI Widgets (`@nitrostack/widgets`)**:
  - Live search bar with instant keyword filtering (e.g. searching *"dog"* renders adorable dogs in real-time).
  - Quick category discovery pills (🐶 Dogs, 🐱 Cats, 🛋️ Interior, 🌿 Nature, ☕ Coffee, 🚗 Cars, 🎨 Art).
  - Built-in Pinterest **Log In** (OAuth) & **Sign Up** options.
  - Responsive masonry grid layout with high-resolution image previews, like toggles, and pin saving.
  - Follow-up chat action prompts ("✨ Ask AI for Ideas").
- **Robust OAuth 2.0 Architecture**:
  - Built-in local HTTP callback listener on `http://localhost:3005/oauth/callback` with auto code-exchange.
  - Multi-tier token resolution: In-memory → Persisted local token store (`.pinterest-tokens.json`) → Environment variable (`PINTEREST_ACCESS_TOKEN`).
  - Seamless fallback to Discovery Mode when unauthenticated.
- **Automated Test Suite**: Complete unit and integration tests covering OAuth flows, token exchange, and tool behavior.

---

## 🛠️ MCP Tools Catalog

| Tool Name | Scope Required | Description | Widget Route |
| :--- | :--- | :--- | :--- |
| `pinterest_app` | *None (Hybrid)* | Opens the full interactive Pinterest application widget with live search, categories, and auth options. | `/pin-search-results` |
| `search_pins` | `pins:read` | Searches pins by topic or keyword (e.g. `"dog"`, `"scandinavian living room"`) with visual results. | `/pin-search-results` |
| `get_boards` | `boards:read` | Returns the authenticated user's Pinterest boards. | `/board-list` |
| `create_board` | `boards:write` | Creates a new Pinterest board with custom name, description, and privacy settings. | `/board-details` |
| `save_pin` | `pins:write` | Saves an existing Pin to a user's board or board section. | `/pin-details` |
| `get_pin` | `pins:read` | Retrieves full details, dimensions, and image URLs for a specific Pinterest Pin. | `/pin-details` |
| `list_board_pins` | `pins:read` | Lists all pins saved inside a specific board. | `/pin-search-results` |
| `get_user_account` | `user_accounts:read` | Retrieves the authenticated user's profile, follower metrics, and website. | `/user-profile` |
| `pinterest_auth_status` | *None* | Checks current OAuth status and generates a fresh authorization URL. | — |

---

## 💡 Ready-Made MCP Prompts

The server includes 12 easy-to-use, specialized MCP prompts that guide creative workflows and Pinterest discovery:

| Prompt Name | Arguments | Description |
| :--- | :--- | :--- |
| `search_dog_and_pets` | `breedOrTopic` (optional) | Find adorable dog breeds, cute puppies, pet setups, and pet aesthetics. |
| `interior_design_planner` | `roomStyle` (required) | Plan room makeovers with palettes, textures, furniture, and lighting ideas. |
| `generate_board_ideas` | `nicheOrHobby` (required) | Generate 5 cohesive board concepts with titles, descriptions, and cover styles. |
| `capsule_wardrobe_stylist` | `seasonOrVibe` (required) | Curate seasonal capsule wardrobes, streetwear looks, or vintage fashion aesthetics. |
| `pin_seo_copywriter` | `pinTopic` (required) | Write viral, high-ranking Pin titles, rich descriptions, and search tags. |
| `diy_craft_ideas` | `craftCategory` (optional) | Discover beginner-friendly DIY home decor, woodworking, and pottery crafts. |
| `travel_wanderlust_planner` | `destination` (required) | Create visual 3-day travel itineraries with photo spots and aesthetic packing lists. |
| `culinary_cafe_recipes` | `foodType` (optional) | Discover aesthetic cafe drinks, artisan baking recipes, and food photography tips. |
| `digital_art_and_wallpaper` | `artStyle` (optional) | Explore ethereal abstract gradients, 3D digital art, and phone wallpapers. |
| `pinterest_growth_audit` | *None* | Audit account metrics and generate a 30-day tactical organic growth strategy. |
| `wedding_event_moodboard` | `eventTheme` (required) | Design cohesive wedding/event themes with color palettes, florals, and tablescapes. |
| `vintage_car_showcase` | `carStyle` (optional) | Explore classic vintage automobiles, supercars, and coastal driving aesthetics. |

---

## 🎨 Interactive Frontend Widgets (`src/widgets`)

| Route | Widget Name | Description |
| :--- | :--- | :--- |
| `/pin-search-results` | **Pinterest Explorer & Search** | Multi-column masonry grid, real-time search, category discovery, like buttons, and OAuth login. |
| `/pinterest-app` | **Pinterest Full App** | Alias route to the full Pinterest explorer interface. |
| `/board-list` | **Boards Gallery** | Visual cards for all user boards with cover photos, pin counts, and privacy tags. |
| `/pin-details` | **Pin Inspector** | High-res pin view with 1-click link copying and AI follow-up suggestions. |
| `/user-profile` | **Creator Dashboard** | Profile banner, follower stats, monthly views, and account settings. |

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env` in the root directory:

```env
# Server Port
PORT=3000

# Pinterest OAuth 2.0 Credentials (From developers.pinterest.com/apps)
PINTEREST_CLIENT_ID=your_pinterest_app_id
PINTEREST_CLIENT_SECRET=your_pinterest_app_secret
PINTEREST_REDIRECT_URI=http://localhost:3005/oauth/callback

# (Optional Direct Token Fallback)
# PINTEREST_ACCESS_TOKEN=pina_...
```

---

## 🔐 Pinterest Developer Portal Setup

1. Log in to [developers.pinterest.com/apps](https://developers.pinterest.com/apps/) and create an App.
2. Under **Redirect URIs**, add:
   ```
   http://localhost:3005/oauth/callback
   ```
3. Copy your **App ID** (`PINTEREST_CLIENT_ID`) and **App Secret** (`PINTEREST_CLIENT_SECRET`) into `.env`.
4. Required OAuth Scopes:
   - `user_accounts:read`
   - `boards:read`
   - `boards:write`
   - `pins:read`
   - `pins:write`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
- **MCP Server**: `http://localhost:3000`
- **Next.js Widgets**: `http://localhost:3001`
- **OAuth Callback Listener**: `http://localhost:3005`

### 3. Connect via OAuth
Open `http://localhost:3005/auth` in your browser to authorize your account. Once approved, tokens will automatically be stored in `.pinterest-tokens.json` (git-ignored).

---

## 🧪 Running Tests

Run the full automated test suite:

```bash
npm test
```

Type-checking:
```bash
npx tsc --noEmit
```

---

## 📁 Project Architecture

```
ishan-server-pin/
├── src/
│   ├── modules/
│   │   └── pinterest/
│   │       ├── pinterest.module.ts     # NitroStack module registration
│   │       └── pinterest.tools.ts      # MCP tool definitions & @Widget mappings
│   ├── services/
│   │   └── pinterest/
│   │       ├── pinterest.service.ts    # Pinterest API service & discovery feed
│   │       ├── pinterest.auth.service.ts # OAuth 2.0 listener & token store
│   │       ├── pinterest.client.ts     # Dynamic Axios HTTP client
│   │       └── pinterest.types.ts      # Zod & TypeScript interfaces
│   ├── widgets/                        # Next.js 14 React Widgets
│   │   ├── app/
│   │   │   ├── pin-search-results/     # Pinterest Explorer UI
│   │   │   ├── pinterest-app/          # Full App Widget
│   │   │   ├── board-list/             # Boards grid UI
│   │   │   ├── pin-details/            # Pin view UI
│   │   │   └── user-profile/           # Creator Profile UI
│   │   ├── next.config.mjs             # Next.js configuration
│   │   └── widget-manifest.json        # MCP Widget Manifest
│   ├── app.module.ts                   # Root application module
│   └── index.ts                        # Application bootstrap
├── tests/
│   ├── pinterest-phase2.test.ts        # Automated test suite
│   └── run-phase2-tests.js             # Test runner
├── .env.example                        # Template environment variables
├── package.json                        # Root package definition
└── tsconfig.json                       # TypeScript compiler settings
```

---

## 📄 License

MIT © Ishan Trivedi
