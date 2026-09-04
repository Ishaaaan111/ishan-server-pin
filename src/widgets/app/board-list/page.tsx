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

interface ListBoardsData {
  boards?: NormalizedBoard[];
  total?: number;
  has_more?: boolean;
}

function BoardCard({
  board,
  isDark,
  onOpenPins,
  onOpenExternal,
  isLoading,
}: {
  board: NormalizedBoard;
  isDark: boolean;
  onOpenPins: (id: string) => void;
  onOpenExternal: (url: string) => void;
  isLoading: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = Boolean(board.cover_image_url) && !imgError;

  return (
    <div
      style={{
        background: isDark ? '#18181B' : '#FFFFFF',
        border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isDark
          ? '0 4px 14px rgba(0, 0, 0, 0.25)'
          : '0 4px 14px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Cover Photo */}
      <div
        style={{
          height: '140px',
          background: isDark ? '#27272A' : '#F3F4F6',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <>
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
                transition: 'opacity 0.25s ease',
                display: 'block',
              }}
            />
          </>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              background: isDark
                ? 'linear-gradient(135deg, #27272A 0%, #18181B 100%)'
                : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
            }}
          >
            🎨
          </div>
        )}

        {/* Privacy Badge */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background:
              board.privacy === 'SECRET' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(230, 0, 35, 0.85)',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          {board.privacy === 'SECRET' ? '🔒 Secret' : '🌐 Public'}
        </div>
      </div>

      {/* Body Content */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              margin: '0 0 6px 0',
              color: isDark ? '#F4F4F5' : '#111827',
            }}
          >
            {board.name}
          </h3>

          {board.description && (
            <p
              style={{
                fontSize: '12px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                lineHeight: '1.4',
                margin: '0 0 12px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {board.description}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '12px',
              color: isDark ? '#A1A1AA' : '#6B7280',
              marginBottom: '12px',
            }}
          >
            <span>📌 {board.pin_count ?? 0} Pins</span>
            <span>👥 {board.follower_count ?? 0} Followers</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            paddingTop: '10px',
            borderTop: `1px solid ${isDark ? '#27272A' : '#F3F4F6'}`,
          }}
        >
          <button
            onClick={() => onOpenPins(board.id)}
            disabled={isLoading}
            style={{
              flex: 1,
              background: isDark ? '#27272A' : '#F3F4F6',
              color: isDark ? '#FAFAFA' : '#18181B',
              border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isLoading ? 'Opening...' : 'Browse Pins →'}
          </button>

          <button
            onClick={() => onOpenExternal(board.pinterest_url || `https://www.pinterest.com/board/${board.id}`)}
            title="Open on Pinterest"
            style={{
              background: '#E60023',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ↗
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BoardList() {
  const { isReady, getToolOutput, callTool, openExternal, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const [loadingBoardId, setLoadingBoardId] = useState<string | null>(null);

  const rawOutput = getToolOutput<any>();
  const data: ListBoardsData | undefined =
    rawOutput?.data || rawOutput?.result || rawOutput || {};

  const boards: NormalizedBoard[] =
    data?.boards || (Array.isArray(rawOutput) ? rawOutput : []);
  const total = data?.total ?? boards.length;

  const handleOpenBoardPins = async (boardId: string) => {
    setLoadingBoardId(boardId);
    try {
      await callTool('list_board_pins', { board_id: boardId });
    } catch (err) {
      console.error('Failed to list board pins:', err);
    } finally {
      setLoadingBoardId(null);
    }
  };

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
          minHeight: '260px',
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
          Loading your Pinterest boards...
        </p>
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div
        style={{
          padding: '36px 20px',
          textAlign: 'center',
          background: isDark ? '#18181B' : '#FAFAFA',
          color: isDark ? '#F4F4F5' : '#18181B',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>No Boards Found</h3>
        <p style={{ fontSize: '14px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          You do not have any boards or no boards matched your criteria.
        </p>
      </div>
    );
  }

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
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#E60023',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            P
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: isDark ? '#F4F4F5' : '#111827' }}>
              Your Pinterest Boards
            </h2>
            <span style={{ fontSize: '12px', color: isDark ? '#A1A1AA' : '#6B7280' }}>
              {total} {total === 1 ? 'Board' : 'Boards'}
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            sendFollowUpMessage('Help me organize my Pinterest boards and suggest new board themes')
          }
          style={{
            background: isDark ? '#27272A' : '#FFFFFF',
            color: isDark ? '#FAFAFA' : '#18181B',
            border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ✨ Board Suggestions
        </button>
      </div>

      {/* Board Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            isDark={isDark}
            onOpenPins={handleOpenBoardPins}
            onOpenExternal={openExternal}
            isLoading={loadingBoardId === board.id}
          />
        ))}
      </div>
    </div>
  );
}
