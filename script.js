import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCxJtir-jd34yg_cpaXvhUU-CduH3LFOnc",
    authDomain: "portfolio-fd6e4.firebaseapp.com",
    projectId: "portfolio-fd6e4",
    storageBucket: "portfolio-fd6e4.appspot.com",
    messagingSenderId: "898143565910",
    appId: "1:898143565910:web:b1067d4c1180624a0e63f7",
    measurementId: "G-P56T8VQZ02"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signupPage = document.getElementById('signupPage');
const loginPage = document.getElementById('loginPage');
const portfolioPage = document.getElementById('portfolioPage');
const loading = document.getElementById('loading');

// Check authentication state
onAuthStateChanged(auth, async (user) => {
    loading.classList.add('hidden');
    if (user) {
        await loadUserData(user);
        showPortfolio();
    } else {
        showSignup();
    }
});

// Toggle between signup and login
document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    signupPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
});

document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    loginPage.classList.add('hidden');
    signupPage.classList.remove('hidden');
});

// Sign Up Form
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorDiv = document.getElementById('signupError');
    const successDiv = document.getElementById('signupSuccess');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        loading.classList.remove('hidden');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await saveUserToDatabase(userCredential.user, name);
        successDiv.textContent = 'Account created successfully!';
        successDiv.style.display = 'block';
        loading.classList.add('hidden');
        document.getElementById('signupForm').reset();
        // Ensure portfolio is shown; onAuthStateChanged will also handle this
        showPortfolio();
    } catch (error) {
        loading.classList.add('hidden');
        console.error('Signup error:', error);
        errorDiv.textContent = getErrorMessage(error.code);
        errorDiv.style.display = 'block';
    }
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.style.display = 'none';

    try {
        loading.classList.remove('hidden');
        await signInWithEmailAndPassword(auth, email, password);
        loading.classList.add('hidden');
        document.getElementById('loginForm').reset();
        showPortfolio();
    } catch (error) {
        loading.classList.add('hidden');
        console.error('Login error:', error);
        errorDiv.textContent = getErrorMessage(error.code);
        errorDiv.style.display = 'block';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert('Error signing out: ' + error.message);
    }
});

// Save user to Firestore
async function saveUserToDatabase(user, customName = null) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userData = {
            name: customName || user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL || '',
            lastLogin: new Date().toISOString()
        };
        await setDoc(userRef, userData, { merge: true });
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

// Load user data
async function loadUserData(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        let displayName = user.displayName;
        if (userDoc.exists()) {
            displayName = userDoc.data().name || displayName;
        }

        document.getElementById('userName').textContent = displayName || 'User';
        document.getElementById('userEmail').textContent = user.email;
        
        if (user.photoURL) {
            document.getElementById('userPhoto').src = user.photoURL;
        } else {
            document.getElementById('userPhoto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&size=150&background=667eea&color=fff`;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function showSignup() {
    signupPage.classList.remove('hidden');
    loginPage.classList.add('hidden');
    portfolioPage.style.display = 'none';
}

function showPortfolio() {
    signupPage.classList.add('hidden');
    loginPage.classList.add('hidden');
    portfolioPage.style.display = 'block';
}

function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please login.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}

