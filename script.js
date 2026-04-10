/* ========================================
   HOMEHIVE - JAVASCRIPT
   Interactive UI Features
   ======================================== */

// Live Data from Backend API
let rentalListings = [];

// ========================================
// 1. INITIALIZE PAGE
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
    // Load initial listings from Neo4j Backend via API
    if (document.getElementById('listingsGrid')) {
        try {
            const data = await api.get('/properties');
            rentalListings = data.properties || [];
            renderListings(rentalListings);
        } catch(e) {
            console.error("Backend unreachable", e);
            document.getElementById('listingsGrid').innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Unable to connect to database API.</p>';
        }
    }

    // Initialize theme - default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
    }
    updateThemeButtonText();

    // Add event listener for search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
});

// ========================================
// 2. RENDER LISTINGS
// ========================================

function renderListings(listings) {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;

    if (listings.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><p>No listings found. Try adjusting your filters.</p></div>';
        return;
    }

    grid.innerHTML = listings.map(listing => `
        <article class="listing-card">
            <div class="listing-image">
                <span class="listing-badge">${listing.type}</span>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <div>
                        <h3 class="listing-name">${listing.name}</h3>
                        <span class="listing-type">${listing.type}</span>
                    </div>
                    <div class="listing-rating" onclick="openRoomReviewsModal('${listing.id}', '${listing.name.replace(/'/g, "\\'")}')" style="cursor:pointer; transition:0.2s;" title="Click to view & add reviews">⭐ ${listing.rating || '4.5'}</div>
                </div>
                
                <div class="listing-price">
                    ₹${listing.price.toLocaleString()}
                    <div class="listing-price-month">/month</div>
                </div>

                <div class="listing-details">
                    <div class="detail-item">
                        <span>🍽️</span>
                        <span>Food: <strong>${listing.foodAvailable || 'No'}</strong></span>
                    </div>
                    <div class="detail-item">
                        <span>⏰</span>
                        <span>Timings: <strong>${listing.timings || 'Standard'}</strong></span>
                    </div>
                </div>

                <div class="listing-footer">
                    <div class="listing-location">
                        📍 ${listing.location}
                    </div>
                    <button class="view-details-btn" onclick="window.viewDetails('${listing.id}')">
                        View Details →
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

// ========================================
// 3. FILTER FUNCTIONALITY
// ========================================

let currentFilters = {
    propertyTypes: [],
    priceMax: null,
    foodAvailability: null,
    searchText: ''
};

function toggleFilterMenu() {
    const menu = document.getElementById('filterMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function applyFilters() {
    // Get selected property types
    const propertyCheckboxes = document.querySelectorAll('.property-filter:checked');
    currentFilters.propertyTypes = Array.from(propertyCheckboxes).map(cb => cb.value);

    // Get price range
    const priceFilter = document.getElementById('priceFilter');
    currentFilters.priceMax = priceFilter ? parseInt(priceFilter.value) || null : null;

    // Get food availability
    const foodYes = document.getElementById('foodYes');
    const foodNo = document.getElementById('foodNo');
    if (foodYes && foodYes.checked) {
        currentFilters.foodAvailability = 'Yes';
    } else if (foodNo && foodNo.checked) {
        currentFilters.foodAvailability = 'No';
    } else {
        currentFilters.foodAvailability = null;
    }

    // Filter listings
    filterListings();

    // Close filter menu
    const menu = document.getElementById('filterMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

function resetFilters() {
    // Reset filter state
    currentFilters = {
        propertyTypes: [],
        priceMax: null,
        foodAvailability: null,
        searchText: ''
    };

    // Uncheck all checkboxes
    document.querySelectorAll('.property-filter, #foodYes, #foodNo').forEach(cb => cb.checked = false);
    
    // Reset price filter
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) priceFilter.value = '';

    // Reset search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    // Fetch clean slate from backend
    filterListings();

    // Close filter menu
    const menu = document.getElementById('filterMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

async function filterListings() {
    try {
        const query = new URLSearchParams();
        
        // Push filter criteria intelligently to backend logic
        if (currentFilters.propertyTypes.length > 0) {
            currentFilters.propertyTypes.forEach(t => query.append('type', t));
        }
        if (currentFilters.priceMax) query.append('maxPrice', currentFilters.priceMax);
        if (currentFilters.foodAvailability) query.append('foodAvailable', currentFilters.foodAvailability);
        if (currentFilters.searchText) query.append('searchInput', currentFilters.searchText);

        // Await the graph database to filter instead of the frontend
        const data = await api.get(`/properties?${query.toString()}`);
        rentalListings = data.properties || [];
        renderListings(rentalListings);
    } catch(e) {
        console.error("Filter request failed", e);
    }
}

// ========================================
// 4. SEARCH FUNCTIONALITY
// ========================================

function handleSearch(e) {
    currentFilters.searchText = e.target.value;
    filterListings();
}

// Debounce function for search
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ========================================
// 5. VIEW DETAILS
// ========================================

window.viewDetails = function(listingId) {
    const listing = rentalListings.find(l => String(l.id) === String(listingId));
    if (!listing) return;

    // Grab modal components
    const modal = document.getElementById('propertyModal');
    if (!modal) return; // Fail safe if not on index.html

    // Paint text data
    document.getElementById('modalTitle').innerText = listing.name;
    document.getElementById('modalLocation').innerText = `📍 ${listing.location}`;
    document.getElementById('modalType').innerText = listing.type;
    document.getElementById('modalPrice').innerText = `₹${listing.price.toLocaleString()} / month`;
    document.getElementById('modalFood').innerText = listing.foodAvailable || 'No';
    document.getElementById('modalTimings').innerText = listing.timings || 'Standard Hours';

    // Inject live Map component
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.innerHTML = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=${encodeURIComponent(listing.location)}&output=embed"></iframe>`;

    // Make modal visible
    modal.classList.remove('hidden');
}

// ========================================
// 6. THEME TOGGLE (Dark/Light Mode)
// ========================================

function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark-mode');

    // Save preference
    const isDark = html.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    updateThemeButtonText();
}

