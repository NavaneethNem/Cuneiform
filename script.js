// --- 0. THEME MANAGEMENT (Must run first) ---
function initTheme() {
    const savedTheme = localStorage.getItem('unity_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('unity_theme', target);
    updateToggleIcon(target);
}

function updateToggleIcon(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.innerText = theme === 'dark' ? '☀️' : '🌙';
}

// Run immediately
initTheme();
// --- 1. INITIALIZATION & FAKE DATA ---
const defaultComplaints = [
    {
        id: 101,
        description: "WiFi in the library is extremely slow.",
        location: "Library",
        category: "IT Support",
        status: "Pending",
        votes: 45,
        vetos: 1,
        timestamp: "17/01/2026",
        author: "User_123",
        isPrivate: false,
        createdByMe: false,
        adminRemark: "",
        comments: [
            { id: 1, text: "Same issue on the 2nd floor!", author: "Student_X", votes: 5, isMyComment: false },
            { id: 2, text: "I think the router is unplugged.", author: "Me", votes: 2, isMyComment: true }
        ]
    },
    {
        id: 102,
        description: "My roommate is playing drums at 2 AM.",
        location: "Block A - Room 101",
        category: "General",
        status: "Rejected",
        votes: 0,
        vetos: 0,
        timestamp: "16/01/2026",
        author: "Anonymous",
        isPrivate: true,
        createdByMe: true,
        adminRemark: "Personal disputes should be handled by the Warden, not this platform.",
        comments: []
    },
    {
        id: 103,
        description: "Stray dog near the main gate is chasing students.",
        location: "Main Gate",
        category: "Security",
        status: "Resolved",
        votes: 89,
        vetos: 2,
        timestamp: "15/01/2026",
        author: "User_555",
        isPrivate: false,
        createdByMe: false,
        adminRemark: "Animal control has been notified.",
        comments: []
    }
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
    if (view) view.style.display = 'block';

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    let title = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    if (viewName === 'my-complaints') title = "My Complaints";
    document.getElementById('view-title').innerText = title;

    if (['dashboard', 'complaints', 'my-complaints'].includes(viewName)) renderComplaints();
    if (viewName === 'analytics') renderAnalytics();
}

// --- 4. COMPLAINT ACTIONS ---
if (document.getElementById('complaintForm')) {
    document.getElementById('complaintForm').onsubmit = function (e) {
        e.preventDefault();
        const desc = document.getElementById('compDesc').value;
        const isAnon = document.getElementById('compAnon').checked;
        const isPrivate = document.getElementById('compPrivate').checked;
        const fileInput = document.getElementById('compMedia');
        const file = fileInput.files[0];

        const processComplaint = (attachments = []) => {
            const newComplaint = {
                id: Date.now(),
                description: desc,
                location: document.getElementById('compLocation').value,
                anonymous: isAnon,
                isPrivate: isPrivate,
                createdByMe: true,
                category: autoCategorize(desc),
                status: 'Submitted',
                votes: 0,
                vetos: 0,
                timestamp: new Date().toLocaleDateString(),
                author: isAnon ? "Anonymous" : "Me",
                adminRemark: "",
                comments: [],
                attachments: attachments
            };

            complaints.unshift(newComplaint);
            saveData();
            closeModal('complaintModal');
            document.getElementById('complaintForm').reset();

            if (isPrivate) alert("Private Complaint Sent! Only Admins can see this.");
            else alert("Complaint filed successfully.");

            renderComplaints();
        };

        if (file) {
            if (file.size > 500 * 1024) {
                alert("File too large! Max 500KB allowed for this prototype.");
                return;
            }
            const reader = new FileReader();
            reader.onload = function (evt) {
                processComplaint([evt.target.result]);
            };
            reader.readAsDataURL(file);
        } else {
            processComplaint([]);
        }
    };
}

// --- 5. RENDER LOGIC (UPDATED WITH COMMENTS) ---
function renderComplaints() {
    const isDashboard = document.getElementById('dashboard-view').style.display !== 'none';
    const isMyComplaints = document.getElementById('my-complaints-view') && document.getElementById('my-complaints-view').style.display !== 'none';

    let containerId;
    if (isDashboard) containerId = 'recent-list';
    else if (isMyComplaints) containerId = 'my-complaint-list';
    else containerId = 'full-complaint-list';

    const container = document.getElementById(containerId);
    if (!container) return;

    let displayList = complaints.filter(c => {
        if (isMyComplaints) return c.createdByMe === true;
        if (currentRole === 'admin') return true;
        if (!c.isPrivate) return true;
        if (c.isPrivate && c.createdByMe) return true;
        return false;
    });

    if (isDashboard) displayList = displayList.slice(0, 5);

    // ✅ FIXED: Removed inline style, added 'private-card' class
    const html = displayList.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase().replace(' ', '-')} ${c.isPrivate ? 'private-card' : ''}">
            <div class="badge">${c.category}</div>
            ${c.isPrivate ? '<span class="badge" style="background:#d946ef; color:white; margin-left:5px;">🔒 Private</span>' : ''}
            <span class="badge" style="float:right; background:${getStatusColor(c.status)}; color:white;">${c.status}</span>
            
            <h4 style="margin: 10px 0;">${c.description}</h4>
            
            ${c.attachments && c.attachments.length > 0 ? `
                <div class="media-grid">
                    ${c.attachments.map(src =>
        src.startsWith('data:video')
            ? `<video src="${src}" controls class="media-attachment"></video>`
            : `<img src="${src}" class="media-attachment" onclick="window.open('${src}')" title="Click to view full size">`
    ).join('')}
                </div>
            ` : ''}
            
            ${c.adminRemark ? `<div class="admin-remark-box"><b>👮 Admin Remark:</b> ${c.adminRemark}</div>` : ''}

            <p style="font-size: 14px; opacity: 0.8;">📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</p>
            
            <div class="vote-btns">
                ${!c.isPrivate ? `<button class="vote-btn" onclick="vote(${c.id}, 'up')">👍 ${c.votes}</button>
                                  <button class="vote-btn" onclick="vote(${c.id}, 'down')">👎 ${c.vetos}</button>`
            : '<small style="opacity:0.7">Votes disabled for private issues</small>'}
                
                <button class="vote-btn" onclick="toggleComments(${c.id})" style="margin-left: 10px;">💬 Comments (${(c.comments || []).length})</button>

                ${currentRole === 'admin' ? `
                    <select onchange="updateStatus(${c.id}, this.value)" style="width:140px; margin:0; padding: 5px; margin-left: auto;">
                        <option value="" disabled selected>Change Status</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                ` : ''}
            </div>

            <div id="comments-${c.id}" class="comments-section">
                ${(c.comments || []).map(comment => `
                    <div class="comment-item">
                        <div class="comment-header">
                            <strong>${comment.author}</strong>
                            <span>${comment.votes} likes</span>
                        </div>
                        <div>${comment.text}</div>
                        <div class="comment-actions">
                            <button class="comment-btn" onclick="voteComment(${c.id}, ${comment.id}, 'up')">🔼</button>
                            <button class="comment-btn" onclick="voteComment(${c.id}, ${comment.id}, 'down')">🔽</button>
                            ${comment.isMyComment ? `<button class="comment-btn delete-btn" onclick="deleteComment(${c.id}, ${comment.id})">Delete</button>` : ''}
                        </div>
                    </div>
                `).join('')}
                
                <div class="add-comment-row">
                    <input type="text" id="input-${c.id}" placeholder="Add a comment..." style="margin:0; flex:1;">
                    <button class="btn-small" onclick="addComment(${c.id})">Post</button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = displayList.length ? html : '<p style="text-align:center; opacity:0.6; padding:20px;">No complaints found.</p>';
    updateStats();
}

