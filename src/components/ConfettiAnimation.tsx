import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
    rotation: number;
  };
}

interface ConfettiAnimationProps {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ 
  isActive, 
  duration = 3000, 
  onComplete 
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const createConfettiPiece = (id: number): ConfettiPiece => ({
    id,
    x: Math.random() * window.innerWidth,
    y: -10,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    velocity: {
      x: (Math.random() - 0.5) * 4,
      y: Math.random() * 3 + 2,
      rotation: (Math.random() - 0.5) * 10,
    },
  });

  useEffect(() => {
    if (!isActive) return;

    setIsAnimating(true);
    
    // Create initial confetti pieces
    const initialConfetti = Array.from({ length: 50 }, (_, i) => createConfettiPiece(i));
    setConfetti(initialConfetti);

    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        setConfetti([]);
        setIsAnimating(false);
        onComplete?.();
        return;
      }

      setConfetti(prevConfetti => 
        prevConfetti
          .map(piece => ({
            ...piece,
            x: piece.x + piece.velocity.x,
            y: piece.y + piece.velocity.y,
            rotation: piece.rotation + piece.velocity.rotation,
          }))
          .filter(piece => piece.y < window.innerHeight + 20)
      );

      // Add new confetti pieces occasionally
      if (elapsed < duration * 0.6 && Math.random() < 0.1) {
        setConfetti(prev => [
          ...prev,
          createConfettiPiece(Date.now() + Math.random())
        ]);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, duration, onComplete]);

  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiAnimation;