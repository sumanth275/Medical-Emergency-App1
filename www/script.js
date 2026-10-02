/* MedAlert — Emergency System JavaScript */

// ── Storage Keys ──
const KEYS = {
    patient: 'medalert_patient',
    contacts: 'medalert_contacts',
    location: 'medalert_location'
};

// ── Current location coords ──
let currentCoords = null;

// ── On Page Load ──
document.addEventListener('DOMContentLoaded', () => {
    loadPatientData();
    loadContacts();
    initNavHighlight();
});

// ── Nav Highlight on Scroll ──
function initNavHighlight() {
    const sections = ['home', 'patient', 'contacts', 'location'];
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                sections.forEach(id => {
                    const link = document.getElementById('nav-' + id);
                    if (link) link.classList.remove('active');
                });
                const activeLink = document.getElementById('nav-' + entry.target.id);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

// ============================================
// SOS ACTIVATION
// ============================================
function activateSOS() {
    const btn = document.getElementById('sosBtn');
    const msg = document.getElementById('sosMessage');

    // Animate button
    btn.style.pointerEvents = 'none';
    btn.querySelector('.sos-inner').style.background =
        'linear-gradient(135deg, #7f1d1d, #991b1b)';
    btn.querySelector('.sos-label').textContent = 'SOS SENT!';

    // Show message
    msg.classList.remove('hidden');

    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // Alert
    setTimeout(() => {
        alert('🚨 EMERGENCY SOS ACTIVATED!\n\nYour emergency signal has been sent.\nPlease call 112 immediately for fastest response.');
    }, 200);

    // Reset after 8 seconds
    setTimeout(() => {
        btn.style.pointerEvents = 'auto';
        btn.querySelector('.sos-inner').style.background =
            'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)';
        btn.querySelector('.sos-label').textContent = 'ACTIVATE SOS';
        msg.classList.add('hidden');
    }, 8000);
}

// ============================================
// PATIENT DATA
// ============================================
function savePatient() {
    const data = {
        name: document.getElementById('patientName').value.trim(),
        age: document.getElementById('patientAge').value.trim(),
        gender: document.getElementById('patientGender').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        allergies: document.getElementById('allergies').value.trim(),
        medCondition: document.getElementById('medCondition').value.trim(),
        currentMeds: document.getElementById('currentMeds').value.trim(),
        savedAt: new Date().toLocaleString()
    };

    if (!data.name) {
        showMsg('patientSaveMsg', '⚠️ Please enter the patient name.', 'alert-warning');
        return;
    }

    localStorage.setItem(KEYS.patient, JSON.stringify(data));
    showMsg('patientSaveMsg', '✅ Patient profile saved successfully!', 'alert-success');
}

function loadPatientData() {
    const saved = localStorage.getItem(KEYS.patient);
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        setVal('patientName', data.name);
        setVal('patientAge', data.age);
        setVal('patientGender', data.gender);
        setVal('bloodGroup', data.bloodGroup);
        setVal('allergies', data.allergies);
        setVal('medCondition', data.medCondition);
        setVal('currentMeds', data.currentMeds);
    } catch (e) {
        console.warn('Failed to parse saved patient data');
    }
}

function clearPatient() {
    ['patientName', 'patientAge', 'patientGender', 'bloodGroup',
     'allergies', 'medCondition', 'currentMeds'].forEach(id => setVal(id, ''));
    localStorage.removeItem(KEYS.patient);
    showMsg('patientSaveMsg', '🗑️ Patient data cleared.', 'alert-info');
}

// ============================================
// EMERGENCY CONTACTS
// ============================================
function addContact() {
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const relation = document.getElementById('contactRelation').value;

    if (!name || !phone) {
        alert('Please enter both contact name and phone number.');
        return;
    }

    const contacts = getContacts();
    contacts.push({ id: Date.now(), name, phone, relation });
    saveContacts(contacts);
    renderContacts(contacts);

    // Clear inputs
    setVal('contactName', '');
    setVal('contactPhone', '');
    setVal('contactRelation', '');
}

