// modular-reviews.js
// Logic for handling the inline modal property reviews

window.openRoomReviewsModal = async function(propertyId, propertyName) {
    document.getElementById('currentReviewPropertyId').value = propertyId;
    document.getElementById('reviewModalTitle').innerText = `Reviews for ${propertyName}`;
    
    const token = localStorage.getItem('hh_token');
    if(!token) {
        alert("Authentication Required: You must log in to view and write property reviews.");
        toggleAuthModal();
        return;
    }

    document.getElementById('roomReviewsModal').classList.remove('hidden');
    await fetchAndRenderModularReviews(propertyId);
};

window.fetchAndRenderModularReviews = async function(propertyId) {
    const container = document.getElementById('roomReviewsList');
    container.innerHTML = '<p style="text-align:center;">Loading Graph Insights...</p>';

    try {
        const res = await api.get(`/reviews?propertyId=${propertyId}`);
        if (!res.reviews || res.reviews.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No reviews yet. Be the first to share your experience!</p>';
            return;
        }

        container.innerHTML = res.reviews.map(r => {
            const dateStr = new Date(r.createdAt).toLocaleDateString();
            const stars = '⭐'.repeat(r.rating || 5);
            
            return `
            <div style="background:var(--background-secondary); padding:1.5rem; border-radius:12px; border:1px solid var(--border-color); position:relative;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.8rem;">
                    <strong style="color:var(--text-primary);">${r.userName || 'Anonymous'}</strong>
                    <div>${stars}</div>
                </div>
                <p style="color:var(--text-secondary); margin-bottom:1.5rem; font-size:0.95rem;">${r.text}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:gray;">
                    <span>${dateStr}</span>
                    <button onclick="handleModularLikeReview('${r.id}', '${propertyId}')" style="background:transparent; border:1px solid var(--border-color); color:var(--text-primary); padding: 4px 12px; border-radius:20px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.3s; font-family:'Poppins', sans-serif;">
                        👍 ${r.likes || 0}
                    </button>
                </div>
            </div>
            `;
        }).join('');
    } catch(e) {
        container.innerHTML = `<p style="color:red; text-align:center;">Neo4j Error: ${e.message}</p>`;
    }
};

window.handleModularReviewSubmit = async function(e) {
    e.preventDefault();
    const propertyId = document.getElementById('currentReviewPropertyId').value;
    const rating = parseInt(document.getElementById('modularReviewRating').value);
    const text = document.getElementById('modularReviewComment').value;

    if (!propertyId) {
        alert("Critical Error: Modal disconnected from DOM Property Id.");
        return;
    }

    try {
        await api.post('/reviews', { propertyId, rating, text });
        document.getElementById('modularReviewComment').value = '';
        document.getElementById('modularReviewRating').value = '5';
        await fetchAndRenderModularReviews(propertyId);
    } catch(err) {
        alert("Graph Constraint Error: " + err.message);
    }
};

window.handleModularLikeReview = async function(reviewId, propertyId) {
    try {
        await api.post(`/reviews/${reviewId}/like`, {});
        await fetchAndRenderModularReviews(propertyId);
    } catch(e) {
        alert("Graph Liking Error: " + e.message);
    }
};
