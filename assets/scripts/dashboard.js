/**
 * Wedding RSVP Dashboard JavaScript
 * Handles all dashboard functionality, data loading, visualization and UI interactions
 */

// =====================================================================
// CONFIGURATION AND INITIALIZATION
// =====================================================================

// Configuration - CHANGE THESE VALUES
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBFDdRkTfXW9UQpEHI32Pd1RGXX8t_-s6Q",
    authDomain: "wedding-db-994da.firebaseapp.com",
    projectId: "wedding-db-994da",
    storageBucket: "wedding-db-994da.firebasestorage.app",
    messagingSenderId: "102632882630",
    appId: "1:102632882630:web:cd1c96ff206b42652832c7"
};

// The password to access the dashboard
const DASHBOARD_PASSWORD = "PeakChatsworth2025";

// The path to your RSVPs in Firebase
const RSVP_PATH = "rsvps";

// Stored RSVP data
let allRsvps = [];

// Chart instances
let menuChart = null;
let attendanceChart = null;
let dietaryChart = null;
let drinkingChart = null;
let groupChart = null;
let wordCloudChart = null;

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const database = firebase.database();

// =====================================================================
// DOM ELEMENTS
// =====================================================================

// Main containers
const loginContainer = document.getElementById('login');
const dashboardContainer = document.getElementById('dashboard');
const loader = document.getElementById('loader');

// Login elements
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Stats elements
const totalCount = document.getElementById('total-count');
const attendingCount = document.getElementById('attending-count');
const notAttendingCount = document.getElementById('not-attending-count');
const totalGuests = document.getElementById('total-guests');
const responseRate = document.getElementById('response-rate');
const totalInvited = document.getElementById('total-invited');
const pendingCount = document.getElementById('pending-count');
const nonDrinkersCount = document.getElementById('non-drinkers-count');

// View tabs
const respondedTab = document.getElementById('responded-tab');
const notRespondedTab = document.getElementById('not-responded-tab');
const allTab = document.getElementById('all-tab');
const respondedView = document.getElementById('responded-view');
const notRespondedView = document.getElementById('not-responded-view');
const allGuestsView = document.getElementById('all-guests-view');

// Table bodies for different views
const rsvpTableBody = document.getElementById('rsvp-table-body');
const pendingTableBody = document.getElementById('pending-table-body');
const allTableBody = document.getElementById('all-table-body');

// Filter elements
const searchInput = document.getElementById('search');
const attendanceFilter = document.getElementById('attendance-filter');
const dietaryFilter = document.getElementById('dietary-filter');
const menuFilter = document.getElementById('menu-filter');
const drinkingFilter = document.getElementById('drinking-filter');
const pendingSearch = document.getElementById('pending-search');
const pendingGroupFilter = document.getElementById('pending-group-filter');
const allSearch = document.getElementById('all-search');
const allStatusFilter = document.getElementById('all-status-filter');

// Chart elements
const menuChartElement = document.getElementById('menu-chart');
const attendanceChartElement = document.getElementById('attendance-chart');
const dietaryChartElement = document.getElementById('dietary-chart');
const drinkingChartElement = document.getElementById('drinking-chart');
const groupChartElement = document.getElementById('group-chart');
const wordCloudElement = document.getElementById('word-cloud');

// =====================================================================
// ERROR HANDLING
// =====================================================================

// Global error handling function
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    const errorBox = document.createElement('div');
    errorBox.style.color = 'red';
    errorBox.style.padding = '10px';
    errorBox.style.margin = '10px 0';
    errorBox.style.border = '1px solid red';
    errorBox.style.borderRadius = '4px';
    errorBox.style.backgroundColor = '#fff8f8';
    errorBox.textContent = `Error in ${context}: ${error.message}`;
    document.body.prepend(errorBox);
}

// =====================================================================
// INITIALIZATION AND AUTHENTICATION
// =====================================================================

// Initialize UI elements with safety checks
function initializeUI() {
    try {
        console.log("Dashboard initialization started");
        
        // Hide dashboard and show login initially
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }
        
        if (loginContainer) {
            loginContainer.style.display = 'flex';
        }
        
        // Check that required elements exist
        const requiredElements = [
            { el: loginContainer, name: 'login container' },
            { el: dashboardContainer, name: 'dashboard container' },
            { el: passwordInput, name: 'password input' },
            { el: loginBtn, name: 'login button' },
            { el: rsvpTableBody, name: 'RSVP table body' }
        ];
        
        for (const item of requiredElements) {
            if (!item.el) {
                throw new Error(`Required element not found: ${item.name}`);
            }
        }
        
        // Add login event listeners
        setupEventListeners();
        
        // Check if already logged in
        if (localStorage.getItem('weddingRsvpLoggedIn') === 'true') {
            console.log("User already logged in, showing dashboard");
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            loadRsvpData();
        }
        
        console.log("Dashboard initialization completed");
    } catch (error) {
        handleError(error, 'UI initialization');
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Login button
    if (loginBtn) {
        console.log("Setting up login button event listener");
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Enter key press for login
    if (passwordInput) {
        console.log("Setting up password input event listener");
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Logout button
    if (logoutBtn) {
        console.log("Setting up logout button event listener");
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('weddingRsvpLoggedIn');
            dashboardContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
            passwordInput.value = '';
            if (loginError) loginError.textContent = '';
        });
    }
    
    // Tab navigation
    if (respondedTab) respondedTab.addEventListener('click', () => switchView('responded'));
    if (notRespondedTab) notRespondedTab.addEventListener('click', () => switchView('not-responded'));
    if (allTab) allTab.addEventListener('click', () => switchView('all'));
    
    // Filters for responded view
    if (searchInput) searchInput.addEventListener('input', () => displayRsvps('responded'));
    if (attendanceFilter) attendanceFilter.addEventListener('change', () => displayRsvps('responded'));
    if (dietaryFilter) dietaryFilter.addEventListener('change', () => displayRsvps('responded'));
    if (menuFilter) menuFilter.addEventListener('change', () => displayRsvps('responded'));
    if (drinkingFilter) drinkingFilter.addEventListener('change', () => displayRsvps('responded'));
    
    // Filters for not-responded view
    if (pendingSearch) pendingSearch.addEventListener('input', () => displayRsvps('not-responded'));
    if (pendingGroupFilter) pendingGroupFilter.addEventListener('change', () => displayRsvps('not-responded'));
    
    // Filters for all guests view
    if (allSearch) allSearch.addEventListener('input', () => displayRsvps('all'));
    if (allStatusFilter) allStatusFilter.addEventListener('change', () => displayRsvps('all'));
}

