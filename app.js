
// --- DATABASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firebasestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- TELEGRAM INIT ---
const tg = window.Telegram?.WebApp;
tg?.ready();
const tgUser = tg?.initDataUnsafe?.user;
const username = tgUser ? `@${tgUser.username || tgUser.first_name}` : "Guest_" + Math.floor(1000 + Math.random() * 9000);
document.getElementById("userBar").innerText = "👤 User: " + username;

// --- STATE ---
let userData = {
    balance: 0,
    refCode: generateRefCode(),
    referredBy: "",
    totalRefs: 0,
    refEarned: 0,
    totalAds: 0,
    lastAdDate: Date.now()
};

let adsTimer;
let timeLeft = 20;
const REWARD_AMT = 0.00014;

// 150 Psychology Quotes Sample
const quotes = [
    "Invite others to share the joy of earning; psychology says giving is the key to wealth.",
    "Small consistent steps lead to giant leaps in your bank balance.",
    "Your brain releases dopamine when you achieve small goals. Keep clicking!",
    "Success is 80% mindset and 20% mechanics.",
    "The best way to predict the future is to create it, one ad at a time."
];

// --- CORE APP ---
function init() {
    loadUserData();
    startTime();
    startOnlineStats();
    autoInAppAds();
}

function loadUserData() {
    db.ref('users/' + username).on('value', (snap) => {
        if (snap.exists()) {
            userData = snap.val();
        } else {
            db.ref('users/' + username).set(userData);
        }
        updateUI();
    });
}

function updateUI() {
    document.getElementById('user-balance').innerText = userData.balance.toFixed(5);
    document.getElementById('my-code').innerText = userData.refCode;
    document.getElementById('total-refs').innerText = userData.totalRefs;
    document.getElementById('total-ref-earn').innerText = "$" + userData.refEarned.toFixed(5);
    if (userData.referredBy) document.getElementById('refer-input-area').classList.add('hidden');
}

// --- ADS LOGIC ---
function triggerAds(title) {
    // Cooldown check
    if (userData.totalAds >= 30000 && (Date.now() - userData.lastAdDate < 300000)) {
        alert("Cooldown! 5 min break after 30,000 ads.");
        return;
    }

    // 1. Show Monetag (External)
    if (typeof show_8884351 === 'function') show_8884351();

    // 2. Open Adterra Link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    // 3. Show Timer Overlay
    document.getElementById('ad-type-title').innerText = title;
    document.getElementById('ad-overlay').classList.remove('hidden');
    document.getElementById('claim-btn-area').classList.add('hidden');
    
    timeLeft = 20;
    startTimer();
}

function startTimer() {
    clearInterval(adsTimer);
    adsTimer = setInterval(() => {
        if (!document.hidden) {
            timeLeft--;
            document.getElementById('timer-count').innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(adsTimer);
                document.getElementById('finishSound').play();
                document.getElementById('claim-btn-area').classList.remove('hidden');
            }
        }
    }, 1000);
}

function claimReward() {
    // Show Adterra SDK Rewarded
    const sdk = Math.random() > 0.5 ? show_10555663 : show_10830602;
    sdk().then(() => {
        // Credit User
        let bonus = 0;
        userData.balance += REWARD_AMT;
        userData.totalAds++;
        userData.lastAdDate = Date.now();

        // 12% Referral Bonus Logic
        if (userData.referredBy) {
            const refBonus = REWARD_AMT * 0.12;
            db.ref('users/' + userData.referredBy).transaction(refUser => {
                if (refUser) {
                    refUser.balance = (refUser.balance || 0) + refBonus;
                    refUser.refEarned = (refUser.refEarned || 0) + refBonus;
                }
                return refUser;
            });
        }

        db.ref('users/' + username).update(userData);
        document.getElementById('ad-overlay').classList.add('hidden');
        document.getElementById('quote-box').innerText = quotes[Math.floor(Math.random() * quotes.length)];
        alert(`CONGRATULATIONS!\nReward: $${REWARD_AMT} added.\nKeep inviting to grow faster!`);
        showSection('home');
    });
}

// --- REFERRAL SYSTEM ---
function generateRefCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let res = "";
    for(let i=0; i<6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
}

