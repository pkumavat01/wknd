  import { getMetadata } from '../../scripts/aem.js';
  import { loadFragment } from '../fragment/fragment.js';

  const redirectMap = {
    '/search': 'https://www.google.com',
  };

  const target = redirectMap[window.location.pathname];
  if (target) {
    window.location.href = target;
  }

  // media query match that indicates mobile/tablet width
  const isDesktop = window.matchMedia('(min-width: 900px)');

  // Scroll-based shrink effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('nav-scrolled');
    } else {
      header.classList.remove('nav-scrolled');
    }
  });

  function closeOnEscape(e) {
    if (e.code === 'Escape') {
      const nav = document.getElementById('nav');
      const navSections = nav.querySelector('.nav-sections');
      const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
      if (navSectionExpanded && isDesktop.matches) {
        // eslint-disable-next-line no-use-before-define
        toggleAllNavSections(navSections);
        navSectionExpanded.focus();
      } else if (!isDesktop.matches) {
        // eslint-disable-next-line no-use-before-define
        toggleMenu(nav, navSections);
        nav.querySelector('button').focus();
      }
    }
  }

  function closeOnFocusLost(e) {
    const nav = e.currentTarget;
    if (!nav.contains(e.relatedTarget)) {
      const navSections = nav.querySelector('.nav-sections');
      const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
      if (navSectionExpanded && isDesktop.matches) {
        // eslint-disable-next-line no-use-before-define
        toggleAllNavSections(navSections, false);
      } else if (!isDesktop.matches) {
        // eslint-disable-next-line no-use-before-define
        toggleMenu(nav, navSections, false);
      }
    }
  }

  function openOnKeydown(e) {
    const focused = document.activeElement;
    const isNavDrop = focused.className === 'nav-drop';
    if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
      const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(focused.closest('.nav-sections'));
      focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
    }
  }

  function focusNavSection() {
    document.activeElement.addEventListener('keydown', openOnKeydown);
  }

  /**
   * Toggles all nav sections
   * @param {Element} sections The container element
   * @param {Boolean} expanded Whether the element should be expanded or collapsed
   */
  function toggleAllNavSections(sections, expanded = false) {
    sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
  }

  /**
   * Toggles the entire nav
   * @param {Element} nav The container element
   * @param {Element} navSections The nav sections within the container element
   * @param {*} forceExpanded Optional param to force nav expand behavior when not null
   */
  function toggleMenu(nav, navSections, forceExpanded = null) {
    console.log("click")
    const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
    const button = nav.querySelector('.nav-hamburger button');
    document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    // enable nav dropdown keyboard accessibility
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }

    // enable menu collapse on escape keypress
    if (!expanded || isDesktop.matches) {
      // collapse menu on escape press
      window.addEventListener('keydown', closeOnEscape);
      // collapse menu on focus lost
      nav.addEventListener('focusout', closeOnFocusLost);
    } else {
      window.removeEventListener('keydown', closeOnEscape);
      nav.removeEventListener('focusout', closeOnFocusLost);
    }
  }

  /**
   * loads and decorates the header, mainly the nav
   * @param {Element} block The header block element
   */
  export default async function decorate(block) {
    // load nav as fragment
    const navMeta = getMetadata('nav');
    const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
    const fragment = await loadFragment(navPath);

    // decorate nav DOM
    block.textContent = '';
    const nav = document.createElement('nav');
    nav.id = 'nav';
    while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navBrand = nav.querySelector('.nav-brand');
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"><span></span></span>
    </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);

    const navTools = document.querySelector('.nav-tools .default-content-wrapper');
    if (navTools) {
      const searchPara = navTools.querySelector('p');
      if (searchPara) {
        searchPara.remove();

        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'nav-search-wrapper';

        const searchIcon = document.createElement('img');
        searchIcon.src = '/icons/search.svg';
        searchIcon.alt = 'Search icon';
        searchIcon.className = 'nav-search-icon';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'SEARCH';
        searchInput.className = 'nav-search-input';
        searchInput.setAttribute('aria-label', 'Search site');

        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
              window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }
          }
        });

        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);

        navTools.appendChild(searchWrapper);
      }
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    
    function toggleMobileNav(open) {
      if (open) {
        document.body.classList.add('nav-open');
      } else {
        document.body.classList.remove('nav-open');
      }
    }

    overlay.addEventListener('click', () => {
      nav.setAttribute('aria-expanded', 'false');
      toggleAllNavSections(navSections, false);
      toggleMobileNav(false);
    });

    // Highlight active page nav link
    const currentPath = window.location.pathname.replace(/\/$/, ''); 
    const navLinks = nav.querySelectorAll('.nav-sections a');

    navLinks.forEach((link) => {
      const linkPath = new URL(link.href).pathname.replace(/\/$/, '');
      if (linkPath === currentPath) {
        const li = link.closest('li');
        if (li) {
          li.classList.add('active-page');
        }
      }
    });
  }
