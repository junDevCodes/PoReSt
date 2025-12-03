document.addEventListener('DOMContentLoaded', () => {
  
  /* --- Tab Switching Logic --- */
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      // 1. Update Buttons
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 2. Update Content Panes
      tabPanes.forEach(pane => {
        if (pane.id === targetTabId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  /* --- Modal Logic --- */
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContents = document.querySelectorAll('.modal-content');

  // Open Modal Function (Expose to global scope for HTML onclick attributes)
  window.openModal = (projectId) => {
    const targetModal = document.getElementById(projectId);
    if (targetModal) {
      modalOverlay.classList.add('active');
      // Hide all other modals first just in case
      modalContents.forEach(m => m.classList.remove('active'));
      // Show target
      targetModal.classList.add('active');
    }
  };

  // Close Modal Function
  window.closeModal = () => {
    modalOverlay.classList.remove('active');
    modalContents.forEach(m => m.classList.remove('active'));
  };

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeModal();
    }
  });

});
