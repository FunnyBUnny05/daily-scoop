import React, { useEffect, useState } from 'react';
import './FlexCreature.css';

const FlexCreature = ({ isActive }) => {
  const [isFlexing, setIsFlexing] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Small delay before flexing so it can slide up first
      const t = setTimeout(() => {
        setIsFlexing(true);
      }, 500);
      return () => clearTimeout(t);
    } else {
      setIsFlexing(false);
    }
  }, [isActive]);

  return (
    <div className={`creature-container ${isActive ? 'active' : ''} ${isFlexing ? 'flexing' : ''}`}>
        <svg viewBox="0 0 40 40" width="80" height="80" shapeRendering="crispEdges">
          {/* Main Body */}
          <rect x="12" y="12" width="16" height="20" fill="#00FFFF" />
          <rect x="14" y="8" width="12" height="4" fill="#00FFFF" />
          <rect x="16" y="6" width="8" height="2" fill="#00FFFF" /> {/* Ear bumps */}
          <rect x="12" y="4" width="2" height="4" fill="#00FFFF" />
          <rect x="26" y="4" width="2" height="4" fill="#00FFFF" />
          
          <rect x="10" y="14" width="2" height="16" fill="#00FFFF" />
          <rect x="28" y="14" width="2" height="16" fill="#00FFFF" />
          
          {/* Legs */}
          <rect x="14" y="32" width="4" height="4" fill="#00FFFF" />
          <rect x="22" y="32" width="4" height="4" fill="#00FFFF" />

          {/* Details (Eyes + Mouth) */}
          <rect x="14" y="16" width="2" height="2" fill="#0A0A0A" /> {/* L Eye */}
          <rect x="24" y="16" width="2" height="2" fill="#0A0A0A" /> {/* R Eye */}
          <rect x="18" y="20" width="4" height="2" fill="#0A0A0A" /> {/* Mouth Row 1 */}
          <rect x="16" y="18" width="2" height="2" fill="#0A0A0A" /> {/* Mouth corner L */}
          <rect x="22" y="18" width="2" height="2" fill="#0A0A0A" /> {/* Mouth corner R */}
          
          {/* Belly highlight */}
          <rect x="16" y="24" width="8" height="6" fill="#4DFFFF" />

          {/* Left Arm hinged at X:10 Y:16 */}
          <g className="arm left-arm" style={{ transformOrigin: '10px 16px' }}>
            {/* Hanging arm */}
            <rect x="6" y="16" width="4" height="8" fill="#00FFFF" />
            <rect x="4" y="22" width="2" height="4" fill="#00FFFF" /> {/* hand chunk */}
            {/* Bicep (appears dynamically via scale) */}
            <rect className="bicep" x="2" y="12" width="6" height="6" fill="#4DFFFF" />
          </g>

          {/* Right Arm hinged at X:30 Y:16 */}
          <g className="arm right-arm" style={{ transformOrigin: '30px 16px' }}>
            <rect x="30" y="16" width="4" height="8" fill="#00FFFF" />
            <rect x="34" y="22" width="2" height="4" fill="#00FFFF" /> {/* hand chunk */}
            {/* Bicep (appears dynamically via scale) */}
            <rect className="bicep bicep-r" x="32" y="12" width="6" height="6" fill="#4DFFFF" />
          </g>
          
          {/* Super Saiyan / Power lines (hidden till flex) */}
          <g className="power-lines">
            <rect x="4" y="4" width="2" height="6" fill="#00FFFF" />
            <rect x="34" y="4" width="2" height="6" fill="#00FFFF" />
            <rect x="8" y="2" width="4" height="2" fill="#00FFFF" />
            <rect x="28" y="2" width="4" height="2" fill="#00FFFF" />
          </g>
        </svg>
    </div>
  );
};

export default FlexCreature;