// Handle login button click
function handleLogin() {
    console.log("Login attempt");
    const password = passwordInput.value.trim();
    
    if (password === DASHBOARD_PASSWORD) {
        console.log("Login successful");
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        loadRsvpData();
        
        // Save login state
        localStorage.setItem('weddingRsvpLoggedIn', 'true');
    } else {
        console.log("Login failed: incorrect password");
        if (loginError) {
            loginError.textContent = 'Incorrect password. Please try again.';
        }
    }
}

// =====================================================================
// DATA LOADING AND PROCESSING
// =====================================================================

// Load RSVP data from Firebase
function loadRsvpData() {
    try {
        if (loader) {
            loader.style.display = 'block';
        }
        
        database.ref(RSVP_PATH).once('value')
            .then((snapshot) => {
                try {
                    const data = snapshot.val();
                    allRsvps = [];
                    
                    if (data && Array.isArray(data)) {
                        // Filter out null entries from the array
                        data.forEach((rsvp, index) => {
                            if (rsvp) {  // Skip null entries
                                rsvp.id = index;
                                allRsvps.push(rsvp);
                            }
                        });
                    } else if (data && typeof data === 'object') {
                        // Handle object format
                        Object.keys(data).forEach(key => {
                            const rsvp = data[key];
                            if (rsvp) {  // Skip null entries
                                rsvp.id = key;
                                allRsvps.push(rsvp);
                            }
                        });
                    }
                    
                    updateStats();
                    displayRsvps('responded'); // Show responded view by default
                    populateGroupFilters();
                    updateCharts();
                } catch (innerError) {
                    handleError(innerError, 'processing RSVP data');
                } finally {
                    if (loader) {
                        loader.style.display = 'none';
                    }
                }
            })
            .catch((error) => {
                handleError(error, 'loading RSVP data');
                if (loader) {
                    loader.style.display = 'none';
                }
            });
    } catch (error) {
        handleError(error, 'initializing data load');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// Populate group filter dropdowns
function populateGroupFilters() {
    try {
        // Get unique group IDs
        const groupIDs = new Set();
        allRsvps.forEach(rsvp => {
            if (rsvp && rsvp.GroupID) {
                groupIDs.add(rsvp.GroupID);
            }
        });
        
        // Clear existing options (except the first one)
        while (pendingGroupFilter.options.length > 1) {
            pendingGroupFilter.remove(1);
        }
        
        // Add group options
        groupIDs.forEach(groupID => {
            const option = document.createElement('option');
            option.value = groupID;
            option.textContent = `Group ${groupID}`;
            pendingGroupFilter.appendChild(option);
        });
    } catch (error) {
        handleError(error, 'populating group filters');
    }
}

// Calculate and update statistics
function updateStats() {
    try {
        // Count all RSVPs
        const totalInvitedCount = allRsvps.length;
        const submitted = allRsvps.filter(rsvp => rsvp && rsvp.Submitted === true);
        const attending = submitted.filter(rsvp => rsvp && rsvp.Attending === 'Yes');
        const notAttending = submitted.filter(rsvp => rsvp && rsvp.Attending === 'No');
        const pendingResponses = allRsvps.filter(rsvp => rsvp && rsvp.Submitted !== true);
        
        // Count non-drinkers
        const nonDrinkers = attending.filter(rsvp => rsvp && rsvp.NonDrinker === true);
        
        // Count unique groups that have responded
        const respondedGroups = new Set();
        submitted.forEach(rsvp => {
            if (rsvp && rsvp.GroupID) {
                respondedGroups.add(rsvp.GroupID);
            }
        });
        
        // Calculate response rate
        const responseRateValue = totalInvitedCount > 0 ? 
            (submitted.length / totalInvitedCount * 100).toFixed(1) : "0.0";
        
        // Count all attendees
        const guestCount = attending.length;
        
        // Safely update DOM elements
        if (totalCount) totalCount.textContent = submitted.length;
        if (attendingCount) attendingCount.textContent = attending.length;
        if (notAttendingCount) notAttendingCount.textContent = notAttending.length;
        if (totalGuests) totalGuests.textContent = guestCount;
        if (responseRate) responseRate.textContent = responseRateValue + '%';
        if (totalInvited) totalInvited.textContent = totalInvitedCount;
        if (pendingCount) pendingCount.textContent = pendingResponses.length;
        if (nonDrinkersCount) nonDrinkersCount.textContent = nonDrinkers.length;
    } catch (error) {
        handleError(error, 'updating statistics');
    }
}

// =====================================================================
// VIEW MANAGEMENT AND DISPLAY
// =====================================================================

// Switch between different dashboard views
// Updated switchView function to use async displayNotRespondedRsvps
function switchView(viewName) {
    // Hide all views
    respondedView.style.display = 'none';
    notRespondedView.style.display = 'none';
    allGuestsView.style.display = 'none';
    
    // Remove active class from all tabs
    respondedTab.classList.remove('active');
    notRespondedTab.classList.remove('active');
    allTab.classList.remove('active');
    
    // Show the selected view and activate the corresponding tab
    switch(viewName) {
        case 'responded':
            respondedView.style.display = 'block';
            respondedTab.classList.add('active');
            displayRsvps('responded');
            break;
        case 'not-responded':
            notRespondedView.style.display = 'block';
            notRespondedTab.classList.add('active');
            displayNotRespondedRsvps(); // This is now async
            break;
        case 'all':
            allGuestsView.style.display = 'block';
            allTab.classList.add('active');
            displayRsvps('all');
            break;
    }
}

// Updated displayRsvps function to handle async call
function displayRsvps(viewType) {
    try {
        switch(viewType) {
            case 'responded':
                displayRespondedRsvps();
                break;
            case 'not-responded':
                displayNotRespondedRsvps(); // Async function
                break;
            case 'all':
                displayAllRsvps();
                break;
            default:
                displayRespondedRsvps();
        }
    } catch (error) {
        handleError(error, 'displaying RSVPs');
    }
}
// Display RSVPs that have responded
function displayRespondedRsvps() {
    if (!rsvpTableBody) {
        console.error("Responded table body element not found");
        return;
    }
    
    rsvpTableBody.innerHTML = '';
    
    // Only show submitted RSVPs
    let filteredRsvps = allRsvps.filter(rsvp => rsvp.Submitted === true);
    
    // Search filter
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchTerm) {
        filteredRsvps = filteredRsvps.filter(rsvp => 
            (rsvp.Forename && rsvp.Forename.toLowerCase().includes(searchTerm)) || 
            (rsvp.Surname && rsvp.Surname.toLowerCase().includes(searchTerm))
        );
    }
    
    // Attendance filter
    if (attendanceFilter) {
        const attendanceValue = attendanceFilter.value;
        if (attendanceValue === 'attending') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Attending === 'Yes');
        } else if (attendanceValue === 'not-attending') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Attending === 'No');
        }
    }
    
    // Dietary filter
    if (dietaryFilter) {
        const dietaryValue = dietaryFilter.value;
        if (dietaryValue !== 'all') {
            if (dietaryValue === 'none') {
                // Filter for no dietary restrictions
                filteredRsvps = filteredRsvps.filter(rsvp => 
                    !rsvp.DietaryRequirements || 
                    rsvp.DietaryRequirements === 'None' || 
                    rsvp.DietaryRequirements === 'none' ||
                    rsvp.DietaryRequirements.trim() === ''
                );
            } else {
                // Filter for specific dietary restrictions
                filteredRsvps = filteredRsvps.filter(rsvp => 
                    rsvp.DietaryRequirements && 
                    rsvp.DietaryRequirements.toLowerCase().includes(dietaryValue.toLowerCase())
                );
            }
        }
    }
    
    // Menu filter
    if (menuFilter) {
        const menuValue = menuFilter.value;
        if (menuValue !== 'all') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Menu === menuValue);
        }
    }
    
    // Drinking filter
    if (drinkingFilter) {
        const drinkingValue = drinkingFilter.value;
        if (drinkingValue === 'nondrinker') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.NonDrinker === true);
        } else if (drinkingValue === 'drinker') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.NonDrinker !== true);
        }
    }
    
    // Sort by newest first (if SubmissionDate exists)
    filteredRsvps.sort((a, b) => {
        if (a.SubmissionDate && b.SubmissionDate) {
            return new Date(b.SubmissionDate) - new Date(a.SubmissionDate);
        }
        return 0;
    });
    
    // Create table rows
    filteredRsvps.forEach(rsvp => {
        const row = document.createElement('tr');
        
        // Format attendance status
        let attendingText = rsvp.Attending || 'Unknown';
        let attendingClass = '';
        
        if (rsvp.Attending === 'Yes') {
            attendingClass = 'attending';
        } else if (rsvp.Attending === 'No') {
            attendingClass = 'not-attending';
        }
        
        // Format date if SubmissionDate exists
        let dateDisplay = 'Unknown';
        if (rsvp.SubmissionDate) {
            const date = new Date(rsvp.SubmissionDate);
            dateDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        
        // Format dietary restrictions
        let dietaryDisplay = '';
        if (rsvp.DietaryRequirements) {
            // Split by commas if multiple restrictions
            const restrictions = rsvp.DietaryRequirements.split(',');
            dietaryDisplay = restrictions.map(r => 
                `<span class="dietaryRestriction">${r.trim()}</span>`
            ).join(' ');
        } else {
            dietaryDisplay = '<span class="dietaryRestriction">None</span>';
        }
        
        // Format name as "Firstname Surname"
        const fullName = `${rsvp.Forename || ''} ${rsvp.Surname || ''}`.trim();
        
        // Format non-drinker status
        const nonDrinkerClass = rsvp.NonDrinker === true ? 'non-drinker-yes' : '';
        const nonDrinkerDisplay = rsvp.NonDrinker === true ? 'Yes' : 'No';
        
        // Safety check to avoid null references
        try {
            row.innerHTML = `
                <td>${fullName || '-'}</td>
                <td>${rsvp.GroupID || '-'}</td>
                <td class="${attendingClass}">${attendingText}</td>
                <td>${rsvp.Menu || '-'}</td>
                <td>${dietaryDisplay}</td>
                <td class="${nonDrinkerClass}">${nonDrinkerDisplay}</td>
                <td>${rsvp.Message || '-'}</td>
                <td>${dateDisplay}</td>
            `;
        } catch (error) {
            console.error("Error rendering row:", error, rsvp);
            row.innerHTML = `<td colspan="8">Error displaying this RSVP</td>`;
        }
        
        rsvpTableBody.appendChild(row);
    });
    
    // Show message if no results
    if (filteredRsvps.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" style="text-align: center;">No matching RSVPs found</td>
        `;
        rsvpTableBody.appendChild(emptyRow);
    }
}

// Display RSVPs that have not responded
function displayNotRespondedRsvps() {
    if (!pendingTableBody) {
        console.error("Pending table body element not found");
        return;
    }
    
    pendingTableBody.innerHTML = '';
    
    // Get RSVPs that have not submitted
    let pendingRsvps = allRsvps.filter(rsvp => rsvp.Submitted !== true);
    
    // Apply search filter
    const searchTerm = pendingSearch ? pendingSearch.value.trim().toLowerCase() : '';
    if (searchTerm) {
        pendingRsvps = pendingRsvps.filter(rsvp => 
            (rsvp.Forename && rsvp.Forename.toLowerCase().includes(searchTerm)) || 
            (rsvp.Surname && rsvp.Surname.toLowerCase().includes(searchTerm))
        );
    }
    
    // Group filter
    if (pendingGroupFilter) {
        const groupValue = pendingGroupFilter.value;
        if (groupValue !== 'all') {
            pendingRsvps = pendingRsvps.filter(rsvp => rsvp.GroupID === groupValue);
        }
    }
    
    // Sort by name
    pendingRsvps.sort((a, b) => {
        const nameA = `${a.Forename || ''} ${a.Surname || ''}`.trim().toLowerCase();
        const nameB = `${b.Forename || ''} ${b.Surname || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Create table rows for pending RSVPs
    pendingRsvps.forEach(rsvp => {
        const row = document.createElement('tr');
        
        // Format name as "Firstname Surname"
        const fullName = `${rsvp.Forename || ''} ${rsvp.Surname || ''}`.trim();
        
        try {
            row.innerHTML = `
                <td>${fullName || '-'}</td>
                <td>${rsvp.GroupID || '-'}</td>
                <td>${rsvp.Email || '-'}</td>
                <td>${rsvp.Phone || '-'}</td>
                <td>
                    <button class="action-btn email" onclick="sendReminderEmail('${rsvp.Email || ''}', '${fullName}')">
                        Send Email
                    </button>
                </td>
            `;
        } catch (error) {
            console.error("Error rendering pending row:", error, rsvp);
            row.innerHTML = `<td colspan="5">Error displaying this RSVP</td>`;
        }
        
        pendingTableBody.appendChild(row);
    });
    
    // Show message if no pending results
    if (pendingRsvps.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" style="text-align: center;">No pending RSVPs found</td>
        `;
        pendingTableBody.appendChild(emptyRow);
    }
}

// Initialize tracking data in localStorage if not exists
function initializeTrackingData() {
    if (!localStorage.getItem('weddingRsvpTracking')) {
        localStorage.setItem('weddingRsvpTracking', JSON.stringify({}));
    }
}

// Get tracking data for a specific guest
function getGuestTracking(id) {
    const trackingData = JSON.parse(localStorage.getItem('weddingRsvpTracking') || '{}');
    return trackingData[id] || { 
        lastContacted: null,
        notes: '',
        contacted: false 
    };
}

// Update tracking data for a specific guest
function updateGuestTracking(id, data) {
    const trackingData = JSON.parse(localStorage.getItem('weddingRsvpTracking') || '{}');
    trackingData[id] = {
        ...getGuestTracking(id),
        ...data
    };
    localStorage.setItem('weddingRsvpTracking', JSON.stringify(trackingData));
}

// Display RSVPs that have not responded (revised version)
function displayNotRespondedRsvps() {
    if (!pendingTableBody) {
        console.error("Pending table body element not found");
        return;
    }
    
    // Initialize tracking data
    initializeTrackingData();
    
    pendingTableBody.innerHTML = '';
    
    // Get RSVPs that have not submitted
    let pendingRsvps = allRsvps.filter(rsvp => rsvp.Submitted !== true);
    
    // Apply search filter
    const searchTerm = pendingSearch ? pendingSearch.value.trim().toLowerCase() : '';
    if (searchTerm) {
        pendingRsvps = pendingRsvps.filter(rsvp => 
            (rsvp.Forename && rsvp.Forename.toLowerCase().includes(searchTerm)) || 
            (rsvp.Surname && rsvp.Surname.toLowerCase().includes(searchTerm))
        );
    }
    
    // Group filter
    if (pendingGroupFilter) {
        const groupValue = pendingGroupFilter.value;
        if (groupValue !== 'all') {
            pendingRsvps = pendingRsvps.filter(rsvp => rsvp.GroupID === groupValue);
        }
    }
    
    // Sort by name
    pendingRsvps.sort((a, b) => {
        const nameA = `${a.Forename || ''} ${a.Surname || ''}`.trim().toLowerCase();
        const nameB = `${b.Forename || ''} ${b.Surname || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Create table rows for pending RSVPs
    pendingRsvps.forEach(rsvp => {
        const row = document.createElement('tr');
        
        // Format name as "Firstname Surname"
        const fullName = `${rsvp.Forename || ''} ${rsvp.Surname || ''}`.trim();
        
        // Get tracking data
        const tracking = getGuestTracking(rsvp.id);
        const lastContactedDisplay = tracking.lastContacted ? 
            new Date(tracking.lastContacted).toLocaleDateString() : 'Never';
        
        // Get group size
        const groupSize = allRsvps.filter(r => r.GroupID === rsvp.GroupID).length;
        
        try {
            row.innerHTML = `
                <td class="checkbox-cell">
                    <input type="checkbox" class="pending-checkbox" data-id="${rsvp.id}">
                </td>
                <td>${fullName || '-'}</td>
                <td>${rsvp.GroupID || '-'}</td>
                <td class="group-size">${groupSize}</td>
                <td class="contacted-date">${lastContactedDisplay}</td>
                <td>
                    <div class="note-container">
                        <span class="note-text">${tracking.notes || ''}</span>
                        <button class="note-btn" onclick="editNote('${rsvp.id}', this)">
                            <i class="fa fa-pencil"></i> ${tracking.notes ? 'Edit' : 'Add'}
                        </button>
                    </div>
                </td>
                <td>
                    <button class="mark-contacted-btn" onclick="markAsContactedSingle('${rsvp.id}')">
                        Mark Contacted
                    </button>
                </td>
            `;
        } catch (error) {
            console.error("Error rendering pending row:", error, rsvp);
            row.innerHTML = `<td colspan="7">Error displaying this RSVP</td>`;
        }
        
        pendingTableBody.appendChild(row);
    });
    
    // Show message if no pending results
    if (pendingRsvps.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No pending RSVPs found</td>
        `;
        pendingTableBody.appendChild(emptyRow);
    }
}

// Toggle all pending checkboxes
function toggleAllPending() {
    const selectAllCheckbox = document.getElementById('select-all-pending');
    const checkboxes = document.querySelectorAll('.pending-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// Handle keypress in note input
function handleNoteKeypress(event, id, input) {
    if (event.key === 'Enter') {
        saveNote(id, input);
    }
}

// Save note for a guest
function saveNote(id, input) {
    const newNote = input.value.trim();
    updateGuestTracking(id, { notes: newNote });
    
    // Replace input with display
    const container = input.parentElement;
    container.innerHTML = `
        <span class="note-text">${newNote}</span>
        <button class="note-btn" onclick="editNote('${id}', this)">
            <i class="fa fa-pencil"></i> ${newNote ? 'Edit' : 'Add'}
        </button>
    `;
    
    // Update the view
    displayNotRespondedRsvps();
}

// Improved markAsContactedSingle function with better error handling
async function markAsContactedSingle(id) {
    try {
        if (!id) {
            console.error("Invalid guest ID in markAsContactedSingle");
            return;
        }
        
        // Show loader
        if (loader) loader.style.display = 'block';
        
        await updateGuestTracking(id, { 
            lastContacted: new Date().toISOString(),
            contacted: true
        });
        
        // Update the view
        await displayNotRespondedRsvps();
    } catch (error) {
        handleError(error, 'marking guest as contacted');
        
        // Still try to refresh the view even if there was an error
        try {
            await displayNotRespondedRsvps();
        } catch (refreshError) {
            handleError(refreshError, 'refreshing view after contact marking error');
        }
    } finally {
        // Hide loader
        if (loader) loader.style.display = 'none';
    }
}

// Improved markAsContacted function for batch operations
async function markAsContacted() {
    const checkboxes = document.querySelectorAll('.pending-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one guest.');
        return;
    }
    
    try {
        // Show loader
        if (loader) loader.style.display = 'block';
        
        const now = new Date().toISOString();
        const updatePromises = [];
        const ids = [];
        
        checkboxes.forEach(checkbox => {
            const id = checkbox.getAttribute('data-id');
            if (id) {
                ids.push(id);
                const promise = updateGuestTracking(id, { 
                    lastContacted: now,
                    contacted: true
                });
                updatePromises.push(promise);
            }
        });
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        // Update the view
        await displayNotRespondedRsvps();
        
        // Uncheck "select all" checkbox
        const selectAllCheckbox = document.getElementById('select-all-pending');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        alert(`${ids.length} guest(s) marked as contacted.`);
    } catch (error) {
        handleError(error, 'marking multiple guests as contacted');
        
        // Try to refresh the view even if there was an error
        try {
            await displayNotRespondedRsvps();
        } catch (refreshError) {
            handleError(refreshError, 'refreshing view after batch contact marking error');
        }
    } finally {
        // Hide loader
        if (loader) loader.style.display = 'none';
    }
}

// Firebase-based tracking functions for not-responded view

// Path to guest tracking data in Firebase
const TRACKING_PATH = "rsvp_tracking";

// Initialize tracking data in Firebase if not exists
async function initializeTrackingData() {
    try {
        const snapshot = await database.ref(TRACKING_PATH).once('value');
        if (!snapshot.exists()) {
            // Create empty tracking structure if it doesn't exist
            await database.ref(TRACKING_PATH).set({});
        }
    } catch (error) {
        handleError(error, 'initializing tracking data');
    }
}

// Get tracking data for a specific guest
async function getGuestTracking(id) {
    try {
        const snapshot = await database.ref(`${TRACKING_PATH}/${id}`).once('value');
        return snapshot.val() || { 
            lastContacted: null,
            notes: '',
            contacted: false 
        };
    } catch (error) {
        handleError(error, 'getting guest tracking data');
        return { 
            lastContacted: null,
            notes: '',
            contacted: false 
        };
    }
}

// Update tracking data for a specific guest
function updateGuestTracking(id, data) {
    try {
        // Get current data
        return database.ref(`${TRACKING_PATH}/${id}`).once('value')
            .then(snapshot => {
                const currentData = snapshot.val() || {
                    lastContacted: null,
                    notes: '',
                    contacted: false
                };
                
                // Update with new data
                const updatedData = {
                    ...currentData,
                    ...data
                };
                
                // Save back to Firebase
                return database.ref(`${TRACKING_PATH}/${id}`).set(updatedData);
            });
    } catch (error) {
        handleError(error, 'updating guest tracking data');
        return Promise.reject(error);
    }
}

// Load all tracking data at once (more efficient)
async function loadAllTrackingData() {
    try {
        const snapshot = await database.ref(TRACKING_PATH).once('value');
        return snapshot.val() || {};
    } catch (error) {
        handleError(error, 'loading all tracking data');
        return {};
    }
}

// Display RSVPs that have not responded (optimized version)
async function displayNotRespondedRsvps() {
    if (!pendingTableBody) {
        console.error("Pending table body element not found");
        return;
    }
    
    // Show loader while loading data
    if (loader) loader.style.display = 'block';
    
    try {
        // Initialize tracking data
        await initializeTrackingData();
        
        pendingTableBody.innerHTML = '';
        
        // Get RSVPs that have not submitted
        let pendingRsvps = allRsvps.filter(rsvp => rsvp.Submitted !== true);
        
        // Apply search filter
        const searchTerm = pendingSearch ? pendingSearch.value.trim().toLowerCase() : '';
        if (searchTerm) {
            pendingRsvps = pendingRsvps.filter(rsvp => 
                (rsvp.Forename && rsvp.Forename.toLowerCase().includes(searchTerm)) || 
                (rsvp.Surname && rsvp.Surname.toLowerCase().includes(searchTerm))
            );
        }
        
        // Group filter
        if (pendingGroupFilter && pendingGroupFilter.value !== 'all') {
            pendingRsvps = pendingRsvps.filter(rsvp => rsvp.GroupID === pendingGroupFilter.value);
        }
        
        // Sort by name
        pendingRsvps.sort((a, b) => {
            const nameA = `${a.Forename || ''} ${a.Surname || ''}`.trim().toLowerCase();
            const nameB = `${b.Forename || ''} ${b.Surname || ''}`.trim().toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Show message if no pending results
        if (pendingRsvps.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" style="text-align: center;">No pending RSVPs found</td>
            `;
            pendingTableBody.appendChild(emptyRow);
            return;
        }
        
        // Load all tracking data in one request
        const allTrackingData = await loadAllTrackingData();
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Create table rows for pending RSVPs
        for (const rsvp of pendingRsvps) {
            const row = document.createElement('tr');
            
            try {
                // Format name as "Firstname Surname"
                const fullName = `${rsvp.Forename || ''} ${rsvp.Surname || ''}`.trim();
                
                // Get tracking data (safely)
                const id = rsvp.id || '';
                const tracking = (allTrackingData && id && allTrackingData[id]) || {
                    lastContacted: null,
                    notes: '',
                    contacted: false
                };
                
                const lastContactedDisplay = tracking.lastContacted ? 
                    new Date(tracking.lastContacted).toLocaleDateString() : 'Never';
                
                // Get group size
                const groupSize = allRsvps.filter(r => r.GroupID === rsvp.GroupID).length;
                
                // Build row content
                row.innerHTML = `
                    <td class="checkbox-cell">
                        <input type="checkbox" class="pending-checkbox" data-id="${id}">
                    </td>
                    <td>${fullName || '-'}</td>
                    <td>${rsvp.GroupID || '-'}</td>
                    <td class="group-size">${groupSize}</td>
                    <td class="contacted-date">${lastContactedDisplay}</td>
                    <td>
                        <div class="note-container">
                            <span class="note-text">${tracking.notes || ''}</span>
                            <button class="note-btn" onclick="editNote('${id}', this)">
                                <i class="fas fa-pencil-alt"></i> ${tracking.notes ? 'Edit' : 'Add'}
                            </button>
                        </div>
                    </td>
                    <td>
                        <button class="mark-contacted-btn" onclick="markAsContactedSingle('${id}')">
                            Mark Contacted
                        </button>
                    </td>
                `;
                
                fragment.appendChild(row);
            } catch (rowError) {
                console.error("Error rendering pending row:", rowError, rsvp);
                
                // Create an error row
                row.innerHTML = `<td colspan="7">Error displaying RSVP: ${rowError.message}</td>`;
                fragment.appendChild(row);
            }
        }
        
        // Append all rows at once
        pendingTableBody.appendChild(fragment);
        
    } catch (error) {
        handleError(error, 'displaying not-responded RSVPs');
        
        // Show error message in the table
        pendingTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: red;">
                    Error loading pending RSVPs: ${error.message}
                </td>
            </tr>
        `;
    } finally {
        // Hide loader
        if (loader) loader.style.display = 'none';
    }
}

// Toggle all pending checkboxes
function toggleAllPending() {
    const selectAllCheckbox = document.getElementById('select-all-pending');
    const checkboxes = document.querySelectorAll('.pending-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// Edit note for a guest
function editNote(id, button) {
    const container = button.parentElement;
    const noteText = container.querySelector('.note-text');
    const currentNote = noteText.textContent;
    
    // Replace the note display with an input field
    container.innerHTML = `
        <input type="text" class="note-input" value="${currentNote}" 
               onblur="saveNote('${id}', this)" onkeydown="handleNoteKeypress(event, '${id}', this)">
    `;
    
    // Focus the input
    container.querySelector('.note-input').focus();
}

// Handle keypress in note input
function handleNoteKeypress(event, id, input) {
    if (event.key === 'Enter') {
        saveNote(id, input);
    }
}

// Save note for a guest
async function saveNote(id, input) {
    if (!input) {
        console.error("Input element is null in saveNote function");
        return;
    }
    
    try {
        const newNote = input.value.trim();
        const container = input.parentElement;
        
        if (!container) {
            console.error("Parent container not found for note input");
            return;
        }
        
        // Show a small loading indicator in the container
        const originalContent = container.innerHTML;
        container.innerHTML = '<span>Saving...</span>';
        
        // Update in Firebase
        await updateGuestTracking(id, { notes: newNote });
        
        // After successful save, update the UI
        container.innerHTML = `
            <span class="note-text">${newNote}</span>
            <button class="note-btn" onclick="editNote('${id}', this)">
                <i class="fas fa-pencil-alt"></i> ${newNote ? 'Edit' : 'Add'}
            </button>
        `;
    } catch (error) {
        handleError(error, 'saving note');
        
        // Attempt to restore the input if something went wrong
        if (input && input.parentElement) {
            const container = input.parentElement;
            const currentValue = input.value || '';
            
            container.innerHTML = `
                <span class="note-text">Error saving: ${currentValue}</span>
                <button class="note-btn" onclick="editNote('${id}', this)">
                    <i class="fas fa-pencil-alt"></i> Try again
                </button>
            `;
        }
    }
}

// Improved version of editNote function that's more resilient
function editNote(id, button) {
    if (!button) {
        console.error("Button element is null in editNote function");
        return;
    }
    
    try {
        const container = button.parentElement;
        
        if (!container) {
            console.error("Parent container not found for note button");
            return;
        }
        
        const noteText = container.querySelector('.note-text');
        const currentNote = noteText ? noteText.textContent : '';
        
        // Replace the note display with an input field
        container.innerHTML = `
            <input type="text" class="note-input" value="${currentNote}" 
                   onblur="saveNote('${id}', this)" onkeydown="handleNoteKeypress(event, '${id}', this)">
        `;
        
        // Focus the input
        const inputElement = container.querySelector('.note-input');
        if (inputElement) {
            inputElement.focus();
        }
    } catch (error) {
        handleError(error, 'editing note');
    }
}

// Mark a single guest as contacted
function markAsContactedSingle(id) {
    updateGuestTracking(id, { 
        lastContacted: new Date().toISOString(),
        contacted: true
    })
    .then(() => {
        // Update the view
        displayNotRespondedRsvps();
    })
    .catch(error => {
        handleError(error, 'marking guest as contacted');
    });
}

// Mark selected guests as contacted
function markAsContacted() {
    const checkboxes = document.querySelectorAll('.pending-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one guest.');
        return;
    }
    
    const now = new Date().toISOString();
    const updatePromises = [];
    
    checkboxes.forEach(checkbox => {
        const id = checkbox.getAttribute('data-id');
        const promise = updateGuestTracking(id, { 
            lastContacted: now,
            contacted: true
        });
        updatePromises.push(promise);
    });
    
    // Wait for all updates to complete
    Promise.all(updatePromises)
        .then(() => {
            // Update the view
            displayNotRespondedRsvps();
            
            // Uncheck "select all" checkbox
            const selectAllCheckbox = document.getElementById('select-all-pending');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            
            alert(`${checkboxes.length} guest(s) marked as contacted.`);
        })
        .catch(error => {
            handleError(error, 'marking multiple guests as contacted');
        });
}

// Make these functions available to the window
window.toggleAllPending = toggleAllPending;
window.editNote = editNote;
window.saveNote = saveNote;
window.handleNoteKeypress = handleNoteKeypress;
window.markAsContactedSingle = markAsContactedSingle;
window.markAsContacted = markAsContacted;

// Display all RSVPs (combined view)
function displayAllRsvps() {
    if (!allTableBody) {
        console.error("All guests table body element not found");
        return;
    }
    
    allTableBody.innerHTML = '';
    
    // Start with all RSVPs
    let filteredRsvps = [...allRsvps];
    
    // Apply search filter
    const searchTerm = allSearch ? allSearch.value.trim().toLowerCase() : '';
    if (searchTerm) {
        filteredRsvps = filteredRsvps.filter(rsvp => 
            (rsvp.Forename && rsvp.Forename.toLowerCase().includes(searchTerm)) || 
            (rsvp.Surname && rsvp.Surname.toLowerCase().includes(searchTerm))
        );
    }
    
    // Status filter
    if (allStatusFilter) {
        const statusValue = allStatusFilter.value;
        if (statusValue === 'responded') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Submitted === true);
        } else if (statusValue === 'pending') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Submitted !== true);
        } else if (statusValue === 'attending') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Submitted === true && rsvp.Attending === 'Yes');
        } else if (statusValue === 'not-attending') {
            filteredRsvps = filteredRsvps.filter(rsvp => rsvp.Submitted === true && rsvp.Attending === 'No');
        }
    }
    
    // Sort by name
    filteredRsvps.sort((a, b) => {
        const nameA = `${a.Forename || ''} ${a.Surname || ''}`.trim().toLowerCase();
        const nameB = `${b.Forename || ''} ${b.Surname || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Create table rows for all RSVPs
    filteredRsvps.forEach(rsvp => {
        const row = document.createElement('tr');
        
        // Format name as "Firstname Surname"
        const fullName = `${rsvp.Forename || ''} ${rsvp.Surname || ''}`.trim();
        
        // Determine status class and text
        let statusClass = 'status-pending';
        let statusText = 'Not Responded';
        
        if (rsvp.Submitted === true) {
            statusClass = 'status-responded';
            statusText = 'Responded';
            
            if (rsvp.Attending === 'Yes') {
                statusClass = 'status-attending';
                statusText = 'Attending';
            } else if (rsvp.Attending === 'No') {
                statusClass = 'status-not-attending';
                statusText = 'Not Attending';
            }
        }
        
        try {
            row.innerHTML = `
                <td>${fullName || '-'}</td>
                <td>${rsvp.GroupID || '-'}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
            `;
        } catch (error) {
            console.error("Error rendering all guests row:", error, rsvp);
            row.innerHTML = `<td colspan="5">Error displaying this guest</td>`;
        }
        
        allTableBody.appendChild(row);
    });
    
    // Show message if no results
    if (filteredRsvps.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" style="text-align: center;">No guests found matching criteria</td>
        `;
        allTableBody.appendChild(emptyRow);
    }
}

// =====================================================================
// ACTION FUNCTIONS
// =====================================================================

// Send reminder email
function sendReminderEmail(email, name) {
    if (email) {
        // This just opens the default mail client
        window.open(`mailto:${email}?subject=Wedding RSVP Reminder&body=Dear ${name},%0D%0A%0D%0AWe noticed that you haven't yet submitted your RSVP for our wedding. We'd love to know if you'll be joining us!%0D%0A%0D%0APlease visit our wedding website to submit your RSVP.%0D%0A%0D%0AThank you!`);
    } else {
        alert("No email address available for this guest.");
    }
}

// Export data to CSV
function exportToCSV(type) {
    try {
        let dataToExport = [];
        let filename = '';
        
        // Determine which data to export based on type
        switch(type) {
            case 'responded':
                dataToExport = allRsvps.filter(rsvp => rsvp.Submitted === true);
                filename = 'wedding_responses.csv';
                break;
            case 'not-responded':
                dataToExport = allRsvps.filter(rsvp => rsvp.Submitted !== true);
                filename = 'wedding_pending.csv';
                break;
            case 'all':
                dataToExport = allRsvps;
                filename = 'wedding_all_guests.csv';
                break;
            case 'attending':
                dataToExport = allRsvps.filter(rsvp => rsvp.Submitted === true && rsvp.Attending === 'Yes');
                filename = 'wedding_attending.csv';
                break;
            default:
                dataToExport = allRsvps;
                filename = 'wedding_rsvps.csv';
        }
        
        // Convert to CSV
        const headers = ['Name', 'Group ID', 'Status', 'Menu', 'Dietary Restrictions', 
                        'Non-Drinker', 'Email', 'Phone', 'Message', 'Submission Date'];
        
        let csvContent = headers.join(',') + '\n';
        
        dataToExport.forEach(rsvp => {
            const fullName = `${rsvp.Forename || ''} ${rsvp.Surname || ''}`.trim();
            
            // Determine status text
            let status = 'Not Responded';
            if (rsvp.Submitted === true) {
                status = rsvp.Attending === 'Yes' ? 'Attending' : 'Not Attending';
            }
            
            // Format fields with proper escaping for CSV
            const formatCSVField = (field) => {
                if (field === null || field === undefined) return '';
                const stringField = String(field);
                // Escape quotes and wrap in quotes if field contains commas or quotes
                if (stringField.includes(',') || stringField.includes('"')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };
            
            const row = [
                formatCSVField(fullName),
                formatCSVField(rsvp.GroupID),
                formatCSVField(status),
                formatCSVField(rsvp.Menu),
                formatCSVField(rsvp.DietaryRequirements),
                formatCSVField(rsvp.NonDrinker === true ? 'Yes' : 'No'),
                formatCSVField(rsvp.Email),
                formatCSVField(rsvp.Phone),
                formatCSVField(rsvp.Message),
                formatCSVField(rsvp.SubmissionDate)
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        handleError(error, 'exporting to CSV');
    }
}

// =====================================================================
// CHARTS AND VISUALIZATIONS
// =====================================================================

// Update all charts with current data
function updateCharts() {
    try {
        // Set Highcharts global options to match website styling
        Highcharts.setOptions({
            colors: ['#de9ca8', '#a7b788', '#496585', '#9E9E9E', '#90CAF9', '#FFCC80', '#CE93D8'],
            chart: {
                style: {
                    fontFamily: "'Inter', sans-serif",
                },
                backgroundColor: 'transparent',
                reflow: true
            },
            title: {
                style: {
                    color: '#496585',
                    fontFamily: "'Playfair Display', serif"
                }
            },
            subtitle: {
                style: {
                    color: '#496585',
                    fontFamily: "'Inter', sans-serif"
                }
            },
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            enabled: false
                        }
                    }
                }]
            }
        });
        
        updateMenuChart();
        updateAttendanceChart();
        updateDietaryChart();
        updateDrinkingChart();
        updateGroupResponseChart();
        generateWordCloud();
    } catch (error) {
        handleError(error, 'updating charts');
    }
}

// Create or update the menu choice chart
function updateMenuChart() {
    if (!menuChartElement) return;
    
    // Get all submitted RSVPs that are attending
    const attendingRsvps = allRsvps.filter(rsvp => 
        rsvp && rsvp.Submitted === true && rsvp.Attending === 'Yes'
    );
    
    // Count menu choices
    const menuCounts = {};
    attendingRsvps.forEach(rsvp => {
        const menu = rsvp.Menu || 'Not Specified';
        menuCounts[menu] = (menuCounts[menu] || 0) + 1;
    });
    
    // Prepare data for Highcharts
    const data = Object.keys(menuCounts).map(menu => ({
        name: menu,
        y: menuCounts[menu]
    }));
    
    // Create or update chart
    if (menuChart) {
        menuChart.series[0].setData(data);
    } else {
        menuChart = Highcharts.chart(menuChartElement, {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Menu Choices'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            },
            series: [{
                name: 'Guests',
                colorByPoint: true,
                data: data
            }]
        });
    }
}

// Create or update the attendance chart
function updateAttendanceChart() {
    if (!attendanceChartElement) return;
    
    // Get submitted RSVPs
    const submitted = allRsvps.filter(rsvp => rsvp && rsvp.Submitted === true);
    
    // Count attendance status
    const attending = submitted.filter(rsvp => rsvp.Attending === 'Yes').length;
    const notAttending = submitted.filter(rsvp => rsvp.Attending === 'No').length;
    const pending = allRsvps.length - submitted.length;
    
    // Create or update chart
    if (attendanceChart) {
        attendanceChart.series[0].setData([
            { name: 'Attending', y: attending },
            { name: 'Not Attending', y: notAttending },
            { name: 'No Response', y: pending }
        ]);
    } else {
        attendanceChart = Highcharts.chart(attendanceChartElement, {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Attendance Overview'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
            },
            plotOptions: {
                pie: {
                    innerSize: '60%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.y}'
                    }
                }
            },
            series: [{
                name: 'Guests',
                colorByPoint: true,
                data: [
                    { name: 'Attending', y: attending },
                    { name: 'Not Attending', y: notAttending },
                    { name: 'No Response', y: pending }
                ]
            }]
        });
    }
}

// Create or update the dietary requirements chart
function updateDietaryChart() {
    if (!dietaryChartElement) return;
    
    // Get all attending RSVPs
    const attendingRsvps = allRsvps.filter(rsvp => 
        rsvp && rsvp.Submitted === true && rsvp.Attending === 'Yes'
    );
    
    // Count dietary requirements
    const dietaryCounts = {
        'None': 0,
        'Vegetarian': 0,
        'Vegan': 0,
        'Gluten-Free': 0,
        'Allergies': 0,
        'Other': 0
    };
    
    attendingRsvps.forEach(rsvp => {
        if (!rsvp.DietaryRequirements || rsvp.DietaryRequirements.trim() === '') {
            dietaryCounts['None']++;
        } else {
            const dietary = rsvp.DietaryRequirements.toLowerCase();
            if (dietary.includes('vegetarian')) {
                dietaryCounts['Vegetarian']++;
            } else if (dietary.includes('vegan')) {
                dietaryCounts['Vegan']++;
            } else if (dietary.includes('gluten')) {
                dietaryCounts['Gluten-Free']++;
            } else if (dietary.includes('allerg')) {
                dietaryCounts['Allergies']++;
            } else {
                dietaryCounts['Other']++;
            }
        }
    });
    
    // Remove zero counts
    Object.keys(dietaryCounts).forEach(key => {
        if (dietaryCounts[key] === 0) {
            delete dietaryCounts[key];
        }
    });
    
    // Prepare data for Highcharts
    const data = Object.keys(dietaryCounts).map(category => ({
        name: category,
        y: dietaryCounts[category]
    }));
    
    // Create or update chart
    if (dietaryChart) {
        dietaryChart.series[0].setData(data);
    } else {
        dietaryChart = Highcharts.chart(dietaryChartElement, {
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Dietary Requirements'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of Guests'
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {
                pointFormat: '<b>{point.y}</b> guests'
            },
            series: [{
                name: 'Dietary Requirements',
                colorByPoint: true,
                data: data
            }]
        });
    }
}

// Create or update the drinking preferences chart
function updateDrinkingChart() {
    if (!drinkingChartElement) return;
    
    // Get all attending RSVPs
    const attendingRsvps = allRsvps.filter(rsvp => 
        rsvp && rsvp.Submitted === true && rsvp.Attending === 'Yes'
    );
    
    // Count drinkers vs non-drinkers
    const drinkers = attendingRsvps.filter(rsvp => rsvp.NonDrinker !== true).length;
    const nonDrinkers = attendingRsvps.filter(rsvp => rsvp.NonDrinker === true).length;
    
    // Create or update chart
    if (drinkingChart) {
        drinkingChart.series[0].setData([
            { name: 'Drinkers', y: drinkers },
            { name: 'Non-Drinkers', y: nonDrinkers }
        ]);
    } else {
        drinkingChart = Highcharts.chart(drinkingChartElement, {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Drinking Preferences'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)'
                    }
                }
            },
            series: [{
                name: 'Guests',
                colorByPoint: true,
                data: [
                    { name: 'Drinkers', y: drinkers },
                    { name: 'Non-Drinkers', y: nonDrinkers }
                ]
            }]
        });
    }
}

