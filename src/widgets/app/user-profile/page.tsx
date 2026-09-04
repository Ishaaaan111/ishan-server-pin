'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface NormalizedUserProfile {
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

export default function UserProfileWidget() {
  const { isReady, getToolOutput, callTool, openExternal, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);

  const rawOutput = getToolOutput<any>();
  const user: NormalizedUserProfile | undefined =
    rawOutput?.profile ||
    rawOutput?.user ||
    rawOutput?.result ||
    rawOutput?.data ||
    (rawOutput?.username ? rawOutput : undefined);

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
          Loading Pinterest Profile...
        </p>
      </div>
    );
  }

  if (!user || !user.username) {
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
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>👤</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>
          User Profile Not Available
        </h3>
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          No Pinterest user profile data was received.
        </p>
      </div>
    );
  }

  const hasAvatar = Boolean(user.profile_image) && !imgError;

  const handleBrowseBoards = async () => {
    setIsLoadingBoards(true);
    try {
      await callTool('list_boards', {});
    } catch (err) {
      console.error('Failed to list boards:', err);
    } finally {
      setIsLoadingBoards(false);
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
          padding: '24px',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.5)'
            : '0 10px 30px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Profile Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          {hasAvatar ? (
            <div
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #E60023',
                background: isDark ? '#27272A' : '#F3F4F6',
              }}
            >
              <img
                src={user.profile_image}
                alt={user.username}
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
            </div>
          ) : (
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E60023 0%, #B8001C 100%)',
                color: 'white',
                fontSize: '28px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(230, 0, 35, 0.3)',
              }}
            >
              {user.username.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div style={{ flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: 0,
                  color: isDark ? '#F4F4F5' : '#111827',
                }}
              >
                {user.business_name || user.username}
              </h2>
              <span
                style={{
                  background: isDark ? 'rgba(230, 0, 35, 0.18)' : 'rgba(230, 0, 35, 0.1)',
                  color: '#E60023',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {user.account_type || 'PINNER'}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#6B7280', margin: '4px 0 0 0' }}>
              @{user.username}
            </p>

            {user.website_url && (
              <a
                href={user.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: isDark ? '#60A5FA' : '#2563EB',
                  textDecoration: 'none',
                  display: 'inline-block',
                  marginTop: '4px',
                }}
              >
                🔗 {user.website_url.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          <button
            onClick={() =>
              openExternal(user.pinterest_url || `https://www.pinterest.com/${user.username}`)
            }
            style={{
              background: '#E60023',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Pinterest ↗
          </button>
        </div>

        {/* Bio */}
        {user.about && (
          <p
            style={{
              fontSize: '14px',
              color: isDark ? '#D4D4D8' : '#4B5563',
              lineHeight: '1.5',
              margin: '0 0 20px 0',
            }}
          >
            {user.about}
          </p>
        )}

        {/* Account Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              background: isDark ? '#27272A' : '#F3F4F6',
              padding: '12px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.pin_count ?? 0}</div>
            <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280' }}>Pins</div>
          </div>

          <div
            style={{
              background: isDark ? '#27272A' : '#F3F4F6',
              padding: '12px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.board_count ?? 0}</div>
            <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280' }}>Boards</div>
          </div>

          <div
            style={{
              background: isDark ? '#27272A' : '#F3F4F6',
              padding: '12px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.follower_count ?? 0}</div>
            <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280' }}>Followers</div>
          </div>

          <div
            style={{
              background: isDark ? '#27272A' : '#F3F4F6',
              padding: '12px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{user.following_count ?? 0}</div>
            <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280' }}>Following</div>
          </div>

          {user.monthly_views > 0 && (
            <div
              style={{
                background: isDark ? '#27272A' : '#F3F4F6',
                padding: '12px',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                {user.monthly_views.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#A1A1AA' : '#6B7280' }}>
                Monthly Views
              </div>
            </div>
          )}
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
            onClick={handleBrowseBoards}
            disabled={isLoadingBoards}
            style={{
              flex: '1 1 150px',
              background: isDark ? '#27272A' : '#F3F4F6',
              color: isDark ? '#FAFAFA' : '#18181B',
              border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isLoadingBoards ? 'Loading Boards...' : '📋 Browse All Boards'}
          </button>

          <button
            onClick={() =>
              sendFollowUpMessage('Analyze my Pinterest account metrics and suggest content growth strategies')
            }
            style={{
              flex: '1 1 150px',
              background: '#E60023',
              color: '#FFFFFF',
              border: 'none',
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✨ Growth Strategy
          </button>
        </div>
      </div>
    </div>
  );
}
