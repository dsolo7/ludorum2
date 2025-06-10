import React, { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TokenGateProps {
  children: ReactNode;
  rule?: {
    minTokens?: number;
    requiresAuth?: boolean;
    hasUsedAnalyzer?: string;
    joinedContest?: string;
    hasJoinedAnyContest?: boolean;
    hasUsedAnyAnalyzer?: boolean;
  };
}

interface UserVisibilityData {
  tokenBalance: number;
  usedAnalyzers: string[];
  joinedContests: string[];
  isAuthenticated: boolean;
}

export const TokenGate: React.FC<TokenGateProps> = ({ children, rule }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [userData, setUserData] = useState<UserVisibilityData>({
    tokenBalance: 0,
    usedAnalyzers: [],
    joinedContests: [],
    isAuthenticated: false
  });

  useEffect(() => {
    // If no rule, always show content
    if (!rule || Object.keys(rule).length === 0) {
      setIsVisible(true);
      return;
    }

    // Fetch user data for visibility check
    const fetchUserData = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserData({
            tokenBalance: 0,
            usedAnalyzers: [],
            joinedContests: [],
            isAuthenticated: false
          });
          return;
        }
        
        // Fetch user token balance
        const { data: tokenData } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        
        // Fetch analyzers the user has used
        const { data: analyzerData } = await supabase
          .from('analyzer_requests')
          .select('model_id')
          .eq('user_id', user.id)
          .eq('status', 'completed');
        
        // Fetch contests the user has joined
        const { data: contestData } = await supabase
          .from('contest_entries')
          .select('contest_id')
          .eq('user_id', user.id);
        
        setUserData({
          tokenBalance: tokenData?.balance || 0,
          usedAnalyzers: analyzerData?.map(item => item.model_id) || [],
          joinedContests: contestData?.map(item => item.contest_id) || [],
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Error fetching user data for visibility check:', error);
      }
    };

    fetchUserData();
  }, [rule]);

  useEffect(() => {
    if (!rule) {
      setIsVisible(true);
      return;
    }

    // Check authentication requirement
    if (rule.requiresAuth === true && !userData.isAuthenticated) {
      setIsVisible(false);
      return;
    }
    
    // Check minimum token balance
    if (rule.minTokens !== undefined && userData.tokenBalance < rule.minTokens) {
      setIsVisible(false);
      return;
    }
    
    // Check if user has used a specific analyzer
    if (rule.hasUsedAnalyzer && !userData.usedAnalyzers.includes(rule.hasUsedAnalyzer)) {
      setIsVisible(false);
      return;
    }
    
    // Check if user has joined a specific contest
    if (rule.joinedContest && !userData.joinedContests.includes(rule.joinedContest)) {
      setIsVisible(false);
      return;
    }
    
    // Check if user has joined any contest
    if (rule.hasJoinedAnyContest === true && userData.joinedContests.length === 0) {
      setIsVisible(false);
      return;
    }
    
    // Check if user has used any analyzer
    if (rule.hasUsedAnyAnalyzer === true && userData.usedAnalyzers.length === 0) {
      setIsVisible(false);
      return;
    }
    
    // If all checks pass, show the content
    setIsVisible(true);
  }, [rule, userData]);

  if (!isVisible) return null;
  
  return <>{children}</>;
};