function updateThemeButtonText() {
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        const isDark = document.documentElement.classList.contains('dark-mode');
        btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

// ========================================
// 7. CONTACT FORM HANDLING
// ========================================

function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    // Validate form
    if (!name || !email || !phone || !subject || !message) {
        showFormMessage('Please fill in all fields', false);
        return;
    }

    // Validate email
    if (!isValidEmail(email)) {
        showFormMessage('Please enter a valid email address', false);
        return;
    }

    // Simulate form submission
    console.log('Form submitted:', { name, email, phone, subject, message });
    
    // Show success message
    showFormMessage('✓ Thank you! Your message has been sent successfully. We will contact you soon.', true);

    // Reset form
    e.target.reset();
}

function showFormMessage(message, isSuccess) {
    const messageEl = document.getElementById('formMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `form-message ${isSuccess ? 'success' : 'error'}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'form-message';
        }, 5000);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========================================
// 8. REVIEW FORM - STAR RATING
// ========================================

let currentRating = 0;

function setRating(rating) {
    currentRating = rating;
    document.getElementById('reviewRating').value = rating;

    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Add event listeners to stars for hover effect
document.addEventListener('DOMContentLoaded', function () {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', function () {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.style.opacity = '1';
                } else {
                    s.style.opacity = '0.5';
                }
            });
        });
    });

    const starContainer = document.querySelector('.star-rating');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', function () {
            stars.forEach((star, index) => {
                if (index < currentRating) {
                    star.style.opacity = '1';
                    star.classList.add('active');
                } else {
                    star.style.opacity = '0.5';
                    star.classList.remove('active');
                }
            });
        });
    }
});

// ========================================
// 9. SMOOTH SCROLL
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// 10. UTILITY FUNCTIONS
// ========================================

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Log app initialization
console.log('🏠 HomeHive App Initialized Successfully!');
