// Inlined before the hero (Hero.astro). Each scene ([data-steps]) holds its finished height from the moment it is
// drawn: a one-line call right after each scene reserves it, so nothing on the page changes size later, even while
// the browser is still drawing the rest or restoring the scroll position on reload (scripts/story.ts plays them).
// Scenes that share a parent (the hero's tabs) hold the tallest one's height.
(function () {
  // Batched so the browser lays the page out once per call, however many scenes it measures: every scene takes its
  // finished state, all are read together, then all go back and take their reserved height.
  function reserve(root) {
    var scenes = Array.prototype.slice.call(root.querySelectorAll('[data-steps]'));
    if (!scenes.length) return;
    var saved = scenes.map(function (sv) {
      var typer = sv.querySelector('[data-type]');
      var state = { hidden: sv.hidden, className: sv.className, typer: typer, typed: typer ? typer.textContent : '' };
      sv.style.minHeight = '';
      sv.hidden = false;
      sv.classList.add('measuring');
      for (var k = 1; k <= Number(sv.dataset.steps || 0); k++) sv.classList.add('s' + k);
      if (typer) typer.textContent = typer.dataset.type || '';
      return state;
    });
    var heights = scenes.map(function (sv) { return parseFloat(getComputedStyle(sv).height) || 0; });
    // Scenes that share a parent (the hero's tabs) hold the tallest one's height.
    var tallest = new Map();
    scenes.forEach(function (sv, i) {
      tallest.set(sv.parentElement, Math.max(tallest.get(sv.parentElement) || 0, heights[i]));
    });
    scenes.forEach(function (sv, i) {
      var state = saved[i];
      sv.className = state.className + ' measuring';
      if (state.typer) state.typer.textContent = state.typed;
      sv.hidden = state.hidden;
      sv.style.minHeight = Math.ceil(tallest.get(sv.parentElement)) + 'px';
    });
    // Settle styles in the current state before transitions return, so nothing animates back (no layout needed).
    scenes.forEach(function (sv) { void getComputedStyle(sv).opacity; });
    scenes.forEach(function (sv) { sv.classList.remove('measuring'); });
  }
  window.bleibReserve = reserve;
  document.fonts.ready.then(function () { reserve(document); });
  var width = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    reserve(document);
  }, { passive: true });
})();
