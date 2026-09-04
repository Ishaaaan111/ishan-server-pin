/**
 * Pinterest Prompt Templates
 *
 * Ready-made, highly effective MCP Prompts for Pinterest workflows.
 * Used by LLM clients to guide creative discovery, board curation,
 * Pin SEO copywriting, and visual moodboard planning.
 */

import { PromptDecorator as Prompt, ExecutionContext, Injectable } from '@nitrostack/core';
import { PinterestService } from '../../services/pinterest/pinterest.service.js';

@Injectable({ deps: [PinterestService] })
export class PinterestPrompts {
  constructor(private readonly pinterestService: PinterestService) {}

  // ---------------------------------------------------------------------------
  // 1. Search Dogs & Cute Pets
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'search_dog_and_pets',
    description: 'Find adorable dog breeds, playful puppies, pet accessories, and cozy pet aesthetics on Pinterest.',
    arguments: [
      {
        name: 'breedOrTopic',
        description: 'Specific dog breed or topic (e.g. "Golden Retriever puppy", "Corgi", "Samoyed", "dog room")',
        required: false,
      },
    ],
  })
  async searchDogAndPets(input: { breedOrTopic?: string }, ctx: ExecutionContext) {
    const query = input?.breedOrTopic || 'dog puppy';
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a passionate canine and pet aesthetic curator.\n` +
            `1. Use the "pinterest_app" or "search_pins" tool with query: "${query}" to discover delightful Pins.\n` +
            `2. Present the pins with engaging descriptions, highlighting the breed's personality traits and visual style.\n` +
            `3. Suggest 3 fun ideas for pet owners (e.g. photo setups, DIY dog enrichment toys, or cute accessories).`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Interior Design & Room Makeover Planner
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'interior_design_planner',
    description: 'Plan a cohesive room makeover with color palettes, furniture textures, and lighting ideas.',
    arguments: [
      {
        name: 'roomStyle',
        description: 'Room and design style (e.g. "Minimalist Scandinavian living room", "Japandi bedroom", "Boho kitchen")',
        required: true,
      },
    ],
  })
  async interiorDesignPlanner(input: { roomStyle: string }, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are an interior design architect and moodboard specialist.\n` +
            `Target room style: "${input.roomStyle}".\n\n` +
            `1. Search Pinterest for "${input.roomStyle}" using the "pinterest_app" tool.\n` +
            `2. Break down the design into 4 key elements: Color Palette, Materials & Textures, Lighting, and Accent Decor.\n` +
            `3. Provide actionable suggestions on how to recreate this aesthetic on a practical budget.\n` +
            `4. Offer to create a new dedicated board with "create_board".`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Pinterest Board Theme Architect
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'generate_board_ideas',
    description: 'Generate 5 cohesive, high-aesthetic Pinterest board concepts with titles, descriptions, and cover styles.',
    arguments: [
      {
        name: 'nicheOrHobby',
        description: 'Your niche, brand, or hobby (e.g. "Coffee & Cafe Culture", "Slow Living", "Digital Marketing", "Ceramics")',
        required: true,
      },
    ],
  })
  async generateBoardIdeas(input: { nicheOrHobby: string }, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a Pinterest branding expert.\n` +
            `Generate 5 distinct, aesthetically cohesive Pinterest board ideas for the niche: "${input.nicheOrHobby}".\n\n` +
            `For each board, provide:\n` +
            `- **Board Name**: Catchy, SEO-friendly title under 40 characters.\n` +
            `- **Description**: Engaging 2-sentence description rich in search keywords.\n` +
            `- **Visual Theme / Color Vibe**: Suggested colors, imagery style, and cover photo inspiration.\n` +
            `- **Sample Search Terms**: 3 exact search terms to find matching pins.\n\n` +
            `Offer to automatically create any of these boards using the "create_board" tool.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Capsule Wardrobe & Fashion Stylist
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'capsule_wardrobe_stylist',
    description: 'Curate a seasonal capsule wardrobe, streetwear looks, or vintage fashion aesthetic.',
    arguments: [
      {
        name: 'seasonOrVibe',
        description: 'Season or aesthetic vibe (e.g. "Autumn Old Money", "Summer Linen Coastal", "90s Streetwear")',
        required: true,
      },
    ],
  })
  async capsuleWardrobeStylist(input: { seasonOrVibe: string }, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a personal fashion stylist and visual trend forecaster.\n` +
            `Aesthetic: "${input.seasonOrVibe}".\n\n` +
            `1. Search Pinterest for "${input.seasonOrVibe} outfits" using "search_pins".\n` +
            `2. Recommend a core 10-piece capsule wardrobe (Tops, Bottoms, Outerwear, Footwear, Accessories).\n` +
            `3. Suggest 3 versatile outfit combinations (Casual Day, Work / Coffee, Evening Out).\n` +
            `4. Highlight key color tones and fabric textures.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Pin SEO Copywriter & Title Generator
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'pin_seo_copywriter',
    description: 'Write viral, high-ranking Pinterest Pin titles, rich keyword descriptions, and searchable tags.',
    arguments: [
      {
        name: 'pinTopic',
        description: 'The product, blog post, recipe, or design you want to publish',
        required: true,
      },
    ],
  })
  async pinSeoCopywriter(input: { pinTopic: string }, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a top Pinterest SEO copywriter and growth marketer.\n` +
            `Create an optimized Pin publishing kit for: "${input.pinTopic}".\n\n` +
            `Provide:\n` +
            `1. **3 High-CTR Pin Titles** (under 60 characters, emotive and clear).\n` +
            `2. **2 Rich Pin Descriptions** (100–150 words each, packed with organic high-volume Pinterest keywords and a clear Call-To-Action).\n` +
            `3. **10 Search Tags / Hashtags** for search indexing.\n` +
            `4. **Recommended Board Category** to save this Pin into.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 6. DIY & Home Craft Inspiration Finder
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'diy_craft_ideas',
    description: 'Find beginner-friendly DIY home decor, woodworking, pottery, or upcycling project ideas.',
    arguments: [
      {
        name: 'craftCategory',
        description: 'Craft type or material (e.g. "clay pottery", "woodworking", "ikea flip", "candle making")',
        required: false,
      },
    ],
  })
  async diyCraftIdeas(input: { craftCategory?: string }, ctx: ExecutionContext) {
    const category = input?.craftCategory || 'DIY home decor craft';
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a creative DIY and maker specialist.\n` +
            `1. Search Pinterest for "${category}" using "search_pins".\n` +
            `2. Select 3 great project ideas ranging from beginner (under 30 mins) to weekend hobbyist.\n` +
            `3. For each project, list: Required Materials, Estimated Time, Step-by-Step Overview, and Pro Tips.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 7. Travel Destination & Itinerary Moodboard
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'travel_wanderlust_planner',
    description: 'Create a visual travel itinerary with photo spots, hidden cafes, and packing aesthetic.',
    arguments: [
      {
        name: 'destination',
        description: 'City or country (e.g. "Kyoto Japan", "Amalfi Coast", "Swiss Alps", "Reykjavik Iceland")',
        required: true,
      },
    ],
  })
  async travelWanderlustPlanner(input: { destination: string }, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a travel photographer and destination curator.\n` +
            `Destination: "${input.destination}".\n\n` +
            `1. Search Pinterest for "${input.destination} travel photography aesthetics" using "search_pins".\n` +
            `2. Create a 3-Day Visual Itinerary focusing on iconic viewpoints, historic spots, and local culinary gems.\n` +
            `3. List the top 5 most photogenic locations with ideal times of day for photography.\n` +
            `4. Suggest an aesthetic packing list matching the destination's climate and culture.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 8. Culinary, Cafe & Baking Inspo
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'culinary_cafe_recipes',
    description: 'Discover aesthetic cafe drinks, artisan baking recipes, and food styling presentation tips.',
    arguments: [
      {
        name: 'foodType',
        description: 'Dish, drink, or cuisine (e.g. "matcha latte art", "sourdough baking", "pasta fresca", "acai bowl")',
        required: false,
      },
    ],
  })
  async culinaryCafeRecipes(input: { foodType?: string }, ctx: ExecutionContext) {
    const food = input?.foodType || 'artisan cafe coffee and baking';
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a culinary stylist and cafe recipe creator.\n` +
            `1. Search Pinterest for "${food}" using "pinterest_app".\n` +
            `2. Share a delicious, easy-to-follow recipe with step-by-step instructions.\n` +
            `3. Give 3 professional food styling & photography tips (lighting, dishware selection, garnishes) to make the meal look restaurant-quality.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 9. Digital Art, Graphic Design & Wallpapers
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'digital_art_and_wallpaper',
    description: 'Explore ethereal abstract gradients, 3D digital art, retro poster typography, and wallpapers.',
    arguments: [
      {
        name: 'artStyle',
        description: 'Art style or format (e.g. "aura pastel gradient", "retro 70s typography poster", "cyberpunk 3D")',
        required: false,
      },
    ],
  })
  async digitalArtAndWallpaper(input: { artStyle?: string }, ctx: ExecutionContext) {
    const style = input?.artStyle || 'abstract gradient art aesthetic wallpaper';
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a digital artist and graphic design trend curator.\n` +
            `1. Search Pinterest for "${style}" using "search_pins".\n` +
            `2. Analyze the color harmonies, typography styles, and textures in the top pins.\n` +
            `3. Suggest creative prompt ideas to generate matching digital art or wallpapers.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 10. Pinterest Account Growth & Profile Audit
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'pinterest_growth_audit',
    description: 'Analyze your Pinterest account profile stats and get an actionable organic growth strategy.',
    arguments: [],
  })
  async pinterestGrowthAudit(input: Record<string, never>, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are a senior Pinterest growth consultant.\n` +
            `1. Fetch the user's account details using the "get_user_account" tool and boards using "get_boards".\n` +
            `2. Audit the profile username, bio, monthly views, follower ratio, and board organization.\n` +
            `3. Provide a 30-day tactical growth plan:\n` +
            `   - Optimal daily pinning frequency.\n` +
            `   - High-performing board recommendations.\n` +
            `   - Keyword optimization tips for board titles and pin descriptions.\n` +
            `   - Best practices for driving website clicks and engagement.`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 11. Wedding & Event Moodboard Designer
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'wedding_event_moodboard',
    description: 'Design a cohesive wedding, birthday, or dinner party theme with color palettes and table settings.',
    arguments: [
      {
        name: 'eventTheme',
        description: 'Event theme (e.g. "Tuscan vineyard wedding", "Boho garden baby shower", "Modern black tie dinner")',
        required: true,
      },
    ],
  })
  async weddingEventMoodboard(input: { eventTheme: string }, ctx: ExecutionContext) {
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are an event designer and luxury wedding planner.\n` +
            `Theme: "${input.eventTheme}".\n\n` +
            `1. Search Pinterest for "${input.eventTheme} tablescape and floral ideas" using "search_pins".\n` +
            `2. Formulate a complete design concept with:\n` +
            `   - 5-color hex palette.\n` +
            `   - Floral arrangements & greenery selections.\n` +
            `   - Table setting details (linens, dinnerware, place cards, candles).\n` +
            `   - Invitation typography & stationery styling ideas.\n` +
            `3. Offer to create dedicated boards like "Florals", "Tablescapes", and "Attire" via "create_board".`,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 12. Vintage Cars & Automotive Showcase
  // ---------------------------------------------------------------------------
  @Prompt({
    name: 'vintage_car_showcase',
    description: 'Explore classic vintage automobiles, supercars, and coastal driving aesthetic photography.',
    arguments: [
      {
        name: 'carStyle',
        description: 'Automotive style or era (e.g. "Vintage 1960s Porsche", "Classic Muscle Cars", "Japanese JDM classics")',
        required: false,
      },
    ],
  })
  async vintageCarShowcase(input: { carStyle?: string }, ctx: ExecutionContext) {
    const query = input?.carStyle || 'classic vintage cars coastal highway';
    return {
      messages: [
        {
          role: 'user',
          content:
            `You are an automotive historian and visual car culture enthusiast.\n` +
            `1. Search Pinterest for "${query}" using "search_pins".\n` +
            `2. Highlight 3 iconic vehicles with their historical significance, timeless design features, and photography settings.\n` +
            `3. Suggest scenic driving routes and photography compositions to capture vehicle aesthetics.`,
        },
      ],
    };
  }
}
