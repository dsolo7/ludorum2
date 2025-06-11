import React from 'react';
import { Brain, Coins } from 'lucide-react';

interface ModelCardProps {
  model: {
    id: string;
    name: string;
    description: string;
    token_cost: number;
    sport?: string;
    betting_type?: string;
  };
  onRun: (modelId: string) => void;
}

export function ModelCard({ model, onRun }: ModelCardProps) {
  return (
    <div className="rounded-2xl p-4 shadow-md bg-gradient-to-br from-gray-900 to-gray-800 text-white hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 bg-yellow-500/20 p-3 rounded-lg mr-3">
          <Brain className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <div className="text-xl font-bold mb-2">{model.name}</div>
          <p className="text-sm text-gray-300 mb-3">{model.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {model.sport && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/50">
                {model.sport}
              </span>
            )}
            {model.betting_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-800/50">
                {model.betting_type}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => onRun(model.id)} 
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
      >
        <Coins className="h-4 w-4 mr-2" />
        Run Model ({model.token_cost} Tokens)
      </button>
    </div>
  );
}