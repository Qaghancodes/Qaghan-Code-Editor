import { App } from './App';

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  
  // Handle window resize events
  window.addEventListener('resize', () => {
    app.handleResize();
  });

  // Handle keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          app.saveCurrentFile();
          break;
        case 'o':
          event.preventDefault();
          app.openFile();
          break;
        case 'b':
          event.preventDefault();
          app.toggleSidebar();
          break;
      }
    }
  });
}); 