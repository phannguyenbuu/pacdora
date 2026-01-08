import React, { useRef, useEffect, useState } from "react";
import PanelFurnitures from "../components/PanelFurnitures";
import { Modal, Tabs } from 'antd';
import './MaterialPanel.css';
import { usePointer, useSelection } from "../../stores/selectionStore";

const { TabPane } = Tabs;

function groupFurnitures(furnitures) {
    const grouped = furnitures.reduce((acc, item) => {
      const key = item.name; // hoặc id nếu có
      if (acc[key]) {
        acc[key].quantity += 1;
      } else {
        acc[key] = { ...item, quantity: 1 };
      }
      return acc;
    }, {});

    // Chuyển object thành array
    return Object.values(grouped);
  }

const CartInUsePanel = () => {
  const { addedHighlights, setAddedHighlights } = usePointer();
  // const {toVN} = useSelection();
  const [showDropdown, setShowDropdown] = useState(false);
  const [furnitures, setFurnitures] = useState([]);
  const [currentFurniture, setCurrentFurniture] = useState(null);
  const dropdownRef = useRef();

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

  // Group furnitures
  useEffect(() => {
    setFurnitures(groupFurnitures(addedHighlights.map(el => el.data)));
  }, [addedHighlights]);

  const handleSwatchClick = () => setShowDropdown(prev => !prev);

  const handleFurnitureClick = (furniture) => {
    setCurrentFurniture(furniture);
    console.log('Selected furniture:', furniture);
    // Logic edit/remove furniture
    setShowDropdown(false);
  };

  return (
    <div className="cart-panel" ref={dropdownRef} style={{position: 'relative'}}>
      {/* Title */}
      
      {/* Swatch tròn chính */}
      <div 
        className="cart-swatch"
        onClick={handleSwatchClick}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          margin: '0 auto 24px',
          border: showDropdown ? '4px solid #ff6b6b' : '3px solid rgba(255,255,255,0.7)',
          background: currentFurniture?.color 
            ? `url(${currentFurniture.thumbnail}) center/cover` 
            : 'radial-gradient(circle at 30% 30%, #ffecd2 0%, #fcb69f 50%, #ff8a80 100%)',
          backgroundSize: 'cover', 
          cursor: 'pointer', 
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: showDropdown 
            ? '0 0 0 4px rgba(255,107,107,0.4), 0 12px 32px rgba(0,0,0,0.5)' 
            : '0 6px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title="Click to manage cart items"
      >
        

        <div style={{
            position: 'absolute',
            fontSize: furnitures.length > 99 ? 16 : 24,
            fontWeight: 'bold', 
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            zIndex: 2
        }}>
            {furnitures.length || 0}
        </div>

        <div style={{
            fontSize: furnitures.reduce((sum, f) => sum + (f.cost * (f.quantity || 1)), 0) > 50000000 ? 12 : 16,
            fontWeight: 'bold', 
            color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            textAlign: 'center',
            lineHeight: 1.2,
            zIndex: 2,
            marginTop: 90
        }}>{
            furnitures.reduce((sum, furniture) => {
                return sum + (Number(furniture.cost || 0) * (furniture.quantity || 1));
            }, 0)
            }
        </div>
        
        {/* Indicator */}
        {/* {showDropdown && (
          <div style={{
            position: 'absolute', top: -6, right: -6, width: 28, height: 28,
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '12px', color: 'white', 
            fontWeight: 'bold', boxShadow: '0 3px 10px rgba(255,107,107,0.5)',
            animation: 'pulse 1.5s infinite'
          }}>
            🛒
          </div>
        )} */}
        
        {/* Selected badge */}
        {currentFurniture && !showDropdown && (
          <div style={{
            position: 'absolute', top: 6, left: 6, width: 24, height: 24,
            background: 'rgba(82, 196, 26, 0.9)', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            userSelect: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            {furnitures.length}
          </div>
        )}
      </div>

      {/* ✅ DROPDOWN LIST - Hiện LÊN TRÊN */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top:90, left: 0, transform: 'translateX(-50%)',
          marginBottom: 12,
          background: 'rgba(255,255,255,0.98)', borderRadius: 16, padding: 16,
          minWidth: 320, backdropFilter: 'blur(16px)',
          boxShadow: '0 -12px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)',
          animation: 'slideUp 0.2s ease-out',
          maxHeight: 680, overflowY: 'auto',
          zIndex: 1001
        }}>
          {/* <div style={{fontSize: 13, color: '#666', marginBottom: 16, fontWeight: 500}}>
            Manage {furnitures.length} Items
          </div>
           */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12}}>
            {furnitures.map((furniture, index) => (
              <div
                key={furniture.id || index}
                className="cart-item"
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px 12px', 
                  cursor: 'pointer', borderRadius: 10, 
                  transition: 'all 0.2s',
                  background: currentFurniture?.id === furniture.id ? '#e6f7ff' : 'transparent',
                  gap: 8
                }}
                onClick={() => handleFurnitureClick(furniture)}
                onMouseEnter={e => {
                  if (currentFurniture?.id !== furniture.id) {
                    e.target.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={e => {
                  if (currentFurniture?.id !== furniture.id) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <img 
                  src={furniture.preview || furniture.icon || '/images/default-furniture.svg'} 
                  style={{width: 60, height: 45, borderRadius: 6, objectFit: 'cover'}}
                  alt={furniture.name}
                />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12, fontWeight: 600, color: '#333'}}>
                    {furniture.name || furniture.label}
                  </div>
                  <div style={{fontSize: 10, color: '#666'}}>
                    x{furniture.quantity || 1}
                  </div>
                  <div style={{fontSize: 11, fontWeight: 500, color: '#1890ff', marginTop: 2}}>
                    {toVN(furniture.cost * (furniture.quantity || 1))}
                    </div>
                </div>
                {currentFurniture?.id === furniture.id && (
                  <div style={{fontSize: 16, color: '#52c41a'}}>✓</div>
                )}
              </div>
            ))}
          </div>
          
          {furnitures.length === 0 && (
            <div style={{textAlign: 'center', color: '#999', padding: 20, fontSize: 14}}>
              Cart trống
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartInUsePanel;