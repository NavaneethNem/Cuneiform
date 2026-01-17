// --- 1. INITIALIZATION & FAKE DATA ---
const defaultComplaints = [
    { id: 101, description: "WiFi in the library is extremely slow.", location: "Library", category: "IT Support", status: "Pending", votes: 45, vetos: 1, timestamp: "17/01/2026", author: "User_123" },
    { id: 102, description: "Water cooler on 2nd floor is leaking.", location: "Floor 2", category: "Maintenance", status: "In Progress", votes: 12, vetos: 0, timestamp: "16/01/2026", author: "Anonymous" },
    { id: 103, description: "Stray dog near the main gate is chasing students.", location: "Main Gate", category: "Security", status: "Resolved", votes: 89, vetos: 2, timestamp: "15/01/2026", author: "User_555" },
    { id: 104, description: "Dustbins in the cafeteria are overflowing.", location: "Cafeteria", category: "Hygiene", status: "Pending", votes: 23, vetos: 0, timestamp: "17/01/2026", author: "User_999" }
];

let complaints = JSON.parse(localStorage.getItem('unity_complaints')) || [];
if (complaints.length === 0) {
    complaints = defaultComplaints; // Pre-fill if empty
    localStorage.setItem('unity_complaints', JSON.stringify(complaints));
}

let settings = JSON.parse(localStorage.getItem('unity_settings')) || {
    orgName: "IIIT Kottayam",
    locations: ["Library", "Floor 1", "Floor 2", "Cafeteria", "Main Gate", "Hostel Block A"]
};

// Detect Role based on Body ID
const currentRole = document.body.id === 'admin' ? 'admin' : 'user';

// --- 2. CORE LOGIC ---
const keywords = {
    "Maintenance": ["leak", "broken", "light", "fan", "tap", "wall", "plumbing", "water"],
    "IT Support": ["wifi", "internet", "password", "computer", "printer", "software", "network"],
    "Security": ["camera", "gate", "guard", "stranger", "theft", "key", "dog", "animal"],
    "Hygiene": ["dirty", "trash", "smell", "cleaning", "washroom", "dust", "bin"]
};

document.addEventListener("DOMContentLoaded", function () {
    renderComplaints();
    
    // Setup Settings if on admin page
    if (document.getElementById('orgName')) {
        document.getElementById('orgName').value = settings.orgName;
        document.getElementById('orgLogic').value = settings.locations.join(', ');
    }
});

function autoCategorize(text) {
    text = text.toLowerCase();
    for (let category in keywords) {
        if (keywords[category].some(key => text.includes(key))) return category;
    }
    return "General";
}

// --- 3. VIEW CONTROLLER ---
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const view = document.getElementById(`${viewName}-view`);
    if(view) view.style.display = 'block';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('view-title').innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    
    if(viewName === 'dashboard' || viewName === 'complaints') renderComplaints();
    if(viewName === 'analytics') renderAnalytics();
}

// --- 4. COMPLAINT ACTIONS ---
if(document.getElementById('complaintForm')) {
    document.getElementById('complaintForm').onsubmit = function(e) {
        e.preventDefault();
        const desc = document.getElementById('compDesc').value;
        const newComplaint = {
            id: Date.now(),
            description: desc,
            location: document.getElementById('compLocation').value,
            anonymous: document.getElementById('compAnon').checked,
            category: autoCategorize(desc),
            status: 'Submitted',
            votes: 0,
            vetos: 0,
            timestamp: new Date().toLocaleDateString(),
            author: document.getElementById('compAnon').checked ? "Anonymous" : "Me"
        };

        complaints.unshift(newComplaint);
        saveData();
        closeModal('complaintModal');
        this.reset();
        
        // UX FEEDBACK
        alert("Success! Complaint filed. The admins have been notified.");
        renderComplaints();
    };
}