// --- 6. ACTIONS & LOGIC ---

function toggleComments(id) {
    const el = document.getElementById(`comments-${id}`);
    if (el.style.display === "none" || el.style.display === "") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
}

function addComment(complaintId) {
    const input = document.getElementById(`input-${complaintId}`);
    const text = input.value.trim();
    if (!text) return;

    const comp = complaints.find(c => c.id === complaintId);
    if (!comp.comments) comp.comments = []; // Safety check

    comp.comments.push({
        id: Date.now(),
        text: text,
        author: currentRole === 'admin' ? 'Admin' : 'Me',
        votes: 0,
        isMyComment: true
    });

    saveData();
    renderComplaints();
    // Re-open the comment section after render
    setTimeout(() => toggleComments(complaintId), 50);
}

function deleteComment(complaintId, commentId) {
    if (!confirm("Delete this comment?")) return;
    const comp = complaints.find(c => c.id === complaintId);
    comp.comments = comp.comments.filter(c => c.id !== commentId);
    saveData();
    renderComplaints();
    setTimeout(() => toggleComments(complaintId), 50);
}

function voteComment(complaintId, commentId, type) {
    const comp = complaints.find(c => c.id === complaintId);
    const comment = comp.comments.find(c => c.id === commentId);
    if (type === 'up') comment.votes++;
    else comment.votes--;
    saveData();
    renderComplaints();
    setTimeout(() => toggleComments(complaintId), 50);
}

