(function () {
  var containers = document.querySelectorAll('.scroll-moving-container');
  if (!containers.length) return;

  var ticking = false;
  var factor = -0.25;

  function update() {
    var viewportCenter = window.innerHeight / 2;
    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      var img = container.querySelector('img');
      if (!img) continue;
      var rect = container.getBoundingClientRect();
      var containerCenter = rect.top + rect.height / 2;
      var offset = (containerCenter - viewportCenter) * factor;
      img.style.transform = 'translateY(' + offset + 'px)';
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