function renderComplaints() {
    // Determine which container to use based on visibility
    const isDashboard = document.getElementById('dashboard-view').style.display !== 'none';
    const containerId = isDashboard ? 'recent-list' : 'full-complaint-list';
    const container = document.getElementById(containerId);
    
    if (!container) return;

    let displayList = isDashboard ? complaints.slice(0, 5) : complaints; // Show only 5 on dashboard

    const html = displayList.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase().replace(' ', '-')}">
            <div class="badge">${c.category}</div>
            <span class="badge" style="float:right; background:${getStatusColor(c.status)}; color:white;">${c.status}</span>
            <h4 style="margin: 10px 0;">${c.description}</h4>
            <p style="font-size: 14px; color: #666;">📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</p>
            
            <div class="vote-btns">
                <button class="vote-btn" onclick="vote(${c.id}, 'up')">👍 ${c.votes}</button>
                <button class="vote-btn" onclick="vote(${c.id}, 'down')">👎 ${c.vetos}</button>
                
                ${currentRole === 'admin' ? `
                    <select onchange="updateStatus(${c.id}, this.value)" style="width:140px; margin:0; padding: 5px;">
                        <option value="" disabled selected>Change Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
    updateStats();
}

function getStatusColor(status) {
    if(status === 'Resolved') return '#22c55e';
    if(status === 'Rejected') return '#ef4444';
    if(status === 'In Progress') return '#3b82f6';
    return '#f59e0b'; // Pending
}

function vote(id, type) {
    const comp = complaints.find(c => c.id === id);
    if(type === 'up') comp.votes++;
    else comp.vetos++;
    saveData();
    renderComplaints();
}

function updateStatus(id, status) {
    const comp = complaints.find(c => c.id === id);
    comp.status = status;
    saveData();
    renderComplaints();
}

function sortByVotes() {
    complaints.sort((a, b) => b.votes - a.votes);
    renderComplaints();
    alert("Sorted by hottest topics! 🔥");
}

function filterComplaints() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('filterCategory').value;
    
    const filtered = complaints.filter(c => {
        const matchesText = c.description.toLowerCase().includes(query);
        const matchesCat = cat === 'all' || c.category === cat;
        return matchesText && matchesCat;
    });

    // Manually render filtered list
    const html = filtered.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase()}">
             <div class="badge">${c.category}</div>
             <span class="badge" style="float:right">${c.status}</span>
             <h4>${c.description}</h4>
             <p><small>📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</small></p>
             <div class="vote-btns">
                <button class="vote-btn">👍 ${c.votes}</button>
             </div>
        </div>
    `).join('');
    
    document.getElementById('full-complaint-list').innerHTML = html;
}

// --- 5. ANALYTICS & UTILS ---
function updateStats() {
    document.getElementById('stat-total').innerText = complaints.length;
    document.getElementById('stat-resolved').innerText = complaints.filter(c => c.status === 'Resolved').length;
    document.getElementById('stat-pending').innerText = complaints.filter(c => c.status !== 'Resolved').length;
}

function renderAnalytics() {
    const categories = ["Maintenance", "IT Support", "Security", "Hygiene"];
    const container = document.getElementById('chart-bars');
    if(!container) return;
    container.innerHTML = '';
    
    categories.forEach(cat => {
        const count = complaints.filter(c => c.category === cat).length;
        const height = (count / (complaints.length || 1)) * 100;
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${Math.max(height, 10)}%`; // Min height for visibility
        bar.setAttribute('data-label', `${cat} (${count})`);
        container.appendChild(bar);
    });
}

function saveData() {
    localStorage.setItem('unity_complaints', JSON.stringify(complaints));
}

function openModal(id) { 
    document.getElementById(id).style.display = 'block';
    const locSelect = document.getElementById('compLocation');
    if(locSelect) locSelect.innerHTML = settings.locations.map(l => `<option value="${l}">${l}</option>`).join('');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function saveSettings() {
    settings.orgName = document.getElementById('orgName').value;
    settings.locations = document.getElementById('orgLogic').value.split(',').map(s => s.trim());
    localStorage.setItem('unity_settings', JSON.stringify(settings));
    alert("Settings Saved!");
}

// Live categorization hint
if(document.getElementById('compDesc')){
    document.getElementById('compDesc').onkeyup = function() {
        const cat = autoCategorize(this.value);
        document.querySelector('#categoryHint span').innerText = cat;
    };
}