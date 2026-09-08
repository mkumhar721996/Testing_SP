(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ChartLayout = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /** Largest value in a series, never less than 1 (avoids divide-by-zero when scaling bars). */
  function maxOf(values) {
    return Math.max(1, values.reduce((m, v) => Math.max(m, v), 0));
  }

  /** Bar height in px, scaled against max, with a minimum so a zero count still renders a visible placeholder. */
  function barHeightPx(count, max, maxPx, minPx = 2) {
    const safeMax = max > 0 ? max : 1;
    return Math.max(minPx, Math.round((count / safeMax) * maxPx));
  }

  /** Trend/status bars are disabled only when their count is exactly zero. */
  function shouldDisable(count) {
    return count === 0;
  }

  return { maxOf, barHeightPx, shouldDisable };
});
