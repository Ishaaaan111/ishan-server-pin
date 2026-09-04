'use client';

import React, { useState } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface NormalizedPin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  pinterest_url: string;
  board_id?: string;
  link?: string;
}

export default function PinDetails() {
  const { isReady, getToolOutput, openExternal, sendFollowUpMessage } = useWidgetSDK();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract and normalize pin data from output
  const rawOutput = getToolOutput<any>();
  const pin: NormalizedPin | undefined =
    rawOutput?.pin ||
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
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
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
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          Loading Pinterest Pin details...
        </p>
      </div>
    );
  }

  if (!pin || !pin.id) {
    return (
      <div
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: isDark ? '#18181B' : '#FAFAFA',
          color: isDark ? '#F4F4F5' : '#18181B',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#27272A' : '#E4E4E7'}`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📌</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>
          Pin Details Unavailable
        </h3>
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          No Pin data was received or the requested Pin could not be loaded.
        </p>
      </div>
    );
  }

  const handleCopyLink = () => {
    const targetUrl = pin.pinterest_url || `https://www.pinterest.com/pin/${pin.id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasImage = Boolean(pin.image_url) && !imgError;

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
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.5)'
            : '0 10px 30px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Left Side: Pin Image Card */}
        <div
          style={{
            flex: '1 1 280px',
            minHeight: '320px',
            maxHeight: '440px',
            position: 'relative',
            background: isDark
              ? 'linear-gradient(135deg, #1C1917 0%, #0C0A09 100%)'
              : 'linear-gradient(135deg, #F5F5F4 0%, #E7E5E4 100%)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                    background: isDark ? '#1C1917' : '#F5F5F4',
                    color: isDark ? '#71717A' : '#A1A1AA',
                    fontSize: '13px',
                  }}
                >
                  Loading image...
                </div>
              )}
              <img
                src={pin.image_url}
                alt={pin.title || 'Pinterest Pin'}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  display: 'block',
                }}
              />
            </>
          ) : (
            <div
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                height: '100%',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(230, 0, 35, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                }}
              >
                📌
              </div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>
                {pin.title || 'Pinterest Pin'}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: isDark ? '#A1A1AA' : '#71717A',
                  background: isDark ? '#27272A' : '#E4E4E7',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}
              >
                Visual Preview
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Content and Actions */}
        <div
          style={{
            flex: '1.2 1 300px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div>
            {/* Top Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isDark ? 'rgba(230, 0, 35, 0.15)' : 'rgba(230, 0, 35, 0.08)',
                  color: '#E60023',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <span>📌</span>
                <span>Pin ID: {pin.id}</span>
              </div>

              {pin.board_id && (
                <span
                  style={{
                    fontSize: '11px',
                    color: isDark ? '#A1A1AA' : '#71717A',
                    background: isDark ? '#27272A' : '#F4F4F5',
                    padding: '3px 8px',
                    borderRadius: '8px',
                  }}
                >
                  Board: {pin.board_id}
                </span>
              )}
            </div>

            {/* Pin Title */}
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                lineHeight: '1.3',
                margin: '0 0 10px 0',
                color: isDark ? '#F4F4F5' : '#111827',
              }}
            >
              {pin.title || 'Untitled Pin'}
            </h2>

            {/* Pin Description */}
            <p
              style={{
                fontSize: '14px',
                color: isDark ? '#D4D4D8' : '#4B5563',
                lineHeight: '1.6',
                margin: '0 0 16px 0',
                whiteSpace: 'pre-wrap',
              }}
            >
              {pin.description || 'No description provided for this Pin.'}
            </p>

            {/* Outbound Link */}
            {pin.link && (
              <div
                style={{
                  padding: '10px 14px',
                  background: isDark ? '#27272A' : '#F3F4F6',
                  borderRadius: '10px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: isDark ? '#A1A1AA' : '#6B7280' }}>🔗</span>
                <a
                  href={pin.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: isDark ? '#60A5FA' : '#2563EB',
                    textDecoration: 'none',
                    fontWeight: 500,
                    wordBreak: 'break-all',
                  }}
                >
                  {pin.link}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '16px',
              borderTop: `1px solid ${isDark ? '#27272A' : '#E5E7EB'}`,
            }}
          >
            <button
              onClick={() => openExternal(pin.pinterest_url || `https://www.pinterest.com/pin/${pin.id}`)}
              style={{
                flex: '1 1 140px',
                background: '#E60023',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span>Open on Pinterest</span>
              <span>↗</span>
            </button>

            <button
              onClick={() =>
                sendFollowUpMessage(
                  `Give me detailed design inspiration, shopping keywords, and aesthetic recommendations based on this Pin: "${pin.title || pin.description}"`
                )
              }
              style={{
                flex: '1 1 130px',
                background: isDark ? '#27272A' : '#F3F4F6',
                color: isDark ? '#F4F4F5' : '#18181B',
                border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>💡</span>
              <span>Generate Ideas</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Copy Pin URL"
              style={{
                background: isDark ? '#27272A' : '#F3F4F6',
                color: isDark ? '#A1A1AA' : '#71717A',
                border: `1px solid ${isDark ? '#3F3F46' : '#D1D5DB'}`,
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied' : '📋 Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