function deleteContact(id) {
    const contacts = getContacts().filter(c => c.id !== id);
    saveContacts(contacts);
    renderContacts(contacts);
}

function getContacts() {
    try {
        return JSON.parse(localStorage.getItem(KEYS.contacts) || '[]');
    } catch { return []; }
}

function saveContacts(contacts) {
    localStorage.setItem(KEYS.contacts, JSON.stringify(contacts));
}

function loadContacts() {
    renderContacts(getContacts());
}

function renderContacts(contacts) {
    const list = document.getElementById('contactList');
    if (!list) return;

    if (contacts.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;text-align:center;padding:1rem 0;">No contacts added yet.</p>';
        return;
    }

    list.innerHTML = contacts.map(c => `
        <div class="contact-item" id="contact-${c.id}">
            <div class="contact-info">
                <span class="contact-name">👤 ${escapeHtml(c.name)}</span>
                <span class="contact-meta">${escapeHtml(c.relation || 'Contact')} · ${escapeHtml(c.phone)}</span>
            </div>
            <div class="contact-actions">
                <a href="tel:${escapeHtml(c.phone)}" class="contact-call-btn">📞 Call</a>
                <button class="contact-del-btn" onclick="deleteContact(${c.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// LOCATION
// ============================================
function getLocation() {
    const display = document.getElementById('locationDisplay');
    const msg = document.getElementById('locationMsg');
    const mapBtn = document.getElementById('openMapBtn');

    if (!navigator.geolocation) {
        msg.className = 'alert-message alert-warning';
        msg.textContent = '⚠️ Geolocation is not supported by your browser.';
        msg.classList.remove('hidden');
        return;
    }

    display.innerHTML = `
        <div style="text-align:center;color:var(--text-muted);">
            <div style="font-size:2rem;margin-bottom:0.5rem;animation:drift 1s ease-in-out infinite;">📍</div>
            <p>Getting your location...</p>
        </div>
    `;
    msg.classList.add('hidden');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            const acc = Math.round(position.coords.accuracy);
            const mapURL = `https://www.google.com/maps?q=${lat},${lng}`;

            currentCoords = { lat, lng, mapURL };
            localStorage.setItem(KEYS.location, JSON.stringify(currentCoords));

            display.innerHTML = `
                <div class="location-result">
                    <div class="location-coords">
                        <div class="coord-box">
                            <div class="coord-label">Latitude</div>
                            <div class="coord-value">${lat}°</div>
                        </div>
                        <div class="coord-box">
                            <div class="coord-label">Longitude</div>
                            <div class="coord-value">${lng}°</div>
                        </div>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem;">
                        📡 Accuracy: ±${acc}m
                    </div>
                    <a href="${mapURL}" target="_blank" class="location-map-link">
                        🗺️ Open in Google Maps →
                    </a>
                </div>
            `;

            msg.className = 'alert-message alert-success';
            msg.textContent = '✅ Location retrieved successfully!';
            msg.classList.remove('hidden');
            mapBtn.classList.remove('hidden');
        },
        (error) => {
            const messages = {
                1: '🔒 Location access denied. Please allow location permission.',
                2: '📡 Location unavailable. Check your connection.',
                3: '⏱️ Location request timed out. Please try again.'
            };

            display.innerHTML = `
                <div style="text-align:center;color:var(--text-muted);">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">❌</div>
                    <p>${messages[error.code] || 'Unable to get location.'}</p>
                </div>
            `;

            msg.className = 'alert-message alert-warning';
            msg.textContent = messages[error.code] || 'Location error occurred.';
            msg.classList.remove('hidden');
        },
        { timeout: 12000, enableHighAccuracy: true }
    );
}

function openMap() {
    if (currentCoords) {
        window.open(currentCoords.mapURL, '_blank');
    }
}

// ============================================
// UTILITIES
// ============================================
function showMsg(id, text, className) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'alert-message ' + className;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
}
