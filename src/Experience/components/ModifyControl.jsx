import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Slider,
  Button,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Layers as LayersIcon,
  FileCopy as FileCopyIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Print as PrintIcon
} from '@mui/icons-material';


import WorkspaceConfig from './WorkspaceConfig';

import './ModifyControl.css';


function ModifyControls() {
  const [activeTab, setActiveTab] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 200, height: 150, depth: 100 });

  return (
    <Box sx={{ height: '100vh', bgcolor: 'none', display: 'flex' }}>
      {/* Left Panel - Controls */}
      <Paper 
        elevation={2} 
        sx={{ 
          width: 320, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: '1px solid #e2e8f0'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Box Generator</Typography>
          <IconButton size="small"><FileCopyIcon fontSize="small" /></IconButton>
        </Box>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ mb: 3 }}
        >
          <Tab label="Design" />
          <Tab label="Measurements" />
          <Tab label="Material" />
        </Tabs>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Template</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Select value="custom" displayEmpty>
                <MenuItem value="custom">Custom Box</MenuItem>
                <MenuItem value="tuck">Tuck Top</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Dimensions (mm)</Typography>
            <TextField 
              label="Width" 
              type="number" 
              size="small"
              value={dimensions.width}
              onChange={(e) => setDimensions({...dimensions, width: e.target.value})}
              sx={{ mb: 2 }}
              fullWidth
            />
            <TextField 
              label="Height" 
              type="number" 
              size="small"
              value={dimensions.height}
              onChange={(e) => setDimensions({...dimensions, height: e.target.value})}
              sx={{ mb: 2 }}
              fullWidth
            />
            <TextField 
              label="Depth" 
              type="number" 
              size="small"
              value={dimensions.depth}
              onChange={(e) => setDimensions({...dimensions, depth: e.target.value})}
              sx={{ mb: 2 }}
              fullWidth
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button variant="contained" fullWidth sx={{ mb: 1 }}>
            Generate PDF
          </Button>
        </Box>
      </Paper>

      {/* Center - Canvas Area */}
      <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
        {/* Top Toolbar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <IconButton><LayersIcon /></IconButton>
          <IconButton><UndoIcon /></IconButton>
          <IconButton><RedoIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          <IconButton><ZoomOutIcon /></IconButton>
          <IconButton><ZoomInIcon /></IconButton>
          <IconButton><PrintIcon /></IconButton>
        </Box>

        {/* Canvas */}
        <Paper 
          elevation={4}
          sx={{ 
            flex: 1, 
            position: 'relative',
            bgcolor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Grid Background */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundImage: `linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
          
          {/* Box Template - Net Design */}
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4
          }}>
            {/* Main Body */}
            <Box sx={{ 
              width: `${dimensions.width}px`, 
              height: `${dimensions.height}px`,
              border: '3px dashed #64748b',
              borderRadius: 2,
              mb: 3,
              position: 'relative',
              bgcolor: 'rgba(99, 102, 241, 0.05)'
            }} />

            {/* Side Flaps */}
            <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
              <Box sx={{ 
                width: `${dimensions.depth}px`, 
                height: `${dimensions.height/2}px`,
                border: '2px dashed #64748b',
                bgcolor: 'rgba(99, 102, 241, 0.05)'
              }} />
              <Box sx={{ 
                width: `${dimensions.depth}px`, 
                height: `${dimensions.height/2}px`,
                border: '2px dashed #64748b',
                bgcolor: 'rgba(99, 102, 241, 0.05)'
              }} />
            </Box>

            {/* Dimensions Labels */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {dimensions.width} x {dimensions.height} x {dimensions.depth} mm
              </Typography>
            </Box>
          </Box>

          {/* Measurements Overlay */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(255,255,255,0.9)',
            p: 1,
            borderRadius: 1,
            boxShadow: 1
          }}>
            <Typography variant="caption">Scale: 1:1</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Right Panel - Preview */}
      <Paper 
        elevation={2} 
        sx={{ 
          width: 280, 
          p: 2, 
          borderRadius: 0,
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Typography variant="subtitle1" gutterBottom>Preview</Typography>
        <Box sx={{ 
          flex: 1, 
          bgcolor: '#f1f5f9', 
          borderRadius: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 1,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            width: 160, 
            height: 120, 
            bgcolor: '#ffffff',
            borderRadius: 1,
            boxShadow: 6,
            transform: 'rotateY(10deg) rotateX(5deg)',
            position: 'relative'
          }}>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, right: 4, color: '#64748b' }}>
              3D Render
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
            File: Custom Box
          </Typography>
          <Button variant="outlined" size="small" fullWidth>
            Export
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ModifyControls;