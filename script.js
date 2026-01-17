// --- 1. INITIALIZATION & FAKE DATA ---
const defaultComplaints = [
    { id: 101, description: "WiFi in the library is extremely slow.", location: "Library", category: "IT Support", status: "Pending", votes: 45, vetos: 1, timestamp: "17/01/2026", author: "User_123", isPrivate: false },
    { id: 102, description: "My roommate is playing drums at 2 AM.", location: "Block A - Room 101", category: "General", status: "Resolved", votes: 0, vetos: 0, timestamp: "16/01/2026", author: "Anonymous", isPrivate: true }, // Private Example
    { id: 103, description: "Stray dog near the main gate is chasing students.", location: "Main Gate", category: "Security", status: "Resolved", votes: 89, vetos: 2, timestamp: "15/01/2026", author: "User_555", isPrivate: false },
    { id: 104, description: "Water leaking from AC unit.", location: "Floor 2", category: "Maintenance", status: "Pending", votes: 12, vetos: 0, timestamp: "17/01/2026", author: "User_999", isPrivate: false }
];

let complaints = JSON.parse(localStorage.getItem('unity_complaints')) || [];
if (complaints.length === 0) {
    complaints = defaultComplaints; 
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
    "Maintenance": ["leak", "broken", "light", "fan", "tap", "wall", "plumbing", "water", "ac"],
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
        const isAnon = document.getElementById('compAnon').checked;
        const isPrivate = document.getElementById('compPrivate').checked;
        
        const newComplaint = {
            id: Date.now(),
            description: desc,
            location: document.getElementById('compLocation').value,
            anonymous: isAnon,
            isPrivate: isPrivate, // Store the private status
            category: autoCategorize(desc),
            status: 'Submitted',
            votes: 0,
            vetos: 0,
            timestamp: new Date().toLocaleDateString(),
            author: isAnon ? "Anonymous" : "Me"
        };

        complaints.unshift(newComplaint);
        saveData();
        closeModal('complaintModal');
        this.reset();
        
        // UX FEEDBACK
        if(isPrivate) alert("Private Complaint Sent! Only Admins can see this.");
        else alert("Complaint filed successfully.");
        
        renderComplaints();
    };
}

function renderComplaints() {
    // Determine which container to use
    const isDashboard = document.getElementById('dashboard-view').style.display !== 'none';
    const containerId = isDashboard ? 'recent-list' : 'full-complaint-list';
    const container = document.getElementById(containerId);
    
    if (!container) return;

    // --- PRIVACY FILTER LOGIC ---
    let displayList = complaints.filter(c => {
        // 1. Admin sees everything
        if (currentRole === 'admin') return true;
        
        // 2. User sees Public complaints
        if (!c.isPrivate) return true;
        
        // 3. User sees their OWN private complaints (Author is 'Me')
        if (c.isPrivate && c.author === 'Me') return true;
        
        // 4. Hide everything else (Other people's private complaints)
        return false;
    });

    if (isDashboard) displayList = displayList.slice(0, 5); // Limit dashboard to 5

    const html = displayList.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase().replace(' ', '-')}" style="${c.isPrivate ? 'border-left: 5px solid #d946ef; background: #fdf4ff;' : ''}">
            <div class="badge">${c.category}</div>
            ${c.isPrivate ? '<span class="badge" style="background:#d946ef; color:white; margin-left:5px;">🔒 Private</span>' : ''}
            <span class="badge" style="float:right; background:${getStatusColor(c.status)}; color:white;">${c.status}</span>
            
            <h4 style="margin: 10px 0;">${c.description}</h4>
            <p style="font-size: 14px; color: #666;">📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</p>
            
            <div class="vote-btns">
                ${!c.isPrivate ? `<button class="vote-btn" onclick="vote(${c.id}, 'up')">👍 ${c.votes}</button>
                                  <button class="vote-btn" onclick="vote(${c.id}, 'down')">👎 ${c.vetos}</button>` 
                               : '<small style="color:#999">Votes disabled for private issues</small>'}
                
                ${currentRole === 'admin' ? `
                    <select onchange="updateStatus(${c.id}, this.value)" style="width:140px; margin:0; padding: 5px; margin-left: auto;">
                        <option value="" disabled selected>Change Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                ` : ''}
            </div>
        </div>
    `).join('');

    if (displayList.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No complaints found.</p>';
    } else {
        container.innerHTML = html;
    }
    
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
    
    // We re-use logic by filtering the main Render loop, but here is a quick manual filter
    // For the demo, simply re-rendering and letting the UI filter is safer, but let's just trigger a re-render
    // Actually, handling search + privacy together is tricky in a simple function. 
    // The easiest hack: Just filter the GLOBAL complaints list temporarily for display? 
    // No, better approach: Just refresh render with search logic inside render?
    // Let's stick to the previous simple implementation but add search logic to RenderComplaints?
    // To keep it "Plug and Play" simple:
    
    const container = document.getElementById('full-complaint-list');
    
    const displayList = complaints.filter(c => {
        // Privacy Check First
        if (currentRole !== 'admin' && c.isPrivate && c.author !== 'Me') return false;
        
        // Then Search/Category
        const matchesText = c.description.toLowerCase().includes(query);
        const matchesCat = cat === 'all' || c.category === cat;
        return matchesText && matchesCat;
    });

    const html = displayList.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase().replace(' ', '-')}" style="${c.isPrivate ? 'border-left: 5px solid #d946ef; background: #fdf4ff;' : ''}">
            <div class="badge">${c.category}</div>
            ${c.isPrivate ? '<span class="badge" style="background:#d946ef; color:white;">🔒 Private</span>' : ''}
            <span class="badge" style="float:right; background:${getStatusColor(c.status)}; color:white;">${c.status}</span>
            <h4>${c.description}</h4>
            <p><small>📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</small></p>
             <div class="vote-btns">
                ${!c.isPrivate ? `<button class="vote-btn">👍 ${c.votes}</button>` : ''}
             </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// --- 5. ANALYTICS & UTILS ---
function updateStats() {
    // Stats should probably count everything for Admin, but maybe hide private ones for users? 
    // Let's keep it simple: Stats show TOTALS regardless of privacy for the demo.
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
        bar.style.height = `${Math.max(height, 10)}%`; 
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

if(document.getElementById('compDesc')){
    document.getElementById('compDesc').onkeyup = function() {
        const cat = autoCategorize(this.value);
        document.querySelector('#categoryHint span').innerText = cat;
    };
}