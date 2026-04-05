
// --- CONFIGURATION ---
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

// --- STATE ---
let user = {
    username: "Guest_" + Math.floor(Math.random() * 9999),
    balance: 0,
    refCode: generateRefCode(),
    referredBy: null,
    referralsCount: 0,
    referralEarnings: 0,
    totalAdsClicked: 0,
    lastAdTime: 0
};

let adTimer;
let timeLeft = 20;
let currentReward = 0.00014;
const ADMIN_PASS = "Propetas12";

// Psychology Quotes (Sample of 150)
const quotes = [
    "Your potential is limited only by your imagination.",
    "The mind is everything. What you think you become.",
    "Invite others to share the wealth, and the wealth will multiply.",
    "Success is the sum of small efforts repeated daily.",
    "Psychology says: Action leads to motivation, not the other way around."
];

// --- INITIALIZATION ---
function init() {
    setupTelegram();
    loadUser();
    startTime();
    startOnlineTracker();
    startAutoAds();
    showRandomQuote();
}

function setupTelegram() {
    try {
        const tg = window.Telegram.WebApp;
        if (tg.initDataUnsafe?.user?.username) {
            user.username = tg.initDataUnsafe.user.username;
        }
        tg.expand();
    } catch (e) {}
    document.getElementById('tg-username').innerText = "@" + user.username;
}

function generateRefCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// --- ADS LOGIC ---
function triggerAdTask(type) {
    const now = Date.now();
    if (user.totalAdsClicked >= 30000 && now - user.lastAdTime < 300000) {
        alert("Cooldown active! Wait 5 minutes.");
        return;
    }

    // MONETAG INTERSTITIAL (Simulated call)
    if (typeof show_8884351 === 'function') show_8884351();

    // ADTERRA REWARDED SDK CALLS
    const sdk = Math.random() > 0.5 ? show_10555663 : show_10830602;
    sdk().then(() => {
        window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");
        startTimer(type);
    });
}

function startTimer(type) {
    document.getElementById('ad-title').innerText = type;
    document.getElementById('ad-overlay').classList.remove('hidden');
    document.getElementById('claim-box').classList.add('hidden');
    timeLeft = 20;
    
    adTimer = setInterval(() => {
        if (!document.hidden) {
            timeLeft--;
            document.getElementById('timer-text').innerText = timeLeft;
            let offset = 377 - (timeLeft * (377 / 20));
            document.getElementById('timer-circle').style.strokeDashoffset = offset;

            if (timeLeft <= 0) {
                clearInterval(adTimer);
                document.getElementById('beep-sound').play();
                document.getElementById('claim-box').classList.remove('hidden');
            }
        }
    }, 1000);
}

function claimAdReward() {
    user.balance += currentReward;
    user.totalAdsClicked++;
    user.lastAdTime = Date.now();

    // 12% Referral Bonus Logic
    if (user.referredBy) {
        const bonus = currentReward * 0.12;
        db.ref('users/' + user.referredBy).transaction(refUser => {
            if (refUser) {
                refUser.balance = (refUser.balance || 0) + bonus;
                refUser.referralEarnings = (refUser.referralEarnings || 0) + bonus;
            }
            return refUser;
        });
    }

    saveUser();
    updateUI();
    document.getElementById('ad-overlay').classList.add('hidden');
    showSection('home');
    showRandomQuote();
    alert(`Congratulations! $${currentReward} credited.\nKeep inviting!`);
}

// --- REFERRAL LOGIC ---
function applyReferral() {
    const code = document.getElementById('ref-input').value.toUpperCase();
    if (code === user.refCode) return alert("Cannot use own code");
    
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            user.referredBy = Object.keys(snap.val())[0];
            db.ref('users/' + user.referredBy + '/referralsCount').transaction(c => (c || 0) + 1);
            alert("Referral Registered! 12% Bonus active.");
            document.getElementById('ref-register-box').classList.add('hidden');
            saveUser();
            updateUI();
        } else {
            alert("Invalid Code");
        }
    });
}

