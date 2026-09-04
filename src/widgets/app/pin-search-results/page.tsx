'use client';

import React, { useState, useEffect } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface NormalizedPin {
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

interface PinterestAppData {
  query?: string;
  authenticated?: boolean;
  auth_url?: string | null;
  total?: number;
  pins?: NormalizedPin[];
  results?: NormalizedPin[];
  categories?: string[];
  message?: string;
}

// Curated balanced default pins across all major Pinterest categories
const FALLBACK_PINS: NormalizedPin[] = [
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
  // 👗 Fashion & Style
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
  // 🐶 Dogs
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
// ─── User's mock pins (from ishserverpins) ───
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
  // ─── Curated discovery pins ───
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

const CATEGORIES = [
  { label: '📌 My Pins', query: 'ishserverpins' },
  { label: '🛋️ Interior', query: 'interior' },
  { label: '🌿 Nature & Travel', query: 'nature' },
  { label: '🎨 Art & Design', query: 'art' },
  { label: '☕ Coffee & Food', query: 'food' },
  { label: '👗 Fashion', query: 'fashion' },
  { label: '💻 Workspace', query: 'workspace' },
  { label: '🚗 Cars', query: 'car' },
  { label: '🐶 Dogs', query: 'dog' },
  { label: '🐱 Cats', query: 'cat' },
];

function PinCard({
  pin,
  isDark,
  onSave,
  onOpenExternal,
  onAskAI,
}: {
  pin: NormalizedPin;
  isDark: boolean;
  onSave: (pin: NormalizedPin) => void;
  onOpenExternal: (url: string) => void;
  onAskAI: (pin: NormalizedPin) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [likesCount, setLikesCount] = useState(pin.likes || 120);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(true);
    onSave(pin);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isDark ? '#18181B' : '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isHovered
          ? isDark
            ? '0 16px 32px rgba(0, 0, 0, 0.6)'
            : '0 16px 32px rgba(0, 0, 0, 0.12)'
          : isDark
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px',
        breakInside: 'avoid',
      }}
    >
      {/* Image Container with Hover Controls */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '200px',
          background: isDark ? '#27272A' : '#F3F4F6',
          overflow: 'hidden',
        }}
      >
        {!imgLoaded && !imgError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#71717A' : '#9CA3AF',
              fontSize: '12px',
            }}
          >
            Loading photo...
          </div>
        )}

        <img
          src={pin.image_url}
          alt={pin.title || 'Pinterest Pin'}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '420px',
            objectFit: 'cover',
            display: 'block',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease, transform 0.4s ease',
            transform: isHovered ? 'scale(1.03)' : 'scale(1)',
          }}
          loading="lazy"
        />

        {/* Hover Action Overlay */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '12px',
              zIndex: 3,
            }}
          >
            {/* Top Row: Save Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {pin.tag && (
                <span
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(6px)',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {pin.tag}
                </span>
              )}

              <button
                onClick={handleSaveClick}
                style={{
                  background: isSaved ? '#10B981' : '#E60023',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'background 0.2s ease',
                }}
              >
                {isSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>

            {/* Bottom Row: Visit & Like */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExternal(pin.pinterest_url || `https://www.pinterest.com/pin/${pin.id}`);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ↗ Visit
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleLike}
                  style={{
                    background: hasLiked ? '#E60023' : 'rgba(255, 255, 255, 0.9)',
                    color: hasLiked ? '#FFFFFF' : '#111827',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                  title="Like this Pin"
                >
                  {hasLiked ? '❤️' : '🤍'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAI(pin);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  title="Ask AI about this Pin"
                >
                  ✨
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pin Card Content */}
      <div style={{ padding: '14px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            margin: '0 0 6px 0',
            lineHeight: '1.3',
            color: isDark ? '#F4F4F5' : '#111827',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={pin.title}
        >
          {pin.title || 'Untitled Pin'}
        </h3>

        {pin.description && (
          <p
            style={{
              fontSize: '12px',
              color: isDark ? '#A1A1AA' : '#6B7280',
              lineHeight: '1.4',
              margin: '0 0 10px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {pin.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: isDark ? '#71717A' : '#9CA3AF',
            borderTop: `1px solid ${isDark ? '#27272A' : '#F3F4F6'}`,
            paddingTop: '8px',
          }}
        >
          <span style={{ fontWeight: 600, color: isDark ? '#D4D4D8' : '#4B5563' }}>
            👤 {pin.author || 'Pinterest Creator'}
          </span>
          <span>❤️ {likesCount}</span>
        </div>
      </div>
    </div>
  );
}

export default function PinterestAppWidget() {
  const { isReady, getToolOutput, callTool, openExternal, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const rawOutput = getToolOutput<any>();
  const initialData: PinterestAppData | undefined =
    rawOutput?.data || rawOutput?.result || rawOutput || {};

  const [searchQuery, setSearchQuery] = useState(initialData?.query || '');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [pinsList, setPinsList] = useState<NormalizedPin[]>(
    initialData?.pins || initialData?.results || FALLBACK_PINS
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const isAuthenticated = Boolean(initialData?.authenticated);
  const authUrl = initialData?.auth_url || 'http://localhost:3005/auth';

  // Synchronize when tool output updates
  useEffect(() => {
    if (initialData?.pins && initialData.pins.length > 0) {
      setPinsList(initialData.pins);
    } else if (initialData?.results && initialData.results.length > 0) {
      setPinsList(initialData.results);
    }
  }, [rawOutput]);

  // Client-side search & filtering handler
  const handlePerformSearch = async (queryText: string) => {
    const q = (queryText || '').trim().toLowerCase();
    setSearchQuery(queryText);
    setIsSearching(true);

    if (q && q !== 'popular' && q !== 'all' && q !== 'explore') {
      const filtered = FALLBACK_PINS.filter((pin) => {
        const titleMatch = pin.title.toLowerCase().includes(q);
        const descMatch = pin.description.toLowerCase().includes(q);
        const tagMatch = pin.tag?.toLowerCase().includes(q);
        const authorMatch = pin.author?.toLowerCase().includes(q);

        const myPinsSynonym =
          (q.includes('ishserverpins') || q === 'my pins' || q === 'my') &&
          pin.author === 'ishserverpins';

        const dogSynonym =
          (q.includes('dog') || q.includes('puppy') || q.includes('corgi') || q.includes('canine')) &&
          pin.tag === 'Dogs';

        const catSynonym = (q.includes('cat') || q.includes('kitten')) && pin.tag === 'Cats';

        const interiorSynonym =
          (q.includes('interior') ||
            q.includes('room') ||
            q.includes('home') ||
            q.includes('living') ||
            q.includes('bedroom') ||
            q.includes('kitchen') ||
            q.includes('decor')) &&
          pin.tag === 'Interior';

        const natureSynonym =
          (q.includes('nature') ||
            q.includes('travel') ||
            q.includes('kyoto') ||
            q.includes('mountain') ||
            q.includes('lake') ||
            q.includes('sunset') ||
            q.includes('landscape')) &&
          (pin.tag === 'Nature' || pin.tag === 'Travel');

        const foodSynonym =
          (q.includes('food') ||
            q.includes('coffee') ||
            q.includes('cafe') ||
            q.includes('pizza') ||
            q.includes('pasta') ||
            q.includes('latte') ||
            q.includes('recipe')) &&
          pin.tag === 'Food';

        const fashionSynonym =
          (q.includes('fashion') ||
            q.includes('outfit') ||
            q.includes('style') ||
            q.includes('clothes') ||
            q.includes('wardrobe')) &&
          pin.tag === 'Fashion';

        const carSynonym =
          (q.includes('car') || q.includes('porsche') || q.includes('auto') || q.includes('vehicle')) &&
          pin.tag === 'Cars';

        const artSynonym =
          (q.includes('art') || q.includes('gradient') || q.includes('wallpaper') || q.includes('design')) &&
          pin.tag === 'Art';

        const workspaceSynonym =
          (q.includes('workspace') || q.includes('desk') || q.includes('setup') || q.includes('standing') || q.includes('tech')) &&
          pin.tag === 'Workspace';

        return (
          titleMatch ||
          descMatch ||
          tagMatch ||
          authorMatch ||
          myPinsSynonym ||
          dogSynonym ||
          catSynonym ||
          interiorSynonym ||
          natureSynonym ||
          foodSynonym ||
          fashionSynonym ||
          carSynonym ||
          artSynonym ||
          workspaceSynonym
        );
      });

      if (filtered.length > 0) {
        setPinsList(filtered);
      } else {
        // Dynamic fallback pin for any arbitrary topic
        const titleCase = queryText.charAt(0).toUpperCase() + queryText.slice(1);
        setPinsList([
          {
            id: `dyn_search_1`,
            title: `${titleCase} Aesthetic & Creative Inspiration`,
            description: `Curated high-resolution visual collection focusing on beautiful ${queryText} aesthetics, textures, and creative ideas.`,
            image_url: `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop`,
            pinterest_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(queryText)}`,
            author: 'Visual Curation Co',
            likes: 1420,
            tag: titleCase,
          },
          {
            id: `dyn_search_2`,
            title: `Modern ${titleCase} Concepts & Palette`,
            description: `Inspiring composition, lighting ideas, and trending concepts for ${queryText}.`,
            image_url: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop`,
            pinterest_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(queryText)}`,
            author: 'Design Archives',
            likes: 2890,
            tag: titleCase,
          },
        ]);
      }
    } else {
      setPinsList(FALLBACK_PINS);
    }

    // Call backend MCP tool for rich live sync
    try {
      const response = await callTool('search_pins', { query: queryText || 'popular' });
      const newPins = response?.results || response?.pins;
      if (newPins && Array.isArray(newPins) && newPins.length > 0) {
        setPinsList(newPins);
      }
    } catch {
      // Gracefully maintain client filtered results
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryClick = (cat: { label: string; query: string }) => {
    setActiveCategory(cat.query);
    handlePerformSearch(cat.query);
  };

  const handlePinSave = async (pin: NormalizedPin) => {
    setSaveToast(`Saved "${pin.title.slice(0, 24)}..." to your board!`);
    setTimeout(() => setSaveToast(null), 3000);

    try {
      await callTool('save_pin', {
        pin_id: pin.id,
        board_id: pin.board_id || '90011223344',
      });
    } catch {
      // Handled gracefully
    }
  };

  const handleAskAI = (pin: NormalizedPin) => {
    sendFollowUpMessage(`Tell me more about this Pinterest idea: "${pin.title}". What aesthetics, design cues, or themes does it represent?`);
  };

  const handleOpenLogin = () => {
    openExternal(authUrl);
  };

  const handleOpenSignUp = () => {
    openExternal('https://www.pinterest.com/signup/');
  };

  if (!isReady) {
    return (
      <div
        style={{
          padding: '40px',
          background: isDark ? '#09090B' : '#FFFFFF',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '280px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `3px solid ${isDark ? '#27272A' : '#E4E4E7'}`,
            borderTopColor: '#E60023',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: isDark ? '#A1A1AA' : '#71717A', fontSize: '13px', margin: 0 }}>
          Connecting to Pinterest...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        background: isDark ? '#09090B' : '#F9FAFB',
        color: isDark ? '#F4F4F5' : '#111827',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '20px',
        position: 'relative',
      }}
    >
      {/* Toast Notification */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          📌 {saveToast}
        </div>
      )}

      {/* Top Pinterest Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '130px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#E60023',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '20px',
              boxShadow: '0 4px 10px rgba(230, 0, 35, 0.35)',
            }}
          >
            P
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
              Pinterest
            </h1>
            <span style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280' }}>
              {isAuthenticated ? '🟢 Connected' : '⚪ Discovery Mode'}
            </span>
          </div>
        </div>

        {/* Live Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePerformSearch(searchQuery);
          }}
          style={{
            flex: '1 1 240px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '14px',
              fontSize: '15px',
              color: isDark ? '#71717A' : '#9CA3AF',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search pins (e.g. "interior", "travel", "coffee", "art", "fashion")...'
            style={{
              width: '100%',
              padding: '11px 40px 11px 38px',
              background: isDark ? '#18181B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
              borderRadius: '24px',
              color: isDark ? '#FAFAFA' : '#111827',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handlePerformSearch('');
              }}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: isDark ? '#71717A' : '#9CA3AF',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          )}
        </form>

        {/* Login & Sign Up Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isDark ? '#27272A' : '#F3F4F6',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>👤 Connected</span>
            </div>
          ) : (
            <>
              {/* Login Button */}
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  background: isDark ? '#27272A' : '#F3F4F6',
                  color: isDark ? '#FAFAFA' : '#111827',
                  border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Log In
              </button>

              {/* Sign Up Button */}
              <button
                onClick={handleOpenSignUp}
                style={{
                  background: '#E60023',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(230,0,35,0.3)',
                  transition: 'opacity 0.2s',
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* Category Pills Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => {
            setActiveCategory(null);
            handlePerformSearch('');
          }}
          style={{
            background: activeCategory === null ? (isDark ? '#FAFAFA' : '#111827') : isDark ? '#18181B' : '#FFFFFF',
            color: activeCategory === null ? (isDark ? '#111827' : '#FFFFFF') : isDark ? '#D4D4D8' : '#374151',
            border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
            borderRadius: '20px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ✨ All Ideas
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.query}
            onClick={() => handleCategoryClick(cat)}
            style={{
              background: activeCategory === cat.query ? '#E60023' : isDark ? '#18181B' : '#FFFFFF',
              color: activeCategory === cat.query ? '#FFFFFF' : isDark ? '#D4D4D8' : '#374151',
              border: `1px solid ${activeCategory === cat.query ? '#E60023' : isDark ? '#27272A' : '#E5E7EB'}`,
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Login / Connect Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{
              background: isDark ? '#18181B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#E60023',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '24px',
                margin: '0 auto 16px auto',
              }}
            >
              P
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
              Connect with Pinterest
            </h2>
            <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#6B7280', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Authorize the MCP server to search and save pins directly to your personal Pinterest boards.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleOpenLogin}
                style={{
                  background: '#E60023',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                🔐 Sign In with Pinterest OAuth
              </button>

              <button
                onClick={handleOpenSignUp}
                style={{
                  background: isDark ? '#27272A' : '#F3F4F6',
                  color: isDark ? '#FAFAFA' : '#111827',
                  border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
                  borderRadius: '24px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create a Free Pinterest Account
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#71717A' : '#9CA3AF',
                  fontSize: '12px',
                  cursor: 'pointer',
                  paddingTop: '8px',
                }}
              >
                Continue in Guest Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#D4D4D8' : '#374151' }}>
          {isSearching ? 'Searching...' : `Found ${pinsList.length} Pins ${searchQuery ? `for "${searchQuery}"` : ''}`}
        </span>

        <button
          onClick={() => sendFollowUpMessage(`Suggest 5 creative styling or DIY ideas inspired by these Pinterest ${searchQuery || 'aesthetic'} pins`)}
          style={{
            background: isDark ? '#27272A' : '#FFFFFF',
            color: isDark ? '#FAFAFA' : '#111827',
            border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✨ Ask AI for Ideas
        </button>
      </div>

      {/* Masonry Pin Grid */}
      {pinsList.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            background: isDark ? '#18181B' : '#FFFFFF',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📌</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>No Pins Found</h3>
          <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#6B7280', margin: 0 }}>
            Try searching for "interior", "travel", "coffee", "art", "fashion", "dogs", or click one of the category pills above.
          </p>
        </div>
      ) : (
        <div
          style={{
            columnCount: 3,
            columnGap: '16px',
          }}
        >
          {pinsList.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              isDark={isDark}
              onSave={handlePinSave}
              onOpenExternal={openExternal}
              onAskAI={handleAskAI}
            />
          ))}
        </div>
      )}
    </div>
  );
}
