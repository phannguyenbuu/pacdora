import { useState } from 'react';
import { useUploadTextureStore } from '../../stores/uploadTextureStore';
import "./WorkspaceConfig.css";

const WorkspaceConfig = () => {
  const { uploadImage } = useUploadTextureStore(); // 🔥 Chỉ cần uploadImage
  const [fileInputRef, setFileInputRef] = useState(null);

  const handleUploadClick = () => {
    fileInputRef?.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImage(file); // Không cần meshName
      e.target.value = '';
    }
  };

  return (
    <div className="configurator-container">
      {/* ... existing panels */}
      
      {/* SIMPLIFIED UPLOAD PANEL */}
      <div className="panel panel-upload">
        <div className="panel-content">
          
          {/* HIDDEN INPUT */}
          <input
            ref={setFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {/* BUTTON DUY NHẤT */}
          <button 
            className="upload-btn"
            onClick={handleUploadClick}
          >
            Select Texture
          </button>

          <p className="upload-hint">Click to replace texture of box</p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceConfig;
