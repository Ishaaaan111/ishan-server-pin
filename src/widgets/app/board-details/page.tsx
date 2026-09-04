'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface NormalizedBoard {
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

export default function BoardDetails() {
  const { isReady, getToolOutput, callTool, openExternal, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  const rawOutput = getToolOutput<any>();
  const board: NormalizedBoard | undefined =
    rawOutput?.board ||
    rawOutput?.result ||
    rawOutput?.data ||
    (rawOutput?.id ? rawOutput : undefined);

  if (!isReady) {
    return (
      <div
        style={{
          padding: '24px',
          background: isDark ? '#09090B' : '#FFFFFF',
          borderRadius: '16px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '240px',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: `3px solid ${isDark ? '#27272A' : '#E4E4E7'}`,
            borderTopColor: '#E60023',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          Loading Board details...
        </p>
      </div>
    );
  }

  if (!board || !board.id) {
    return (
      <div
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: isDark ? '#18181B' : '#FAFAFA',
          color: isDark ? '#F4F4F5' : '#18181B',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>
          Board Information Unavailable
        </h3>
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          No board data was received or the board could not be found.
        </p>
      </div>
    );
  }

  const hasCoverImage = Boolean(board.cover_image_url) && !imgError;

  const handleViewPins = async () => {
    setIsLoadingPins(true);
    try {
      await callTool('list_board_pins', { board_id: board.id });
    } catch (err) {
      console.error('Failed to load board pins:', err);
    } finally {
      setIsLoadingPins(false);
    }
  };

  return (
    <div
      style={{
        padding: '12px',
        background: isDark ? '#09090B' : '#F9FAFB',
        color: isDark ? '#F4F4F5' : '#18181B',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        borderRadius: '16px',
      }}
    >
      <div
        style={{
          background: isDark ? '#18181B' : '#FFFFFF',
          border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.5)'
            : '0 10px 30px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Cover Header Banner */}
        {hasCoverImage && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '180px',
              background: isDark ? '#27272A' : '#F3F4F6',
              overflow: 'hidden',
            }}
          >
            {!imgLoaded && (
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
                Loading cover...
              </div>
            )}
            <img
              src={board.cover_image_url}
              alt={board.name}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
              }}
            />
          </div>
        )}

        <div style={{ padding: '24px' }}>
          {/* Header Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background:
                    board.privacy === 'SECRET'
                      ? 'rgba(0, 0, 0, 0.7)'
                      : isDark
                      ? 'rgba(230, 0, 35, 0.18)'
                      : 'rgba(230, 0, 35, 0.1)',
                  color: board.privacy === 'SECRET' ? '#A1A1AA' : '#E60023',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {board.privacy === 'SECRET' ? '🔒 Secret Board' : '🌐 Public Board'}
              </span>

              <span style={{ fontSize: '12px', color: isDark ? '#A1A1AA' : '#6B7280' }}>
                ID: {board.id}
              </span>
            </div>

            <button
              onClick={() =>
                openExternal(board.pinterest_url || `https://www.pinterest.com/board/${board.id}`)
              }
              style={{
                background: '#E60023',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Open on Pinterest ↗
            </button>
          </div>

          {/* Board Title & Description */}
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 8px 0',
              color: isDark ? '#F4F4F5' : '#111827',
            }}
          >
            {board.name}
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: isDark ? '#D4D4D8' : '#4B5563',
              lineHeight: '1.6',
              margin: '0 0 20px 0',
            }}
          >
            {board.description || 'No description provided for this board.'}
          </p>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                background: isDark ? '#27272A' : '#F3F4F6',
                padding: '14px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280', marginBottom: '2px' }}>
                Total Pins
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{board.pin_count ?? 0}</div>
            </div>

            <div
              style={{
                background: isDark ? '#27272A' : '#F3F4F6',
                padding: '14px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280', marginBottom: '2px' }}>
                Followers
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{board.follower_count ?? 0}</div>
            </div>

            <div
              style={{
                background: isDark ? '#27272A' : '#F3F4F6',
                padding: '14px',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280', marginBottom: '2px' }}>
                Privacy
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{board.privacy || 'PUBLIC'}</div>
            </div>
          </div>

          {/* Action Controls */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleViewPins}
              disabled={isLoadingPins}
              style={{
                flex: '1 1 180px',
                background: isDark ? '#27272A' : '#F3F4F6',
                color: isDark ? '#FAFAFA' : '#18181B',
                border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLoadingPins ? 'Loading Pins...' : '📂 View All Pins in this Board'}
            </button>

            <button
              onClick={() =>
                sendFollowUpMessage(
                  `Suggest 5 new aesthetic pin ideas to add to my board "${board.name}"`
                )
              }
              style={{
                flex: '1 1 140px',
                background: '#E60023',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✨ Suggest Pins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
