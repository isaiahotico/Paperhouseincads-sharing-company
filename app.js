
// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firebasestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ================= TELEGRAM INITIALIZATION ================= */
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const tgUser = tg?.initDataUnsafe?.user;
const username = tgUser ? `@${tgUser.username || tgUser.first_name}` : "Guest_User";
const userId = tgUser ? tgUser.id : "local_test_user";

// Immediately display username
document.getElementById("userBar").innerText = "👤 User: " + username;

// State
let userData = {
    balance: 0,
    clicks: 0,
    lastCooldown: 0,
    refCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    refCount: 0,
    refEarned: 0
};

/* ================= DATABASE SYNC ================= */
const userRef = db.ref('users/' + userId);

// Initial Load & Listen
userRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        userData = data;
        updateUI();
    } else {
        // New User Registration
        userRef.set(userData);
    }
});

// Sync Global Stats
db.ref('stats').on('value', (snap) => {
    const stats = snap.val() || { totalUsers: 1240, totalPaid: 45.50 };
    document.getElementById('total-users').innerText = stats.totalUsers.toLocaleString();
    document.getElementById('total-income').innerText = stats.totalPaid.toFixed(2);
});

function updateUI() {
    document.getElementById('user-balance').innerText = userData.balance.toFixed(5) + " USDT";
    document.getElementById('ref-code-display').innerText = userData.refCode;
    document.getElementById('ref-count').innerText = userData.refCount;
    document.getElementById('ref-earned').innerText = userData.refEarned.toFixed(5);
    renderWithdrawHistory();
}

/* ================= ADS LOGIC ================= */
let adTimerInterval;
let timeLeft = 20;

function startAdProcess(type) {
    const now = Date.now();
    if (userData.clicks >= 30000 && (now - userData.lastCooldown) < 300000) {
        alert("Cooldown active! Wait 5 minutes.");
        return;
    }

    // Adterra Direct Link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    document.getElementById('ad-overlay').classList.remove('hidden');
    document.getElementById('claim-btn').classList.add('hidden');
    timeLeft = 20;
    document.getElementById('ad-timer').innerText = timeLeft;

    adTimerInterval = setInterval(() => {
        if (!document.hidden) {
            timeLeft--;
            document.getElementById('ad-timer').innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(adTimerInterval);
                finishAd();
            }
        }
    }, 1000);
}

function finishAd() {
    new Audio('https://actions.google.com/sounds/v1/notifications/beep.ogg').play();
    document.getElementById('claim-btn').classList.remove('hidden');
    
    // Show Random Monetag Ad
    const zone = Math.random() > 0.5 ? '10555663' : '10830602';
    if(window[`show_${zone}`]) window[`show_${zone}`]().then(() => console.log("SDK Ad Shown"));
}

function claimAdReward() {
    const reward = 0.00014;
    userData.balance += reward;
    userData.clicks += 1;
    if (userData.clicks % 30000 === 0) userData.lastCooldown = Date.now();
    
    userRef.update(userData);
    document.getElementById('ad-overlay').classList.add('hidden');
    alert(`Success! ${reward} USDT Added. Keep inviting!`);
}

/* ================= WITHDRAWAL SYSTEM ================= */
function requestWithdrawal() {
    const amount = parseFloat(document.getElementById('wd-amount').value);
    const method = document.getElementById('wd-method').value;
    const name = document.getElementById('wd-name').value;
    const details = document.getElementById('wd-details').value;

    if (amount < 0.02 || amount > userData.balance) {
        alert("Min 0.02 USDT / Insufficient Balance");
        return;
    }

    const wdRequest = {
        userId, username, amount, method, name, details,
        status: 'Pending',
        time: new Date().toLocaleString()
    };

    db.ref('withdrawals').push(wdRequest);
    userData.balance -= amount;
    userRef.update({ balance: userData.balance });
    alert("Request Sent! Manual approval takes 1-12 hours.");
}

