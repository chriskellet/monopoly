import { useEffect, useState } from 'react';
import './Dice.css';

interface DiceProps {
  die1: number;
  die2: number;
  rolling: boolean;
}

function Dice({ die1, die2, rolling }: DiceProps) {
  const [rotations, setRotations] = useState({ die1: { x: 0, y: 0, z: 0 }, die2: { x: 0, y: 0, z: 0 } });

  useEffect(() => {
    if (rolling) {
      // Random rotations while rolling
      const interval = setInterval(() => {
        setRotations({
          die1: {
            x: Math.random() * 360,
            y: Math.random() * 360,
            z: Math.random() * 360,
          },
          die2: {
            x: Math.random() * 360,
            y: Math.random() * 360,
            z: Math.random() * 360,
          },
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Set final rotation based on die value
      setRotations({
        die1: getFinalRotation(die1),
        die2: getFinalRotation(die2),
      });
    }
  }, [rolling, die1, die2]);

  const getFinalRotation = (value: number) => {
    // Rotations to show each face - rotate the cube to bring that face forward
    const rotations: Record<number, { x: number; y: number; z: number }> = {
      1: { x: 0, y: 0, z: 0 },        // front face (1)
      2: { x: 0, y: -90, z: 0 },      // right face (2)
      3: { x: -90, y: 0, z: 0 },      // top face (3)
      4: { x: 90, y: 0, z: 0 },       // bottom face (4)
      5: { x: 0, y: 90, z: 0 },       // left face (5)
      6: { x: 0, y: 180, z: 0 },      // back face (6)
    };
    return rotations[value] || { x: 0, y: 0, z: 0 };
  };

  const renderDots = (value: number) => {
    const dots = [];
    const positions = [
      [], // 0 - not used
      [4], // 1
      [0, 8], // 2
      [0, 4, 8], // 3
      [0, 2, 6, 8], // 4
      [0, 2, 4, 6, 8], // 5
      [0, 2, 3, 5, 6, 8], // 6
    ];

    for (let i = 0; i < 9; i++) {
      const isActive = positions[value]?.includes(i);
      dots.push(
        <div key={i} className={`dot ${isActive ? 'active' : ''}`} />
      );
    }

    return dots;
  };

  const renderDie = (value: number, rotation: { x: number; y: number; z: number }, delay: number) => (
    <div
      className={`die-scene ${rolling ? 'rolling' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="die-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transition: rolling ? 'transform 0.1s linear' : 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Face 1 - Front */}
        <div className="die-face die-face-front">
          {renderDots(1)}
        </div>
        {/* Face 2 - Right */}
        <div className="die-face die-face-right">
          {renderDots(2)}
        </div>
        {/* Face 3 - Top */}
        <div className="die-face die-face-top">
          {renderDots(3)}
        </div>
        {/* Face 4 - Bottom */}
        <div className="die-face die-face-bottom">
          {renderDots(4)}
        </div>
        {/* Face 5 - Left */}
        <div className="die-face die-face-left">
          {renderDots(5)}
        </div>
        {/* Face 6 - Back */}
        <div className="die-face die-face-back">
          {renderDots(6)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dice-container">
      {renderDie(die1, rotations.die1, 0)}
      {renderDie(die2, rotations.die2, 0.1)}
    </div>
  );
}

export default Dice;