// --- WITHDRAWAL ---
function requestWithdrawal() {
    const email = document.getElementById('wd-email').value;
    const name = document.getElementById('wd-name').value;
    const gcash = document.getElementById('wd-gcash').value;
    const method = document.getElementById('wd-method').value;

    if (user.balance < 0.02) return alert("Minimum $0.02 required.");
    if (!email || !gcash) return alert("Please fill all fields.");

    const req = {
        user: user.username,
        email, name, gcash, method,
        amount: user.balance,
        time: new Date().toLocaleString(),
        status: 'pending'
    };

    db.ref('withdrawals').push(req);
    user.balance = 0;
    saveUser();
    alert("Request Submitted!");
}

// --- ADMIN ---
function loginAdmin() {
    if (document.getElementById('admin-pass').value === ADMIN_PASS) {
        document.getElementById('admin-auth').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadAdminRequests();
    }
}

function loadAdminRequests() {
    db.ref('withdrawals').on('value', snap => {
        const div = document.getElementById('admin-requests');
        div.innerHTML = "";
        snap.forEach(child => {
            const r = child.val();
            if (r.status === 'pending') {
                div.innerHTML += `
                    <div class="bg-gray-800 p-3 rounded border-l-4 border-yellow-500 text-xs">
                        <p><b>User:</b> ${r.user} | ${r.email}</p>
                        <p><b>Account:</b> ${r.name} (${r.gcash})</p>
                        <p><b>Method:</b> ${r.method} | <b>Amount:</b> $${r.amount.toFixed(5)}</p>
                        <p class="text-gray-500">${r.time}</p>
                        <div class="flex gap-2 mt-2">
                            <button onclick="updateStatus('${child.key}', 'Approved')" class="bg-green-600 px-4 py-1 rounded">Approve</button>
                            <button onclick="updateStatus('${child.key}', 'Denied', '${r.user}', ${r.amount})" class="bg-red-600 px-4 py-1 rounded">Deny</button>
                        </div>
                    </div>
                `;
            }
        });
    });
}

function updateStatus(key, status, username, refund) {
    db.ref('withdrawals/' + key).update({ status });
    if (status === 'Denied') {
        db.ref('users/' + username + '/balance').transaction(b => (b || 0) + refund);
    }
    if (status === 'Approved') {
        db.ref('global_income').transaction(i => (i || 0) + 0.10); // Mock system income
    }
}

// --- HELPERS ---
function toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); }

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('sec-' + id).classList.remove('hidden');
    toggleMenu();
}

function setTheme(color) { document.body.style.backgroundColor = color; }

function saveUser() { db.ref('users/' + user.username).set(user); }

function loadUser() {
    db.ref('users/' + user.username).on('value', snap => {
        if (snap.exists()) {
            user = snap.val();
            updateUI();
        } else {
            saveUser();
        }
    });
}

function updateUI() {
    document.getElementById('user-balance').innerText = user.balance.toFixed(5);
    document.getElementById('my-ref-code').innerText = user.refCode;
    document.getElementById('count-ref').innerText = user.referralsCount || 0;
    document.getElementById('earned-ref').innerText = "$" + (user.referralEarnings || 0).toFixed(5);
    if (user.referredBy) document.getElementById('ref-register-box').classList.add('hidden');
}

function startOnlineTracker() {
    setInterval(() => {
        db.ref('online/' + user.username).set(Date.now());
        db.ref('online').once('value', snap => {
            const now = Date.now();
            let count = 0;
            snap.forEach(u => { if (now - u.val() < 10000) count++; });
            document.getElementById('stat-online').innerText = count;
        });
        db.ref('users').once('value', snap => {
            document.getElementById('stat-reg').innerText = snap.numChildren();
        });
        db.ref('global_income').on('value', snap => {
            document.getElementById('stat-income').innerText = (snap.val() || 0).toFixed(2);
        });
    }, 5000);
}

function startAutoAds() {
    setInterval(() => {
        show_10555746({ type: 'inApp', inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } });
    }, 180000); // 3 minutes
}

function startTime() {
    const now = new Date();
    document.getElementById('footer-time').innerText = now.toDateString() + " | " + now.toLocaleTimeString();
    setTimeout(startTime, 1000);
}

function showRandomQuote() {
    document.getElementById('quote-display').innerText = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

init();
