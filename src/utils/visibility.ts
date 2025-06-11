export function isBlockVisible(rules, user) {
  if (!rules) return true;
  if (rules.role && user?.role !== rules.role) return false;
  if (rules.min_tokens && user?.token_balance < rules.min_tokens) return false;
  if (rules.mobile_only && window.innerWidth > 768) return false;
  return true;
}

// Additional helper functions for device detection
export function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth > 768;
}

// Enhanced version with more comprehensive rule checking
export function checkVisibility(rules, userData) {
  // If no rules, always show
  if (!rules || Object.keys(rules).length === 0) return true;
  
  // Check authentication requirement
  if (rules.requiresAuth && !userData?.isAuthenticated) return false;
  
  // Check role-based access
  if (rules.roles && !rules.roles.includes(userData?.role)) return false;
  
  // Check token requirements
  if (rules.minTokens && userData?.tokenBalance < rules.minTokens) return false;
  
  // Check device type
  if (rules.device === 'mobile' && !isMobile()) return false;
  if (rules.device === 'desktop' && isMobile()) return false;
  
  // Check analyzer usage
  if (rules.hasUsedAnalyzer && 
      (!userData?.usedAnalyzers || !userData.usedAnalyzers.includes(rules.hasUsedAnalyzer))) {
    return false;
  }
  
  // Check contest participation
  if (rules.joinedContest && 
      (!userData?.joinedContests || !userData.joinedContests.includes(rules.joinedContest))) {
    return false;
  }
  
  // Check if user has joined any contest
  if (rules.hasJoinedAnyContest && 
      (!userData?.joinedContests || userData.joinedContests.length === 0)) {
    return false;
  }
  
  // Check if user has used any analyzer
  if (rules.hasUsedAnyAnalyzer && 
      (!userData?.usedAnalyzers || userData.usedAnalyzers.length === 0)) {
    return false;
  }
  
  // All checks passed
  return true;
}