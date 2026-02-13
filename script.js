/* ========================================
   HOMEHIVE - JAVASCRIPT
   Interactive UI Features
   ======================================== */

// Sample Rental Listings Data
const rentalListings = [
    {
        id: 1,
        name: "Downtown Residency Flat",
        type: "Flat",
        price: 15000,
        food: "Yes",
        timings: "6 AM - 10 PM",
        location: "Downtown, Bangalore",
        rating: 4.8
    },
    {
        id: 2,
        name: "Tech Park PG",
        type: "PG",
        price: 8000,
        food: "Yes",
        timings: "Open 24/7",
        location: "Tech Park, Bangalore",
        rating: 4.6
    },
    {
        id: 3,
        name: "Skyline Penthouse Suite",
        type: "Penthouse",
        price: 45000,
        food: "No",
        timings: "6 AM - 11 PM",
        location: "MG Road, Bangalore",
        rating: 4.9
    },
    {
        id: 4,
        name: "Central Market Room",
        type: "Room",
        price: 5000,
        food: "No",
        timings: "7 AM - 9 PM",
        location: "Central Market, Bangalore",
        rating: 4.3
    },
    {
        id: 5,
        name: "Silicon Valley PG",
        type: "PG",
        price: 9500,
        food: "Yes",
        timings: "Open 24/7",
        location: "Indiranagar, Bangalore",
        rating: 4.7
    },
    {
        id: 6,
        name: "Suburban Family Flat",
        type: "Flat",
        price: 12000,
        food: "Yes",
        timings: "6 AM - 10 PM",
        location: "Whitefield, Bangalore",
        rating: 4.4
    },
    {
        id: 7,
        name: "Business District Room",
        type: "Room",
        price: 6500,
        food: "No",
        timings: "7 AM - 10 PM",
        location: "Business District, Bangalore",
        rating: 4.5
    },
    {
        id: 8,
        name: "Premium Penthouse Apartment",
        type: "Penthouse",
        price: 55000,
        food: "Yes",
        timings: "6 AM - 11 PM",
        location: "Koramangala, Bangalore",
        rating: 4.9
    }
];

// ========================================
// 1. INITIALIZE PAGE
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    // Load initial listings
    if (document.getElementById('listingsGrid')) {
        renderListings(rentalListings);
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
                    <div class="listing-rating">⭐ ${listing.rating}</div>
                </div>
                
                <div class="listing-price">
                    ₹${listing.price.toLocaleString()}
                    <div class="listing-price-month">/month</div>
                </div>

                <div class="listing-details">
                    <div class="detail-item">
                        <span>🍽️</span>
                        <span>Food: <strong>${listing.food}</strong></span>
                    </div>
                    <div class="detail-item">
                        <span>⏰</span>
                        <span>Timings: <strong>${listing.timings}</strong></span>
                    </div>
                </div>

                <div class="listing-footer">
                    <div class="listing-location">
                        📍 ${listing.location}
                    </div>
                    <button class="view-details-btn" onclick="viewDetails(${listing.id})">
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

    // Render all listings
    renderListings(rentalListings);

    // Close filter menu
    const menu = document.getElementById('filterMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

function filterListings() {
    let filtered = rentalListings.filter(listing => {
        // Filter by property type
        if (currentFilters.propertyTypes.length > 0) {
            if (!currentFilters.propertyTypes.includes(listing.type)) {
                return false;
            }
        }

        // Filter by price
        if (currentFilters.priceMax) {
            if (listing.price > currentFilters.priceMax) {
                return false;
            }
        }

        // Filter by food availability
        if (currentFilters.foodAvailability) {
            if (listing.food !== currentFilters.foodAvailability) {
                return false;
            }
        }

        // Filter by search text
        if (currentFilters.searchText) {
            const searchLower = currentFilters.searchText.toLowerCase();
            const matchesName = listing.name.toLowerCase().includes(searchLower);
            const matchesLocation = listing.location.toLowerCase().includes(searchLower);
            if (!matchesName && !matchesLocation) {
                return false;
            }
        }

        return true;
    });

    renderListings(filtered);
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

function viewDetails(listingId) {
    const listing = rentalListings.find(l => l.id === listingId);
    if (listing) {
        alert(`📍 Details for: ${listing.name}\n\nType: ${listing.type}\nPrice: ₹${listing.price}/month\nFood: ${listing.food}\nTimings: ${listing.timings}\nLocation: ${listing.location}\nRating: ${listing.rating}/5\n\nThis feature would typically open a detailed view page.`);
    }
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