// Create or update the group response chart
function updateGroupResponseChart() {
    if (!groupChartElement) return;
    
    // Group RSVPs by GroupID
    const groupData = {};
    allRsvps.forEach(rsvp => {
        if (rsvp && rsvp.GroupID) {
            if (!groupData[rsvp.GroupID]) {
                groupData[rsvp.GroupID] = {
                    total: 0,
                    responded: 0
                };
            }
            groupData[rsvp.GroupID].total++;
            if (rsvp.Submitted === true) {
                groupData[rsvp.GroupID].responded++;
            }
        }
    });
    
    // Count responses by group size
    const groupSizes = {};
    Object.values(groupData).forEach(group => {
        const size = group.total;
        if (!groupSizes[size]) {
            groupSizes[size] = { total: 0, responded: 0 };
        }
        groupSizes[size].total++;
        if (group.responded > 0) {
            groupSizes[size].responded++;
        }
    });
    
    // Prepare data for Highcharts
    const categories = Object.keys(groupSizes).sort((a, b) => parseInt(a) - parseInt(b))
        .map(size => `${size} ${size === '1' ? 'Person' : 'People'}`);
        
    const respondedData = Object.keys(groupSizes).sort((a, b) => parseInt(a) - parseInt(b))
        .map(size => groupSizes[size].responded);
        
    const pendingData = Object.keys(groupSizes).sort((a, b) => parseInt(a) - parseInt(b))
        .map(size => groupSizes[size].total - groupSizes[size].responded);
    
    // Create or update chart
    if (groupChart) {
        groupChart.xAxis[0].setCategories(categories);
        groupChart.series[0].setData(respondedData);
        groupChart.series[1].setData(pendingData);
    } else {
        groupChart = Highcharts.chart(groupChartElement, {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Group Responses by Size'
            },
            xAxis: {
                categories: categories,
                title: {
                    text: 'Group Size'
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of Groups'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: 'gray'
                    }
                }
            },
            legend: {
                align: 'right',
                verticalAlign: 'top',
                floating: false
            },
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            series: [{
                name: 'Responded',
                data: respondedData
            }, {
                name: 'Pending',
                data: pendingData
            }]
        });
    }
}

