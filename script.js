// Burger menu toggle
document.addEventListener('DOMContentLoaded', function () {
  const burgerMenu = document.querySelector('.burger-menu');
  const nav = document.querySelector('.nav');
  const body = document.body;

  if (burgerMenu && nav) {
    function toggleMenu() {
      burgerMenu.classList.toggle('active');
      nav.classList.toggle('active');
      body.classList.toggle('menu-open');
    }

    burgerMenu.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking on a menu item
    const menuItems = document.querySelectorAll('.nav .menu-item, .nav .button');
    menuItems.forEach(item => {
      item.addEventListener('click', function () {
        burgerMenu.classList.remove('active');
        nav.classList.remove('active');
        body.classList.remove('menu-open');
      });
    });

    // Close menu when clicking on overlay
    body.addEventListener('click', function (event) {
      if (body.classList.contains('menu-open')) {
        const isClickInsideNav = nav.contains(event.target);
        const isClickOnBurger = burgerMenu.contains(event.target);

        if (!isClickInsideNav && !isClickOnBurger) {
          burgerMenu.classList.remove('active');
          nav.classList.remove('active');
          body.classList.remove('menu-open');
        }
      }
    });
  }
});