(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Pagination = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /**
   * Builds the prev/numbered/next button descriptors for the drill-through
   * pagination row. Returns [] when there is only one page (AC13).
   */
  function computePageButtons(currentPage, totalPages) {
    if (totalPages <= 1) return [];
    const buttons = [{ label: '←', page: currentPage - 1, disabled: currentPage === 1, isActive: false }];
    for (let p = 1; p <= totalPages; p++) {
      buttons.push({ label: String(p), page: p, disabled: false, isActive: p === currentPage });
    }
    buttons.push({ label: '→', page: currentPage + 1, disabled: currentPage === totalPages, isActive: false });
    return buttons;
  }

  return { computePageButtons };
});
