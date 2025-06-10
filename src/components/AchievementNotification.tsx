import React, { useState, useEffect } from 'react';
import { Trophy, X, Star, Gift } from 'lucide-react';
import ConfettiAnimation from './ConfettiAnimation';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  icon?: string;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible && achievement) {
      setShowConfetti(true);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, achievement, onClose]);

  if (!isVisible || !achievement) return null;

  return (
    <>
      <ConfettiAnimation 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      
      <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-2xl p-6 text-white transform animate-slide-in-right">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold">Achievement Unlocked!</h3>
                <p className="text-sm opacity-90">{achievement.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm opacity-90 mb-3">
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">
                  +{achievement.xp_reward} XP
                </span>
              </div>
              <Gift className="w-5 h-5 opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AchievementNotification;