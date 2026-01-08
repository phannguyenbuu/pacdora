import React, { useEffect, useState, useCallback, useRef } from "react";

// ✅ MSwatch - Generic & Stable
const MSwatch = ({ label, typeField, mtlField, blockTypes = [], 
    materials = [], form, isFloor = false, onChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentMtl, setCurrentMtl] = useState(null);
  const [currentType, setCurrentType] = useState(null);
  const dropdownRef = useRef();

  const handleSwatchClick = () => setShowDropdown(prev => !prev);

  // ✅ ĐÓNG KHI CLICK NGOÀI
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ DEFAULT từ form khi mount
  useEffect(() => {
    const typeValue = form.getFieldValue(typeField);
    const mtlValue = form.getFieldValue(mtlField);
    
    if (typeValue && blockTypes.length > 0) {
      setCurrentType(blockTypes.find(item => item.type === typeValue));
    }
    if (mtlValue && materials.length > 0) {
      setCurrentMtl(materials.find(item => item.material === mtlValue));
    }
  }, []);

  // ✅ INSTANT feedback + trigger parent
  const onTypeSelect = (value) => {
    const selectedType = blockTypes.find(item => item.type === value);
    setCurrentType(selectedType);  // ✅ Instant UI
    onChange({ [typeField]: value });
    setShowDropdown(false);
  };

  const onMtlSelect = (material) => {
    setCurrentMtl(material);  // ✅ Instant UI
    onChange({ [mtlField]: material.material });
    setShowDropdown(false);
  };

  return (
    <div className="swatch-container" ref={dropdownRef} 
        style={{position: 'relative', marginTop: 20}}>
      {/* Label */}
      <div style={{
        position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
        fontSize: '11px', fontWeight: 'bold', color: '#fff', 
        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
      }}>
        {label}
      </div>
      
      {/* Swatch */}
      <div 
        className="material-swatch"
        onClick={handleSwatchClick}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: showDropdown ? '4px solid #ff6b6b' : '3px solid rgba(255,255,255,0.7)',
          background: currentMtl?.map ? `url(${currentMtl.map}) center/cover` : 'radial-gradient(circle at 30% 30%, #f5f5f5 0%, #e0e0e0 70%, #b0b0b0)',
          backgroundSize: 'cover', cursor: 'pointer', position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: showDropdown ? '0 0 0 4px rgba(255,107,107,0.4), 0 12px 32px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.4)'
        }}
        title={`Click to change ${label}`}
      >
        {/* Type indicator khi mở dropdown */}
        {showDropdown && blockTypes.length > 0 && (
          <div style={{
            position: 'absolute', top: -6, right: -6, width: 26, height: 26,
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '11px', color: 'white', fontWeight: 'bold', 
            boxShadow: '0 3px 10px rgba(255,107,107,0.5)', animation: 'pulse 1.5s infinite'
          }}>
            T
          </div>
        )}
        
        {/* Type label (W/G) */}
        {currentType && !showDropdown && blockTypes.length > 0 && (
          <div style={{
            position: 'absolute', top: 4, left: 4, width: 20, height: 20,
            background: 'rgba(76, 175, 80, 0.9)', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            fontSize: '9px', fontWeight: 'bold', color: 'white'
          }}>
            {currentType.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: 85, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.98)', borderRadius: 16, padding: 16,
          minWidth: 400, backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.4)',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {/* Types */}
          {blockTypes.length > 0 && (
            <>
              <div style={{fontSize: 12, color: '#666', marginBottom: 10, 
                fontWeight: 500, paddingBottom: 6, borderBottom: '1px solid #eee'}}>
                Type
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12}}>
                {blockTypes.map(item => (
                  <div key={item.type} 
                       className="dropdown-item"
                       style={{
                         padding: '10px 14px', cursor: 'pointer', borderRadius: 10,
                         fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                         background: currentType?.type === item.type ? '#e6f7ff' : 'transparent',
                         display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                       }}
                       onClick={() => onTypeSelect(item.type)}
                       onMouseEnter={e => currentType?.type !== item.type && (e.target.style.background = '#f5faff')}
                       onMouseLeave={e => currentType?.type !== item.type && (e.target.style.background = 'transparent')}
                  >
                    <span>{item.name}</span>
                    {currentType?.type === item.type && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Materials */}
          <div>
            <div style={{fontSize: 12, color: '#666', marginBottom: 10, 
                fontWeight: 500, paddingBottom: 6, borderBottom: '1px solid #eee'}}>
              Material
            </div>
            <div style={{height: 400, overflowY: 'auto'}}>
              {materials.map(item => (
                <div key={item.material} 
                     className="mtl-item"
                     style={{
                       display: 'flex', alignItems: 'center', padding: '8px 12px', 
                       cursor: 'pointer', borderRadius: 10, marginBottom: 4,
                       transition: 'all 0.2s',
                       background: currentMtl?.material === item.material ? '#e6f7ff' : 'transparent'
                     }}
                     onClick={() => onMtlSelect(item)}
                     onMouseEnter={e => currentMtl?.material !== item.material && (e.target.style.background = '#f9f9f9')}
                     onMouseLeave={e => currentMtl?.material !== item.material && (e.target.style.background = 'transparent')}
                >
                  <img src={item.map} style={{width: 28, height: 14, marginRight: 10, borderRadius: 4}}/>
                  <span style={{fontSize: 12, fontWeight: 500}}>{item.name}</span>
                  {currentMtl?.material === item.material && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" style={{marginLeft: 'auto'}}>
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MSwatch;