// Generate word cloud from messages
function generateWordCloud() {
    try {
        if (!wordCloudElement) return;
        
        // Get messages from all submitted RSVPs
        const messages = allRsvps
            .filter(rsvp => rsvp && rsvp.Submitted === true && rsvp.Message && rsvp.Message.trim() !== '')
            .map(rsvp => rsvp.Message);
        
        if (messages.length === 0) {
            // Display a message if no data
            wordCloudChart = Highcharts.chart(wordCloudElement, {
                chart: {
                    type: 'wordcloud',
                    height: '100%'
                },
                title: {
                    text: 'No messages available'
                }
            });
            return;
        }
        
        // Combine all messages and split into words
        const text = messages.join(' ').toLowerCase();
        const words = text.match(/\b\w{3,}\b/g) || [];
        
        // Remove common stopwords
        const stopwords = ['the', 'and', 'that', 'have', 'for', 'not', 'you', 'with', 'this', 'but',
            'his', 'her', 'she', 'him', 'they', 'them', 'its', 'their', 'there', 'some',
            'what', 'who', 'whom', 'whose', 'which', 'where', 'when', 'why', 'how', 
            'are', 'too', 'can', 'off'];
        const filteredWords = words.filter(word => !stopwords.includes(word));
        
        // Count word frequencies
        const wordCounts = {};
        filteredWords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        // Format data for Highcharts wordcloud
        const data = Object.keys(wordCounts).map(word => ({
            name: word,
            weight: wordCounts[word]
        }));
        
        // Create Highcharts word cloud
        if (wordCloudChart) {
            wordCloudChart.series[0].setData(data);
        } else {
            wordCloudChart = Highcharts.chart(wordCloudElement, {
                chart: {
                    type: 'wordcloud',
                    height: '50%'
                },
                title: {
                    text: 'Guest Messages Word Cloud'
                },
                tooltip: {
                    pointFormat: '<b>{point.name}</b>: {point.weight} occurrences'
                },
                plotOptions: {
                    wordcloud: {
                        minFontSize: 5,
                        maxFontSize: 25,
                        spiral: 'rectangular', 
                        placementStrategy: 'center',     
                        style: {
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 'bold'
                        },
                        colors: ['#de9ca8', '#a7b788', '#496585']
                    }
                },
                series: [{
                    name: 'Word Frequency',
                    data: data
                }]
            });
        }
        
    } catch (error) {
        handleError(error, 'generating word cloud');
    }
}

// =====================================================================
// INITIALIZATION
// =====================================================================

// Initialize the dashboard after all elements are loaded
document.addEventListener('DOMContentLoaded', initializeUI);

// Make functions accessible to the window for HTML event handlers
window.sendReminderEmail = sendReminderEmail;
window.exportToCSV = exportToCSV;
window.switchView = switchView;