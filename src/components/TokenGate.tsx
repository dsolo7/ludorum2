import React, { ReactNode, useEffect, useState } from 'react';
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
    loggedIn?: boolean; // Alias for requiresAuth for compatibility
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
  const [dataFetched, setDataFetched] = useState(false);

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
          setDataFetched(true);
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
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching user data for visibility check:', error);
        setDataFetched(true);
      }
    };

    fetchUserData();
  }, [rule]);

  useEffect(() => {
    if (!rule || !dataFetched) {
      return;
    }

    // Check authentication requirement
    if ((rule.requiresAuth === true || rule.loggedIn === true) && !userData.isAuthenticated) {
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
  }, [rule, userData, dataFetched]);

  // While data is being fetched, don't render anything to prevent flashing
  if (!dataFetched && rule && Object.keys(rule).length > 0) {
    return null;
  }

  // If visibility check fails, don't render the children
  if (!isVisible) {
    return null;
  }
  
  // If visibility check passes, render the children
  return <>{children}</>;
};