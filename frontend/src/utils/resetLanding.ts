// Utility function to reset the landing page for testing
export const resetLandingPage = () => {
  localStorage.removeItem('melodai-visited');
  console.log('Landing page reset! Refreshing...');
  window.location.reload();
};

// Utility to check landing status
export const checkLandingStatus = () => {
  const hasVisited = localStorage.getItem('melodai-visited');
  console.log('Landing page visited:', hasVisited ? 'Yes' : 'No');
  return !hasVisited;
};

// Add to window for easy access in dev tools
if (typeof window !== 'undefined') {
  (window as any).resetLandingPage = resetLandingPage;
  (window as any).checkLandingStatus = checkLandingStatus;
  console.log('Dev tools available: resetLandingPage(), checkLandingStatus()');
}