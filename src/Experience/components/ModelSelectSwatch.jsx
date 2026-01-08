import React, { useRef, useEffect, useState } from "react";
import { useSelection } from "../../stores/selectionStore";



// ✅ ModelSelectSwatch - giống MaterialSwatch cho models
const ModelSelectSwatch = ({ 
  label, 
  models = [], 
  selectedModel, 
  onSelectModel,
  isBedroom = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const dropdownRef = useRef();
  const { setCurrentLibNodeSelection, setMessage } = useSelection();


   const handleModelSelect = (model) => {
    setCurrentModel(model);
    
    // ✅ GỌI handleSelect giống PanelFurnituresModal
    onSelectModel?.(model);  // Callback cho parent
    
    // ✅ Tích hợp logic ADD furniture (từ store)
    
    setCurrentLibNodeSelection(model);  // ✅ ADD vào store
    setMessage(`Đã chọn ${model.name} ${(model.cost)}|Vui lòng đợi load file 3D`);
    
    setShowDropdown(false);
    console.log(`✅ Added model:`, model);
  };



  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwatchClick = () => setShowDropdown(prev => !prev);

  const onModelSelect = (model) => {
    setCurrentModel(model);
    onSelectModel(model);  // Callback thêm model vào scene
    setShowDropdown(false);
    console.log(`✅ Selected ${label}:`, model.name);
  };

  return (
    <div className="model-swatch-container" ref={dropdownRef} style={{position: 'relative'}}>
     
      
      {/* Swatch tròn */}
      <div 
        className="model-swatch"
        onClick={handleSwatchClick}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: showDropdown ? '4px solid #ff6b6b' : '3px solid rgba(255,255,255,0.7)',
          background: currentModel?.thumbnail 
            ? `url(${currentModel.thumbnail}) center/cover` 
            : isBedroom 
              ? 'radial-gradient(circle, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'  // Bedroom pink
              : 'radial-gradient(circle, #a8edea 0%, #fed6e3 50%, #fed6e3 100%)',  // Living gradient
          backgroundSize: 'cover', 
          cursor: 'pointer', 
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: showDropdown 
            ? '0 0 0 4px rgba(255,107,107,0.4), 0 12px 32px rgba(0,0,0,0.5)' 
            : '0 6px 20px rgba(0,0,0,0.4)'
        }}
        title={`Click to select ${label} models`}
      >
        <div style={{
        position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
        userSelect: 'none', pointerEvents: 'none', fontSize: '11px', fontWeight: 'bold', color: '#333'
      }}>
        {label.toUpperCase()}
      </div>

        {/* Model indicator */}
        {showDropdown && (
          <div style={{
            position: 'absolute', top: -6, right: -6, width: 26, height: 26,
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '11px', color: 'white', 
            fontWeight: 'bold', boxShadow: '0 3px 10px rgba(255,107,107,0.5)',
            animation: 'pulse 1.5s infinite'
          }}>
            M
          </div>
        )}
        
        {/* Selected model badge */}
        {currentModel && !showDropdown && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 4, width: 20, height: 20,
            background: 'rgba(76, 175, 80, 0.9)', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            {currentModel.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Dropdown list models */}
      {showDropdown && (
        <div style={{
          position: 'absolute',  bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.98)', borderRadius: 16, padding: 16,
          minWidth: 280, backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.4)',
          animation: 'slideDown 0.2s ease-out',
          maxHeight: 450,
          overflowY: 'auto'
        }}>
          <div style={{fontSize: 12, color: '#666', marginBottom: 12, fontWeight: 500}}>
            {models.length} Models
          </div>
          
          <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    alignItems: 'start'
  }}>
          {models.map((model, index) => (
            <div
              key={model.id || index}
              className="model-item"
              onClick={() => handleModelSelect(model)}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 16px', 
                cursor: 'pointer', borderRadius: 12, marginBottom: 8,
                transition: 'all 0.2s',
                background: currentModel?.id === model.id ? '#e6f7ff' : 'transparent'
              }}
              
              onMouseEnter={e => {
                if (currentModel?.id !== model.id) e.target.style.background = '#f9f9f9';
              }}
              onMouseLeave={e => {
                if (currentModel?.id !== model.id) e.target.style.background = 'transparent';
              }}
            >
              <img 
                src={model.preview} 
                style={{width: 60, height: 45, marginRight: 12, borderRadius: 6, objectFit: 'cover'}}
                alt={model.name}
              />
              <div style={{flex: 1}}>
                <div style={{fontSize: 13, fontWeight: 600, color: '#333'}}>
                  {model.name}
                </div>
                {/* <div style={{fontSize: 11, color: '#666'}}>
                  {model.category} • {model.size || 'Std'}
                </div> */}
                <div style={{fontSize: 11, fontWeight: 500, color: '#1890ff', marginTop: 2}}>
                    {(model.cost)}
                </div>
              </div>
              {currentModel?.id === model.id && (
                <svg width="20" height="20" fill="#52c41a" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
      
       {/* Label */}
      
    </div>
  );
};


export default ModelSelectSwatch;