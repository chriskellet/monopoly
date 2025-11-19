import './Dice.css';

interface DiceProps {
  die1: number;
  die2: number;
  rolling: boolean;
}

function Dice({ die1, die2, rolling }: DiceProps) {
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

  return (
    <div className="dice-container">
      <div className={`die ${rolling ? 'rolling' : ''}`}>
        <div className="die-face">{renderDots(die1)}</div>
      </div>
      <div className={`die ${rolling ? 'rolling' : ''}`} style={{ animationDelay: '0.1s' }}>
        <div className="die-face">{renderDots(die2)}</div>
      </div>
    </div>
  );
}

export default Dice;
