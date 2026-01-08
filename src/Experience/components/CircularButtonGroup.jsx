import React, { useState } from "react";
// import { notification } from "antd";

export default function CircularButtonGroup({actions}) {
  const { setMessage } = useSelection();
  const [selected, setSelected] = useState("Kim");
  const [hovered, setHovered] = useState(null);
  const { getResult, setPersonAge } = usePointer();
  // const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    
    if (!rules || !rules[selected]) return;
    setMessage(getResult());
    

  }, [selected]);

  const handleClick = (_label) => {
    actions.map((action, label) => {
    if(_label === label)
        action();
    });
  };

//   const handleResultClick = () => {
//     setMessage(getResult());
//   };

  const angles = 360 / colors.length;
  const radius = 100;
  const center = 120;
  const holeRadius = 40;

  const createSector = (index) => {
    const startAngle = (angles * index) - (angles / 2);
    const endAngle = startAngle + angles;
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + holeRadius * Math.cos(endRad);
    const y3 = center + holeRadius * Math.sin(endRad);
    const x4 = center + holeRadius * Math.cos(startRad);
    const y4 = center + holeRadius * Math.sin(startRad);

    return `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 0 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${holeRadius} ${holeRadius} 0 0 0 ${x4} ${y4}
      Z
    `;
  };

  return (
    <>
    {contextHolder}
    <div style={{ textAlign: 'center', userSelect: 'none' }}>
      

      <svg
        width={center * 2}
        height={center * 2}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
        style={{ cursor: 'pointer' }}
      >
        {actions.map(({ label, color }, i) => {
          const isSelected = label === selected;
          const isHovered = label === hovered;
          const path = createSector(i);
          const angle = (angles * i);
          const rad = (Math.PI / 180) * angle;
          const labelX = center + ((radius + holeRadius) / 2) * Math.cos(rad);
          const labelY = center + ((radius + holeRadius) / 2) * Math.sin(rad);

          return (
            <g
              key={label}
              onClick={() => handleClick(label)}
              onMouseEnter={() => setHovered(label)}
              onMouseLeave={() => setHovered(null)}
              style={{ transition: "all 0.3s" }}
            >
              <path
                d={path}
                fill={isSelected || isHovered ? color : "#eee"}
                stroke={isSelected || isHovered ? color : "#ccc"}
                strokeWidth={isSelected || isHovered ? 3 : 1}
                style={{ transition: "all 0.3s" }}
              />
              <text
                x={labelX}
                y={labelY + 4}
                fill={isSelected || isHovered ? "white" : "black"}
                fontWeight={isSelected || isHovered ? "bold" : "normal"}
                fontSize={14}
                textAnchor="middle"
                pointerEvents="none"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Vòng tròn hole trắng giữa */}
        <circle
          cx={center}
          cy={center}
          r={holeRadius}
          fill={hovered === 'center' || hovered === null ? "white" : "#ddd"}
          style={{ transition: "fill 0.3s" }}
        //   onMouseEnter={() => setHovered('center')}
        //   onMouseLeave={() => setHovered(null)}
        />

        {/* Text ở tâm vòng tròn */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={hovered === 'center' ? "#007BFF" : "black"}
          fontWeight="bold"
          fontSize={10}
          style={{ userSelect: 'none', pointerEvents: 'none', transition: "fill 0.3s" }}
        >
          {'Điều khiển'.toUpperCase()}
        </text>
      </svg>
    </div>
    </>
  );
}
