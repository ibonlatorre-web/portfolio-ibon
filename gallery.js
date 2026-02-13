/* =============================================================
   GALLERY ENGINE — Scalable Photography Portfolio System
   ============================================================= */

// ─── STATE ────────────────────────────────────────────────────
const state = {
    all: [],
    filtered: [],
    category: 'all',
    sport: 'all',
    year: 'all',
    month: 'all',
    search: '',
    lbIndex: 0,
    page: 1,
    perPage: 30,
    loaded: false
};

const MONTHS_ES = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
};

// ─── DOM REFS ─────────────────────────────────────────────────
const photoGrid = document.getElementById('photo-grid');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('gallery-search');
const sportFilter = document.getElementById('sport-filter');
const sportFilterGroup = document.getElementById('sport-filter-group');
const yearFilter = document.getElementById('year-filter');
const monthFilter = document.getElementById('month-filter');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreContainer = document.getElementById('load-more-container');

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbMeta = document.getElementById('lb-meta');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');

// ─── LOAD DATA ────────────────────────────────────────────────
async function loadPhotosData() {
    try {
        const response = await fetch('photos-data.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar photos-data.json');
        }
        const data = await response.json();
        state.all = data;
        state.filtered = data;
        state.loaded = true;
        return data;
    } catch (error) {
        console.error('Error cargando fotos:', error);
        photoGrid.innerHTML = '<div class="no-results">Error al cargar las fotos. Verifica que photos-data.json exista.</div>';
        return [];
    }
}

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
    // Mostrar loading
    photoGrid.innerHTML = '<div class="no-results">Cargando fotos...</div>';
    
    // Cargar datos
    const photos = await loadPhotosData();
    
    if (photos.length > 0) {
        populateFilters();
        attachEventListeners();
        applyFilters();
    }
}

// ─── POPULATE FILTERS ─────────────────────────────────────────
function populateFilters() {
    // Years
    const years = [...new Set(state.all.map(p => p.year))].sort().reverse();
    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearFilter.appendChild(opt);
    });

    // Months
    Object.keys(MONTHS_ES).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = MONTHS_ES[m];
        monthFilter.appendChild(opt);
    });

    // Sports (only if category=deportiva)
    const sports = [...new Set(state.all.filter(p => p.category === 'deportiva').map(p => p.sport))].filter(s => s).sort();
    sports.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        sportFilter.appendChild(opt);
    });
}

// ─── EVENT LISTENERS ──────────────────────────────────────────
function attachEventListeners() {
    // Category nav
    document.querySelectorAll('.gallery-nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const cat = e.target.dataset.category;
            state.category = cat;
            state.sport = 'all';
            state.page = 1;

            document.querySelectorAll('.gallery-nav-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');

            // Show/hide sport filter
            sportFilterGroup.style.display = cat === 'deportiva' ? 'block' : 'none';
            sportFilter.value = 'all';

            applyFilters();
        });
    });

    // Search
    searchInput.addEventListener('input', e => {
        state.search = e.target.value.toLowerCase();
        state.page = 1;
        applyFilters();
    });

    // Filters
    sportFilter.addEventListener('change', e => {
        state.sport = e.target.value;
        state.page = 1;
        applyFilters();
    });

    yearFilter.addEventListener('change', e => {
        state.year = e.target.value;
        state.page = 1;
        applyFilters();
    });

    monthFilter.addEventListener('change', e => {
        state.month = e.target.value;
        state.page = 1;
        applyFilters();
    });

    // Load More
    loadMoreBtn.addEventListener('click', () => {
        state.page++;
        renderGallery(true);
    });

    // Lightbox
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => navLightbox(-1));
    lbNext.addEventListener('click', () => navLightbox(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navLightbox(-1);
        if (e.key === 'ArrowRight') navLightbox(1);
    });

    // Touch Support for Swiping
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) navLightbox(1); // Swipe Left
        if (touchEndX > touchStartX + threshold) navLightbox(-1); // Swipe Right
    }
}

// ─── FILTERS ──────────────────────────────────────────────────
function applyFilters() {
    let filtered = state.all;

    // Category
    if (state.category !== 'all') {
        filtered = filtered.filter(p => p.category === state.category);
    }

    // Sport
    if (state.sport !== 'all') {
        filtered = filtered.filter(p => p.sport === state.sport);
    }

    // Year
    if (state.year !== 'all') {
        filtered = filtered.filter(p => p.year === state.year);
    }

    // Month
    if (state.month !== 'all') {
        filtered = filtered.filter(p => p.month === state.month);
    }

    // Search
    if (state.search) {
        filtered = filtered.filter(p => {
            const searchable = `${p.title} ${p.event || ''} ${p.sport || ''}`.toLowerCase();
            return searchable.includes(state.search);
        });
    }

    state.filtered = filtered;
    state.page = 1;
    renderGallery(false);
}

// ─── RENDER ───────────────────────────────────────────────────
function renderGallery(append = false) {
    const toShow = state.filtered.slice(0, state.page * state.perPage);

    if (!append) {
        photoGrid.innerHTML = '';
    }

    // If no results
    if (toShow.length === 0) {
        photoGrid.innerHTML = '<div class="no-results">No se encontraron fotos con esos filtros.</div>';
        resultsCount.textContent = '';
        loadMoreContainer.style.display = 'none';
        return;
    }

    // Render photos
    const start = append ? (state.page - 1) * state.perPage : 0;
    const batch = toShow.slice(start);

    batch.forEach((photo, idx) => {
        const globalIdx = start + idx;
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `
            <img src="${photo.thumb}" alt="${photo.title}" loading="lazy">
            <div class="photo-overlay">
                <span class="po-date">${formatDate(photo)}</span>
            </div>
        `;
        item.addEventListener('click', () => openLightbox(globalIdx));
        photoGrid.appendChild(item);
    });

    // Results count
    resultsCount.textContent = `${toShow.length} foto${toShow.length !== 1 ? 's' : ''}`;

    // Load More button
    if (toShow.length < state.filtered.length) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

// ─── LIGHTBOX ─────────────────────────────────────────────────
function openLightbox(index) {
    state.lbIndex = index;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

function navLightbox(dir) {
    let next = state.lbIndex + dir;
    if (next < 0) next = state.filtered.length - 1;
    if (next >= state.filtered.length) next = 0;
    state.lbIndex = next;
    updateLightbox();
}

function updateLightbox() {
    const photo = state.filtered[state.lbIndex];
    lbImg.src = photo.src;

    const cat = photo.category === 'deportiva' ? `Deportiva — ${photo.sport}` : 'General';
    lbMeta.textContent = `${formatDate(photo)}  ·  ${cat}`;

    // Preload next
    const nextIdx = (state.lbIndex + 1) % state.filtered.length;
    const preload = new Image();
    preload.src = state.filtered[nextIdx].src;
}

// ─── HELPERS ──────────────────────────────────────────────────
function formatDate(photo) {
    const m = parseInt(photo.month, 10);
    return `${photo.day} de ${MONTHS_ES[m]} ${photo.year}`;
}

// ─── START ────────────────────────────────────────────────────
init();
