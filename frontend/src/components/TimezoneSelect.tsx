import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Search, ChevronDown, Check } from 'lucide-react';

export const COMMON_TIMEZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Dublin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Rome',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  detectedTz?: string;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  detectedTz,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const allTimezones = useMemo(() => {
    const list = [...COMMON_TIMEZONES];
    if (detectedTz && !list.includes(detectedTz)) {
      list.unshift(detectedTz);
    }
    return list;
  }, [detectedTz]);

  const filteredTimezones = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allTimezones;
    return allTimezones.filter((tz) => tz.toLowerCase().includes(query));
  }, [allTimezones, searchQuery]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.92)',
          border: isOpen ? '1px solid #6366f1' : '1px solid #ded6c9',
          borderRadius: '8px',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.18)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
          color: '#1c1917',
          fontSize: '0.95rem',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Globe size={16} color="#6366f1" />
          <span style={{ fontWeight: 500 }}>
            {value || 'Select Timezone...'}
          </span>
          {value === detectedTz && (
            <span
              style={{
                fontSize: '0.7rem',
                background: 'rgba(79, 70, 229, 0.1)',
                color: '#4338ca',
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                fontWeight: 600,
              }}
            >
              Detected
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          color="#78716c"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Custom Dropdown Popover with Scroll Container */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid #dcd5c9',
            borderRadius: '10px',
            boxShadow: '0 12px 36px rgba(120, 105, 85, 0.18), 0 2px 8px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.15s ease-out',
          }}
        >
          {/* Search Filter Header */}
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderBottom: '1px solid #e7e2d9',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(248, 244, 237, 0.8)',
            }}
          >
            <Search size={15} color="#78716c" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search timezone (e.g. Kolkata, New York)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.35rem 0.5rem',
                fontSize: '0.85rem',
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
                color: '#1c1917',
                outline: 'none',
              }}
            />
          </div>

          {/* Bounded Scrollable Option List (Fixed Height max 210px) */}
          <div
            style={{
              maxHeight: '210px',
              overflowY: 'auto',
              padding: '0.35rem',
            }}
          >
            {filteredTimezones.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#78716c' }}>
                No matching timezones found
              </div>
            ) : (
              filteredTimezones.map((tz) => {
                const isSelected = tz === value;
                const isDetected = tz === detectedTz;

                return (
                  <div
                    key={tz}
                    onClick={() => {
                      onChange(tz);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      color: isSelected ? '#4338ca' : '#1c1917',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(243, 238, 229, 0.7)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{tz}</span>
                      {isDetected && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            background: 'rgba(79, 70, 229, 0.1)',
                            color: '#4338ca',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px',
                            fontWeight: 600,
                          }}
                        >
                          Detected
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={15} color="#4338ca" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
