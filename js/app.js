/**
 * Asharq Al Awsat Group — Interactive Engine
 * Handles Atmos-style boot loader, Theme Switcher (Night/Light), Touch Mode, and Project Inspector
 */

(function () {
  'use strict';

  // 1. Theme Engine (Night / Light Mode)
  const THEME_KEY = 'asharq_theme_preference';
  
  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update Logo Images based on theme
    document.querySelectorAll('.logo-img, .footer-logo-img').forEach(img => {
      if (theme === 'dark') {
        img.src = 'assets/logo_dark.png';
      } else {
        img.src = 'assets/logo_light.png';
      }
    });

    // Update Theme Switcher Button State
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      const mode = btn.getAttribute('data-theme-btn');
      if (mode === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Initialize Theme immediately
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  document.addEventListener('DOMContentLoaded', () => {
    // Re-apply theme to all DOM elements
    applyTheme(getPreferredTheme());

    // Bind Theme Switcher Buttons
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTheme = btn.getAttribute('data-theme-btn');
        applyTheme(targetTheme);
      });
    });

    // 2. Atmos-Inspired Boot Loader
    const bootLoader = document.getElementById('boot-loader');
    if (bootLoader) {
      const countEl = bootLoader.querySelector('.loader-count');
      const barEl = bootLoader.querySelector('.loader-bar');
      
      let progress = 0;
      const startTime = performance.now();
      const duration = 1200; // 1.2s smooth loader curve

      function updateLoader(currentTime) {
        const elapsed = currentTime - startTime;
        const factor = Math.min(elapsed / duration, 1);
        
        // Cubic out curve
        const easeOut = 1 - Math.pow(1 - factor, 3);
        progress = Math.round(easeOut * 100);

        if (countEl) countEl.textContent = String(progress).padStart(2, '0');
        if (barEl) barEl.style.transform = `scaleX(${progress / 100})`;

        if (factor < 1) {
          requestAnimationFrame(updateLoader);
        } else {
          setTimeout(() => {
            bootLoader.classList.add('loader-hidden');
            setTimeout(() => {
              bootLoader.remove();
            }, 800);
          }, 200);
        }
      }

      requestAnimationFrame(updateLoader);
    }

    // 3. Touch Mode / View Mode Switcher (on Real Estate page)
    const streamContainer = document.querySelector('.projects-stream');
    const touchModeBtn = document.querySelector('[data-view-mode="touch"]');
    const gridModeBtn = document.querySelector('[data-view-mode="grid"]');

    if (streamContainer && touchModeBtn && gridModeBtn) {
      touchModeBtn.addEventListener('click', () => {
        streamContainer.classList.add('touch-mode');
        touchModeBtn.classList.add('active');
        gridModeBtn.classList.remove('active');
      });

      gridModeBtn.addEventListener('click', () => {
        streamContainer.classList.remove('touch-mode');
        gridModeBtn.classList.add('active');
        touchModeBtn.classList.remove('active');
      });
    }

    // 4. Project Inspection Modal
    const modalBackdrop = document.getElementById('project-modal');
    if (modalBackdrop) {
      const modalTitle = modalBackdrop.querySelector('.modal-project-title');
      const modalLocation = modalBackdrop.querySelector('.modal-project-location');
      const modalPrice = modalBackdrop.querySelector('.modal-project-price');
      const modalDescription = modalBackdrop.querySelector('.modal-project-desc');
      const modalImage = modalBackdrop.querySelector('.modal-gallery-carousel img');
      const modalSpecsBody = modalBackdrop.querySelector('.modal-specs-table tbody');
      const modalWhatsApp = modalBackdrop.querySelector('.modal-whatsapp-link');
      const modalCall = modalBackdrop.querySelector('.modal-call-link');
      const modalClose = modalBackdrop.querySelector('.modal-close-btn');

      const projectData = {
        'palmares': {
          title: 'Résidence Palmares',
          location: 'Centre-Ville de Tanger, Maroc',
          price: 'À partir de 688 000 DH',
          description: 'Dans un environnement d’exception, se dresse majestueusement Palmares, un complexe résidentiel et tertiaire de luxe. Doté de vastes jardins verdoyants, de piscines sécurisées, de terrains de sport et d’un pôle scolaire complet, ce projet allie sérénité familiale et rentabilité patrimoniale.',
          image: 'assets/projects/palmares_hero.jpg',
          whatsapp: '212600907262',
          phone: '+212600907262',
          specs: [
            ['Typologies', 'Appartements, Bureaux, Commerces'],
            ['Surfaces Disponibles', 'De 40 m² à 155 m² (1 à 4 Chambres)'],
            ['Salles de Bain', '1 à 3 Salles de bain équipées'],
            ['Finitions', 'Moyen Standing ++ (Marbre, boiserie noble)'],
            ['Stationnement', 'Parking sous-terrain titré'],
            ['Commodités', 'Piscines, Terrain multisports, Crèche, Collège'],
            ['Déclaration Fiscale', 'Déclaration 100% garantie'],
            ['Financement', 'Eligible à tous les crédits bancaires']
          ]
        },
        'assalam': {
          title: 'Résidence Assalam',
          location: 'Tanger Côte Nord • Vue Panoramique sur Mer',
          price: 'À partir de 13 800 DH / m²',
          description: 'Dans un cadre exceptionnel face à l’azur méditerranéen, la Résidence Assalam incarne l’apogée du standing familial. Bénéficiant d’appartements baignés de soleil avec vue mer imprenable, d’une mosquée intégrée et d’un domaine entièrement clôturé et sécurisé.',
          image: 'assets/projects/assalam_hero.jpg',
          whatsapp: '212661103547',
          phone: '+212661103547',
          specs: [
            ['Typologies', 'Appartements de Prestige (Dernières Opportunités)'],
            ['Surfaces Disponibles', 'De 94 m² à 115 m² (2 à 3 Chambres)'],
            ['Salles de Bain', '1 à 2 Salles de bain haut standing'],
            ['Finitions', 'Haut Standing (Climatisation centrale, isolation)'] ,
            ['Stationnement', 'Sous-sol privé titré'],
            ['Équipements de Luxe', 'Piscines privatives, Mosquée, Espaces verts'],
            ['Déclaration Fiscale', 'Déclaration 100% garantie'],
            ['Ascenseurs', 'Ascenseurs rapides nouvelle génération']
          ]
        },
        'villas': {
          title: 'Les Villas Assalam (Mabrok)',
          location: 'Colline de Malabata, Tanger',
          price: '2 500 000 DH',
          description: 'Propriété d’exception sur la prestigieuse colline de Malabata. Ces somptueuses villas jumelées offrent un panorama spectaculaire sur la baie de Tanger, réparties sur 4 niveaux (sous-sol aménagé, 2 étages résidentiels et rooftop privatif avec vue mer).',
          image: 'assets/projects/villas_hero.jpg',
          whatsapp: '212600907262',
          phone: '+212600907262',
          specs: [
            ['Typologie', 'Villas Jumelées Contemporaines'],
            ['Surface Terrain', '300 m² de terrain privatif'],
            ['Surface Habitable', '360 m² (120 m² par niveau sur 3 niveaux + toit)'],
            ['Chambres & Suites', '3 à 4 Chambres dont Master Suite vue mer'],
            ['Salles de Bain', '4 Salles de bain marbrées'],
            ['Extérieurs', 'Jardin privatif, piscine, solarium'],
            ['Garage', 'Garage fermé privatif sécurisé'],
            ['Déclaration Fiscale', 'Déclaration 100%']
          ]
        }
      };

      document.querySelectorAll('[data-inspect]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-inspect');
          const data = projectData[key];
          if (!data) return;

          modalTitle.textContent = data.title;
          modalLocation.textContent = data.location;
          modalPrice.textContent = data.price;
          modalDescription.textContent = data.description;
          modalImage.src = data.image;

          modalWhatsApp.href = `https://wa.me/${data.whatsapp}?text=Bonjour,%20je%20souhaite%20recevoir%20des%20informations%20sur%20le%20projet%20${encodeURIComponent(data.title)}.`;
          modalCall.href = `tel:${data.phone}`;

          modalSpecsBody.innerHTML = '';
          data.specs.forEach(([label, val]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${label}</td><td>${val}</td>`;
            modalSpecsBody.appendChild(tr);
          });

          modalBackdrop.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
        });
      });

      function closeModal() {
        modalBackdrop.classList.remove('modal-open');
        document.body.style.overflow = '';
      }

      modalClose.addEventListener('click', closeModal);
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdrop.classList.contains('modal-open')) {
          closeModal();
        }
      });
    }

    // 5. Contact Form Simulation
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Envoi en cours...';
        submitBtn.disabled = true;

        setTimeout(() => {
          submitBtn.innerHTML = '✓ Message Envoyé avec Succès';
          submitBtn.style.background = '#2E7D32';
          submitBtn.style.color = '#fff';
          contactForm.reset();
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
          }, 3500);
        }, 1200);
      });
    }
  });
})();
