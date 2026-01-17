// --- State Management ---
let complaints = JSON.parse(localStorage.getItem('unity_complaints')) || [];
let settings = JSON.parse(localStorage.getItem('unity_settings')) || {
    orgName: "Global Campus",
    locations: ["Floor 1", "Floor 2", "Block A", "Block B"]
};
let currentRole = 'user';

// --- Smart Categorization Logic ---
const keywords = {
    "Maintenance": ["leak", "broken", "light", "fan", "tap", "wall", "plumbing"],
    "IT Support": ["wifi", "internet", "password", "computer", "printer", "software"],
    "Security": ["camera", "gate", "guard", "stranger", "theft", "key"],
    "Hygiene": ["dirty", "trash", "smell", "cleaning", "washroom", "dust"]
};
document.addEventListener("DOMContentLoaded", function () {

  if (document.body.id === "admin") {
    // ✅ runs ONLY on admin.html
    toggleRole();
  }
});
function autoCategorize(text) {
    text = text.toLowerCase();
    for (let category in keywords) {
        if (keywords[category].some(key => text.includes(key))) return category;
    }
    return "General";
}

// --- View Controller ---
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(`${viewName}-view`).style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('view-title').innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    
    if(viewName === 'dashboard' || viewName === 'complaints') renderComplaints();
    if(viewName === 'analytics') renderAnalytics();
}

function toggleRole() {
    currentRole = "admin";
    renderComplaints();
}

// --- Complaint Logic ---
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
        author: document.getElementById('compAnon').checked ? "Anonymous" : "User_123"
    };

    complaints.unshift(newComplaint);
    localStorage.setItem('unity_complaints', JSON.stringify(complaints));
    closeModal('complaintModal');
    this.reset();
    renderComplaints();
};

function renderComplaints() {
    const listHtml = complaints.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase()}">
            <div class="badge">${c.category}</div>
            <span class="badge" style="float:right">${c.status}</span>
            <h4>${c.description}</h4>
            <p><small>📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</small></p>
            
            <div class="vote-btns">
                <button class="vote-btn" onclick="vote(${c.id}, 'up')">👍 ${c.votes}</button>
                <button class="vote-btn" onclick="vote(${c.id}, 'down')">👎 ${c.vetos}</button>
                ${currentRole === 'admin' ? `
                    <select onchange="updateStatus(${c.id}, this.value)" style="width:120px; margin:0">
                        <option>Update Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                ` : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('recent-list').innerHTML = listHtml;
    document.getElementById('full-complaint-list').innerHTML = listHtml;
    updateStats();
}

function vote(id, type) {
    const comp = complaints.find(c => c.id === id);
    if(type === 'up') comp.votes++;
    else comp.vetos++;
    localStorage.setItem('unity_complaints', JSON.stringify(complaints));
    renderComplaints();
}

function updateStatus(id, status) {
    const comp = complaints.find(c => c.id === id);
    comp.status = status;
    localStorage.setItem('unity_complaints', JSON.stringify(complaints));
    renderComplaints();
}

// --- Analytics & Stats ---
function updateStats() {
    document.getElementById('stat-total').innerText = complaints.length;
    document.getElementById('stat-resolved').innerText = complaints.filter(c => c.status === 'Resolved').length;
    document.getElementById('stat-pending').innerText = complaints.filter(c => c.status !== 'Resolved').length;
}

function renderAnalytics() {
    const categories = ["Maintenance", "IT Support", "Security", "Hygiene"];
    const container = document.getElementById('chart-bars');
    container.innerHTML = '';
    
    categories.forEach(cat => {
        const count = complaints.filter(c => c.category === cat).length;
        const height = (count / (complaints.length || 1)) * 100;
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${height + 10}%`;
        bar.setAttribute('data-label', `${cat} (${count})`);
        container.appendChild(bar);
    });
}

// --- Helpers & Setup ---
function openModal(id) { 
    document.getElementById(id).style.display = 'block';
    // Populate locations
    const locSelect = document.getElementById('compLocation');
    locSelect.innerHTML = settings.locations.map(l => `<option value="${l}">${l}</option>`).join('');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function saveSettings() {
    settings.orgName = document.getElementById('orgName').value;
    settings.locations = document.getElementById('orgLogic').value.split(',').map(s => s.trim());
    localStorage.setItem('unity_settings', JSON.stringify(settings));
    alert("Settings Saved!");
}

// Live categorization hint
document.getElementById('compDesc').onkeyup = function() {
    const cat = autoCategorize(this.value);
    document.querySelector('#categoryHint span').innerText = cat;
};

// Initial Load
window.onload = () => {
    document.getElementById('orgName').value = settings.orgName;
    document.getElementById('orgLogic').value = settings.locations.join(', ');
    renderComplaints();
};