function updateStatus(id, newStatus) {
    const comp = complaints.find(c => c.id === id);

    // MANDATORY REMARK FOR REJECTION
    if (newStatus === "Rejected") {
        const reason = prompt("⚠️ REJECTION REASON REQUIRED:\nPlease explain why this complaint is being rejected.");

        if (!reason || reason.trim() === "") {
            alert("❌ Action Cancelled: You must provide a reason to reject a complaint.");
            renderComplaints(); // Reset dropdown
            return;
        }
        comp.adminRemark = reason;
    }
    // OPTIONAL REMARK FOR OTHER STATUS
    else if (currentRole === 'admin' && confirm("Do you want to add an admin remark/note?")) {
        const note = prompt("Enter admin remark:");
        if (note) comp.adminRemark = note;
    }

    comp.status = newStatus;
    saveData();
    renderComplaints();
}

function vote(id, type) {
    const comp = complaints.find(c => c.id === id);
    if (type === 'up') comp.votes++;
    else comp.vetos++;
    saveData();
    renderComplaints();
}

function getStatusColor(status) {
    if (status === 'Resolved') return '#22c55e';
    if (status === 'Rejected') return '#ef4444';
    if (status === 'In Progress') return '#3b82f6';
    return '#f59e0b'; // Pending
}

function sortByVotes() {
    complaints.sort((a, b) => b.votes - a.votes);
    renderComplaints();
    alert("Sorted by hottest topics! 🔥");
}

function filterComplaints() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('filterCategory').value;
    const container = document.getElementById('full-complaint-list');

    const displayList = complaints.filter(c => {
        if (currentRole !== 'admin' && c.isPrivate && !c.createdByMe) return false;
        const matchesText = c.description.toLowerCase().includes(query);
        const matchesCat = cat === 'all' || c.category === cat;
        return matchesText && matchesCat;
    });

    // ✅ FIXED: Same fix here for the search view
    const html = displayList.map(c => `
        <div class="complaint-item status-${c.status.toLowerCase().replace(' ', '-')} ${c.isPrivate ? 'private-card' : ''}">
            <div class="badge">${c.category}</div>
            ${c.isPrivate ? '<span class="badge" style="background:#d946ef; color:white;">🔒 Private</span>' : ''}
            <span class="badge" style="float:right; background:${getStatusColor(c.status)}; color:white;">${c.status}</span>
            <h4>${c.description}</h4>
            ${c.attachments && c.attachments.length > 0 ? '<small>📎 Has Attachment</small>' : ''}
            <p><small>📍 ${c.location} | 👤 ${c.author} | 📅 ${c.timestamp}</small></p>
             <div class="vote-btns">
                ${!c.isPrivate ? `<button class="vote-btn">👍 ${c.votes}</button>` : ''}
             </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// --- 7. UTILS ---
function updateStats() {
    document.getElementById('stat-total').innerText = complaints.length;
    document.getElementById('stat-resolved').innerText = complaints.filter(c => c.status === 'Resolved').length;
    document.getElementById('stat-pending').innerText = complaints.filter(c => c.status !== 'Resolved').length;
}

function renderAnalytics() {
    const categories = ["Maintenance", "IT Support", "Security", "Hygiene"];
    const container = document.getElementById('chart-bars');
    if (!container) return;
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
    if (locSelect) locSelect.innerHTML = settings.locations.map(l => `<option value="${l}">${l}</option>`).join('');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function saveSettings() {
    settings.orgName = document.getElementById('orgName').value;
    settings.locations = document.getElementById('orgLogic').value.split(',').map(s => s.trim());
    localStorage.setItem('unity_settings', JSON.stringify(settings));
    alert("Settings Saved!");
}

if (document.getElementById('compDesc')) {
    document.getElementById('compDesc').onkeyup = function () {
        const cat = autoCategorize(this.value);
        document.querySelector('#categoryHint span').innerText = cat;
    };
}