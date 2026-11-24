// Inlined right after the closer (Finale.astro), the last scene, so it runs before the page first appears.
// Each scene ([data-steps]) holds its finished height from the start, so nothing moves while it plays
// (scripts/story.ts plays them). Scenes that share a parent (the hero's tabs) hold the tallest one's height.
(function () {
  function finalHeight(sv) {
    var hidden = sv.hidden, className = sv.className, typer = sv.querySelector('[data-type]');
    var typed = typer ? typer.textContent : '';
    sv.hidden = false;
    sv.classList.add('measuring');
    for (var k = 1; k <= Number(sv.dataset.steps || 0); k++) sv.classList.add('s' + k);
    if (typer) typer.textContent = typer.dataset.type || '';
    var height = parseFloat(getComputedStyle(sv).height) || 0;
    sv.className = className + ' measuring';
    if (typer) typer.textContent = typed;
    sv.hidden = hidden;
    void sv.offsetHeight; // settle the current state before transitions return, so nothing animates back
    sv.classList.remove('measuring');
    return height;
  }
  function reserve() {
    var groups = new Map();
    document.querySelectorAll('[data-steps]').forEach(function (sv) {
      groups.set(sv.parentElement, (groups.get(sv.parentElement) || []).concat(sv));
    });
    groups.forEach(function (scenes) {
      scenes.forEach(function (sv) { sv.style.minHeight = ''; });
      var height = Math.ceil(Math.max.apply(null, scenes.map(finalHeight))) + 'px';
      scenes.forEach(function (sv) { sv.style.minHeight = height; });
    });
  }
  reserve();
  document.fonts.ready.then(reserve);
  var width = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    reserve();
  }, { passive: true });
})();
