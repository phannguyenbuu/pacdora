import React, { useEffect, useState, useCallback, useRef } from "react";
import { Form, Row, Col, Space } from 'antd';
import { usePointer } from "../../stores/selectionStore";
import materials from "../../json/materials.json";
import MSwatch from "./MSwatch";
import "./MaterialPanel.css";


const MaterialPanel = ({ onSave, configKey = "wall" }) => { // ✅ configKey cho model khác nhau
  const [form] = Form.useForm();
  const {
    wallType01, wallMtl01, wallType02, wallMtl02, floorMtl,
    setWallType01, setWallMtl01, setWallType02, setWallMtl02, setFloorMtl
  } = usePointer();


  const configs = {
    default: {
      swatches: [
        { id: 1, label: "Wall-1", typeField: "wallType01", mtlField: "wallMtl01", hasType: true },
        { id: 2, label: "Wall-2", typeField: "wallType02", mtlField: "wallMtl02", hasType: true },
        { id: 3, label: "Floor", mtlField: "floorMtl", hasType: false, isFloor: true }
      ],
      block_types: [
        { name: "Wall", type: "wall" },
        { name: "GlassWall", type: "glasswall" }
      ]
    },
    roof: {
      swatches: [
        { id: 1, label: "Roof", typeField: "roofType", mtlField: "roofMtl", hasType: true }
      ],
      block_types: [
        { name: "Tile", type: "tile" },
        { name: "Metal", type: "metal" }
      ]
    }
  };


  // ✅ Config từ JSON theo model
  const currentConfig = configs[configKey] || configs.default || {
    swatches: [],
    block_types: []
  };

  const { swatches, block_types } = currentConfig;

  const onFinish = (values) => {
    console.log('Selected materials:', values);
    onSave?.(values);
    onCancel();
  };

  // ✅ CUSTOM handleChange từ props hoặc default
  const handleChange = useCallback((allValues) => {
    console.log('🔄 Live update:', allValues);
    
    // Default store update
    if(allValues?.wallType01) setWallType01(block_types.find(el => el.type === allValues?.wallType01));
    if(allValues?.wallMtl01) setWallMtl01(materials.find(el => el.material === allValues?.wallMtl01));
    if(allValues?.wallType02) setWallType02(block_types.find(el => el.type === allValues?.wallType02));
    if(allValues?.wallMtl02) setWallMtl02(materials.find(el => el.material === allValues?.wallMtl02));
    if(allValues?.floorMtl) setFloorMtl(materials.find(el => el.material === allValues?.floorMtl));
    
    // ✅ Custom callback từ parent
    currentConfig.onChange?.(allValues);
  }, [setWallType01, setWallMtl01, setWallType02, setWallMtl02, setFloorMtl, block_types, currentConfig]);



  // Sync store → form
  useEffect(() => {
    form.setFieldsValue({
      wallType01: wallType01?.type,
      wallMtl01: wallMtl01?.material,
      wallType02: wallType02?.type,
      wallMtl02: wallMtl02?.material,
      floorMtl: floorMtl?.material,
    });
  }, [wallType01, wallMtl01, wallType02, wallMtl02, floorMtl, form]);

  return (
    <Form form={form} layout="vertical" onValuesChange={handleChange} autoComplete="off">
      <div className="material-swatches" style={{display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
        {swatches.map((swatch, index) => (
          <MSwatch 
            key={swatch.id}
            label={swatch.label}
            typeField={swatch.typeField}
            mtlField={swatch.mtlField}
            blockTypes={swatch.hasType ? block_types : []}
            materials={materials}
            form={form}
            isFloor={swatch.isFloor}
            onChange={handleChange}
          />
        ))}
      </div>
    </Form>
  );
};

export default MaterialPanel;