function renderWithdrawHistory() {
    db.ref('withdrawals').orderByChild('userId').equalTo(userId).once('value', (snap) => {
        const hist = snap.val();
        const container = document.getElementById('wd-history');
        if (!hist) { container.innerHTML = "No requests yet."; return; }
        
        container.innerHTML = Object.values(hist).map(w => `
            <div class="flex justify-between border-b py-1">
                <span>${w.amount} USDT via ${w.method}</span>
                <b class="${w.status === 'Pending' ? 'text-orange-500' : 'text-green-500'}">${w.status}</b>
            </div>
        `).join('');
    });
}

/* ================= FAMILY TASKS ================= */
function postTask() {
    const link = document.getElementById('task-link-input').value;
    if(!link.includes('t.me/')) return alert("Enter valid Telegram link");
    
    db.ref('tasks').push({
        link: link,
        postedBy: userId,
        expiry: Date.now() + (12 * 60 * 60 * 1000)
    });
    alert("Link Posted for 12 Hours!");
}

db.ref('tasks').on('value', (snap) => {
    const tasks = snap.val();
    const container = document.getElementById('active-tasks');
    container.innerHTML = "";
    if(!tasks) return;

    Object.entries(tasks).forEach(([key, t]) => {
        if(t.expiry < Date.now()) {
            db.ref('tasks/' + key).remove();
            return;
        }
        const div = document.createElement('div');
        div.className = "bg-white p-3 rounded shadow flex justify-between items-center";
        div.innerHTML = `
            <span class="text-[10px] truncate w-2/3 text-blue-600">${t.link}</span>
            <button onclick="clickTask('${t.link}', '${key}')" class="bg-gray-800 text-white text-[10px] px-4 py-1 rounded">VISIT</button>
        `;
        container.appendChild(div);
    });
});

function clickTask(link, key) {
    window.open(link, "_blank");
    // Reward for watching link
    userData.balance += 0.00005;
    userRef.update({ balance: userData.balance });
    alert("Task complete! Reward credited.");
}

/* ================= ADMIN SYSTEM ================= */
function openAdmin() {
    showSection('admin-section');
}

function authAdmin() {
    if (document.getElementById('admin-pass').value === "Propetas12") {
        document.getElementById('admin-auth').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        loadAdminList();
    } else {
        alert("Unauthorized Access");
    }
}

function loadAdminList() {
    db.ref('withdrawals').on('value', (snap) => {
        const list = snap.val();
        const container = document.getElementById('admin-wd-list');
        container.innerHTML = "";
        if(!list) return;

        Object.entries(list).forEach(([key, w]) => {
            if(w.status === 'Pending') {
                const div = document.createElement('div');
                div.className = "bg-gray-50 p-3 rounded border text-[10px]";
                div.innerHTML = `
                    <p><b>USER:</b> ${w.username} (${w.userId})</p>
                    <p><b>INFO:</b> ${w.name} | ${w.details}</p>
                    <p><b>AMOUNT:</b> ${w.amount} ${w.method}</p>
                    <p><b>TIME:</b> ${w.time}</p>
                    <div class="mt-2 flex gap-2">
                        <button onclick="updateWdStatus('${key}', 'Approved')" class="bg-green-600 text-white px-3 py-1 rounded">APPROVE</button>
                        <button onclick="updateWdStatus('${key}', 'Denied')" class="bg-red-600 text-white px-3 py-1 rounded">DENY</button>
                    </div>
                `;
                container.appendChild(div);
            }
        });
    });
}

function updateWdStatus(key, status) {
    db.ref('withdrawals/' + key).update({ status: status });
}

/* ================= UTILS ================= */
function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function setTheme(bg, accent) {
    document.body.style.backgroundColor = bg;
    document.getElementById('mainHeader').style.borderBottom = `4px solid ${accent}`;
}

// Stats & Clock
setInterval(() => {
    document.getElementById('footer-date-time').innerText = new Date().toLocaleString();
    document.getElementById('online-users').innerText = Math.floor(Math.random() * (200 - 100) + 100);
}, 1000);

// Auto Show In-App Ads
setInterval(() => {
    if(window.show_10555746) {
        show_10555746({ type: 'inApp', inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } });
    }
}, 180000);
