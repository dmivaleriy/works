(function () {
  // ----------------------------
  // Link tail helper (SVG + last word)
  // ----------------------------
  (function () {
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var PATH_D = 'M0.00114188 67.9897L52.931 15.0325L12.8653 15.3773L12.9343 -0.000716122L78.1702 -0.000686451L78.1702 65.2352L62.7922 65.3042L63.137 25.1006L10.1382 78.1267L0.00114188 67.9897Z';

    function createIconSvg() {
      var svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('width', '79');
      svg.setAttribute('height', '79');
      svg.setAttribute('viewBox', '0 0 79 79');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('xmlns', SVG_NS);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.classList.add('link-tail-icon');

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', PATH_D);
      path.setAttribute('fill', 'currentColor'); // inherits link text color
      svg.appendChild(path);
      return svg;
    }

    function splitLastWord(text) {
      var t = (text || '').trim();
      if (!t) return null;
      var parts = t.split(/\s+/);
      if (parts.length < 2) return null;
      var last = parts.pop();
      return { head: parts.join(' '), last: last };
    }

    function applyToLink(a) {
      if (!a || a.nodeType !== 1) return;
      if (a.dataset && a.dataset.linkTailApplied === 'true') return;

      // Safe mode: only transform plain-text links (no child elements).
      for (var i = 0; i < a.childNodes.length; i++) {
        if (a.childNodes[i].nodeType === 1) return;
      }

      var res = splitLastWord(a.textContent);
      if (!res) return;

      a.textContent = res.head;
      a.appendChild(document.createTextNode(' '));

      var tail = document.createElement('span');
      tail.className = 'link-tail';
      tail.appendChild(createIconSvg());
      tail.appendChild(document.createTextNode(' ' + res.last));
      a.appendChild(tail);

      if (a.dataset) a.dataset.linkTailApplied = 'true';
    }

    function apply(selector) {
      var sel = selector || '[data-link-tail]';
      var links = document.querySelectorAll(sel);
      for (var i = 0; i < links.length; i++) applyToLink(links[i]);
    }

    window.LinkTailIcon = {
      createIconSvg: createIconSvg,
      applyToLink: applyToLink,
      apply: apply,
    };

    // Auto-apply only to links explicitly marked in HTML.
    if (document.querySelector('[data-link-tail]')) apply('[data-link-tail]');
  })();

  // ----------------------------
  // Parallax "scroll-moving" feature
  // ----------------------------
  var containers = document.querySelectorAll('.scroll-moving-container');
  if (!containers.length) return;

  var ticking = false;
  var factor = 0.25;

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
