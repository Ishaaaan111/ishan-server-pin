'use client';

import React from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

export const dynamic = 'force-dynamic';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  icon: string;
  timestamp: string;
}

export default function WeatherLookup() {
  const { isReady, getToolOutput } = useWidgetSDK();
  const theme = useTheme();
  const isDark = theme === 'dark';

  const data = getToolOutput<WeatherData>();

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
            borderTopColor: '#3B82F6',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          Loading weather data...
        </p>
      </div>
    );
  }

  if (!data) {
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
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌤️</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>
          Weather Data Unavailable
        </h3>
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#71717A', margin: 0 }}>
          No weather data was received. Please try again with a valid location.
        </p>
      </div>
    );
  }

  const safeData = {
    location: data.location ?? 'Unknown Location',
    temperature: data.temperature ?? 0,
    condition: data.condition ?? 'Unknown',
    humidity: data.humidity ?? 0,
    windSpeed: data.windSpeed ?? 0,
    feelsLike: data.feelsLike ?? 0,
    uvIndex: data.uvIndex ?? 0,
    visibility: data.visibility ?? 0,
    pressure: data.pressure ?? 0,
    icon: data.icon ?? '',
    timestamp: data.timestamp ?? new Date().toISOString(),
  };

  const getWeatherEmoji = (condition: string): string => {
    const lower = condition.toLowerCase();
    if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('storm') || lower.includes('thunder')) return '⛈️';
    if (lower.includes('fog') || lower.includes('mist')) return '🌫️';
    if (lower.includes('wind')) return '💨';
    return '🌤️';
  };

  const getUVIndexLabel = (uv: number): string => {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
  };

  const getUVIndexColor = (uv: number): string => {
    if (uv < 3) return isDark ? '#10B981' : '#059669';
    if (uv < 6) return isDark ? '#F59E0B' : '#D97706';
    if (uv < 8) return isDark ? '#EF4444' : '#DC2626';
    if (uv < 11) return isDark ? '#8B5CF6' : '#7C3AED';
    return isDark ? '#DC2626' : '#991B1B';
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
        {/* Header with Location and Current Conditions */}
        <div
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)'
              : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            padding: '24px',
            color: '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  margin: '0 0 4px 0',
                  lineHeight: '1.2',
                }}
              >
                {safeData.location}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  opacity: 0.9,
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                {new Date(safeData.timestamp).toLocaleString()}
              </p>
            </div>
            <div
              style={{
                fontSize: '64px',
                lineHeight: '1',
              }}
            >
              {getWeatherEmoji(safeData.condition)}
            </div>
          </div>

          {/* Temperature Display */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                fontWeight: 700,
                lineHeight: '1',
              }}
            >
              {safeData.temperature}°C
            </div>
            <div
              style={{
                fontSize: '16px',
                opacity: 0.9,
                fontWeight: 500,
              }}
            >
              {safeData.condition}
            </div>
          </div>

          {/* Feels Like */}
          <div
            style={{
              marginTop: '12px',
              fontSize: '14px',
              opacity: 0.85,
            }}
          >
            Feels like {safeData.feelsLike}°C
          </div>
        </div>

        {/* Weather Details Grid */}
        <div
          style={{
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Humidity */}
          <div
            style={{
              padding: '16px',
              background: isDark ? '#27272A' : '#F3F4F6',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#3F3F46' : '#E5E7EB'}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              💧 Humidity
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: isDark ? '#F4F4F5' : '#111827',
              }}
            >
              {safeData.humidity}%
            </div>
          </div>

          {/* Wind Speed */}
          <div
            style={{
              padding: '16px',
              background: isDark ? '#27272A' : '#F3F4F6',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#3F3F46' : '#E5E7EB'}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              💨 Wind Speed
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: isDark ? '#F4F4F5' : '#111827',
              }}
            >
              {safeData.windSpeed} km/h
            </div>
          </div>

          {/* Visibility */}
          <div
            style={{
              padding: '16px',
              background: isDark ? '#27272A' : '#F3F4F6',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#3F3F46' : '#E5E7EB'}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              👁️ Visibility
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: isDark ? '#F4F4F5' : '#111827',
              }}
            >
              {safeData.visibility} km
            </div>
          </div>

          {/* Pressure */}
          <div
            style={{
              padding: '16px',
              background: isDark ? '#27272A' : '#F3F4F6',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#3F3F46' : '#E5E7EB'}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🔽 Pressure
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: isDark ? '#F4F4F5' : '#111827',
              }}
            >
              {safeData.pressure} mb
            </div>
          </div>

          {/* UV Index */}
          <div
            style={{
              padding: '16px',
              background: isDark ? '#27272A' : '#F3F4F6',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#3F3F46' : '#E5E7EB'}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              ☀️ UV Index
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: isDark ? '#F4F4F5' : '#111827',
                }}
              >
                {safeData.uvIndex.toFixed(1)}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: getUVIndexColor(safeData.uvIndex),
                  color: '#FFFFFF',
                }}
              >
                {getUVIndexLabel(safeData.uvIndex)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