function registerReferral() {
    const code = document.getElementById('ref-code-input').value.toUpperCase();
    if (code === userData.refCode) return alert("You can't refer yourself!");

    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const referrerId = Object.keys(snap.val())[0];
            userData.referredBy = referrerId;
            db.ref('users/' + referrerId + '/totalRefs').transaction(t => (t || 0) + 1);
            db.ref('users/' + username).update(userData);
            alert("Registered successfully! You are now part of a team.");
        } else {
            alert("Invalid Code!");
        }
    });
}

// --- WITHDRAWAL ---
function requestWithdraw() {
    const amt = 0.02;
    if (userData.balance < amt) return alert("Minimum balance $0.02 required.");
    
    const request = {
        user: username,
        email: document.getElementById('wd-email').value,
        name: document.getElementById('wd-name').value,
        number: document.getElementById('wd-number').value,
        method: document.getElementById('wd-method').value,
        amount: userData.balance,
        time: new Date().toLocaleString(),
        status: 'pending'
    };

    if (!request.email || !request.number) return alert("Please fill all fields.");

    db.ref('withdrawals').push(request);
    db.ref('users/' + username + '/balance').set(0);
    alert("Request Sent! Pending Admin approval.");
}

// --- ADMIN PANEL ---
function loginAdmin() {
    const pass = document.getElementById('admin-password').value;
    if (pass === "Propetas12") {
        document.getElementById('admin-login-area').classList.add('hidden');
        document.getElementById('admin-main-panel').classList.remove('hidden');
        fetchAdminData();
    } else {
        alert("Wrong Password!");
    }
}

function fetchAdminData() {
    db.ref('withdrawals').on('value', snap => {
        const list = document.getElementById('admin-list');
        list.innerHTML = "";
        snap.forEach(child => {
            const data = child.val();
            if (data.status === 'pending') {
                list.innerHTML += `
                    <div class="bg-slate-800 p-4 rounded-xl border-l-4 border-yellow-500 text-xs">
                        <p><b>User:</b> ${data.user}</p>
                        <p><b>Acc Name:</b> ${data.name}</p>
                        <p><b>Number:</b> ${data.number} (${data.method})</p>
                        <p><b>Amount:</b> $${data.amount.toFixed(5)}</p>
                        <div class="flex gap-2 mt-3">
                            <button onclick="updateWD('${child.key}', 'Approved')" class="bg-green-600 px-4 py-1 rounded">Approve</button>
                            <button onclick="updateWD('${child.key}', 'Denied', '${data.user}', ${data.amount})" class="bg-red-600 px-4 py-1 rounded">Deny</button>
                        </div>
                    </div>
                `;
            }
        });
    });
}

function updateWD(key, status, userToRefund, amt) {
    db.ref('withdrawals/' + key).update({ status: status });
    if (status === 'Denied') {
        db.ref('users/' + userToRefund + '/balance').transaction(b => (b || 0) + amt);
    }
}

// --- UTILS ---
function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('sec-' + id).classList.remove('hidden');
    if (id !== 'admin') toggleMenu();
}

function setTheme(color) { document.body.style.backgroundColor = color; }

function startTime() {
    const now = new Date();
    document.getElementById('footer-time').innerText = now.toDateString() + " | " + now.toLocaleTimeString();
    setTimeout(startTime, 1000);
}

function startOnlineStats() {
    setInterval(() => {
        db.ref('online/' + username).set(Date.now());
        db.ref('online').once('value', snap => {
            let count = 0;
            const now = Date.now();
            snap.forEach(u => { if (now - u.val() < 10000) count++; });
            document.getElementById('online-users').innerText = count;
        });
        db.ref('users').once('value', snap => {
            document.getElementById('total-reg').innerText = snap.numChildren();
            let sum = 0;
            snap.forEach(u => sum += (u.val().balance || 0));
            document.getElementById('total-income').innerText = sum.toFixed(2);
        });
    }, 5000);
}

function autoInAppAds() {
    setInterval(() => {
        if (typeof show_10555746 === 'function') {
            show_10555746({ type: 'inApp', inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } });
        }
    }, 180000);
}

// --- FAMILY TASKS ---
function addFamilyTask() {
    const url = document.getElementById('task-url').value;
    if (!url.includes("t.me")) return alert("Only Telegram links allowed!");
    if (userData.balance < 0.02) return alert("Need $0.02 to post.");

    db.ref('tasks').push({ url: url, owner: username });
    db.ref('users/' + username + '/balance').transaction(b => b - 0.02);
    alert("Task Posted! Visible to others for 12 hours.");
}

init();
