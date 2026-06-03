document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.site-header');
  const burger = document.querySelector('.header-burger');
  const nav = document.getElementById('header-nav');

  if (!header || !burger || !nav) return;

  burger.addEventListener('click', function () {
    const isOpen = header.classList.toggle('site-header--menu-open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  nav.querySelectorAll('.header-link').forEach(function (link) {
    link.addEventListener('click', function () {
      header.classList.remove('site-header--menu-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
});
