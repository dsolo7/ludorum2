export function isBlockVisible(block: any, user: any) {
  const visibility = block.visibility_rules || {};

  // Role-based filtering
  if (visibility.roles && !visibility.roles.includes(user?.role)) return false;

  // Token gating
  if (visibility.minTokens && user?.tokens < visibility.minTokens) return false;

  // Device-type filtering
  if (visibility.device === 'mobile' && !isMobile()) return false;
  if (visibility.device === 'desktop' && isMobile()) return false;

  // Authentication requirement
  if (visibility.requiresAuth && !user?.isAuthenticated) return false;

  // Check if user has used a specific analyzer
  if (visibility.hasUsedAnalyzer && 
      (!user?.usedAnalyzers || !user.usedAnalyzers.includes(visibility.hasUsedAnalyzer))) {
    return false;
  }

  // Check if user has joined a specific contest
  if (visibility.joinedContest && 
      (!user?.joinedContests || !user.joinedContests.includes(visibility.joinedContest))) {
    return false;
  }

  // Check if user has joined any contest
  if (visibility.hasJoinedAnyContest && 
      (!user?.joinedContests || user.joinedContests.length === 0)) {
    return false;
  }

  // Check if user has used any analyzer
  if (visibility.hasUsedAnyAnalyzer && 
      (!user?.usedAnalyzers || user.usedAnalyzers.length === 0)) {
    return false;
  }

  return true;
}

export function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

// Enhanced version that returns reason for visibility failure (useful for debugging)
export function checkBlockVisibility(block: any, user: any): { visible: boolean; reason?: string } {
  const visibility = block.visibility_rules || {};

  // Role-based filtering
  if (visibility.roles && !visibility.roles.includes(user?.role)) {
    return { visible: false, reason: 'role' };
  }

  // Token gating
  if (visibility.minTokens && user?.tokens < visibility.minTokens) {
    return { visible: false, reason: 'insufficient_tokens' };
  }

  // Device-type filtering
  if (visibility.device === 'mobile' && !isMobile()) {
    return { visible: false, reason: 'device_desktop_only' };
  }
  if (visibility.device === 'desktop' && isMobile()) {
    return { visible: false, reason: 'device_mobile_only' };
  }

  // Authentication requirement
  if (visibility.requiresAuth && !user?.isAuthenticated) {
    return { visible: false, reason: 'authentication_required' };
  }

  // Check if user has used a specific analyzer
  if (visibility.hasUsedAnalyzer && 
      (!user?.usedAnalyzers || !user.usedAnalyzers.includes(visibility.hasUsedAnalyzer))) {
    return { visible: false, reason: 'analyzer_usage_required' };
  }

  // Check if user has joined a specific contest
  if (visibility.joinedContest && 
      (!user?.joinedContests || !user.joinedContests.includes(visibility.joinedContest))) {
    return { visible: false, reason: 'contest_participation_required' };
  }

  // Check if user has joined any contest
  if (visibility.hasJoinedAnyContest && 
      (!user?.joinedContests || user.joinedContests.length === 0)) {
    return { visible: false, reason: 'any_contest_participation_required' };
  }

  // Check if user has used any analyzer
  if (visibility.hasUsedAnyAnalyzer && 
      (!user?.usedAnalyzers || user.usedAnalyzers.length === 0)) {
    return { visible: false, reason: 'any_analyzer_usage_required' };
  }

  return { visible: true };
}