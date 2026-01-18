
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAP2Tv0k7cS9TDuDVX1ZQpokrBU4KFJQ1A",
    authDomain: "arnedev-cuneiform.firebaseapp.com",
    projectId: "arnedev-cuneiform",
    storageBucket: "arnedev-cuneiform.firebasestorage.app",
    messagingSenderId: "120581326142",
    appId: "1:120581326142:web:275e51ff9c608f2fee586f",
    measurementId: "G-TLREEMLRWG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const DataService = {
    // --- AUTHENTICATION ---
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.message };
        }
    },

    signup: async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update Profile with Name
            await updateProfile(userCredential.user, {
                displayName: name
            });
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Signup Error:", error);
            return { success: false, message: error.message };
        }
    },

    logout: async () => {
        await signOut(auth);
        localStorage.removeItem('currentUser'); // Clear legacy localstorage if present
    },

    observeAuth: (callback) => {
        onAuthStateChanged(auth, callback);
    },

    getUser: () => {
        return auth.currentUser;
    },

    // --- FIRESTORE DATABASE ---

    // Add a new complaint
    addComplaint: async (complaintData) => {
        try {
            const docRef = await addDoc(collection(db, "complaints"), {
                ...complaintData,
                timestamp: Date.now() // Ensure server-ish timestamp
            });
            console.log("Complaint written with ID: ", docRef.id);
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    seedData: async () => {
        const demoData = [
            {
                description: "WiFi in the library is extremely slow.",
                location: "Library",
                category: "IT Support",
                status: "Pending",
                votes: 45,
                vetos: 1,
                timestamp: Date.now(),
                author: "Demo Student",
                userId: "demo_user",
                isPrivate: false,
                adminRemark: "",
                comments: [
                    { id: 1, text: "Same issue!", author: "Student X", votes: 5, userId: "other" }
                ],
                aiAnalysis: { sentiment: "Neutral 😐", urgency: "Low" }
            },
            {
                description: "Water leak in Block A washroom.",
                location: "Hostel Block A",
                category: "Maintenance",
                status: "Resolved",
                votes: 12,
                vetos: 0,
                timestamp: Date.now() - 86400000,
                author: "Demo Student",
                userId: "demo_user",
                isPrivate: false,
                adminRemark: "Fixed by plumbing team.",
                comments: [],
                aiAnalysis: { sentiment: "Urgent ⚠️", urgency: "High" }
            }
        ];

        for (const data of demoData) {
            await addDoc(collection(db, "complaints"), data);
        }
        return true;
    },

    // Get all complaints (Real-time listener)
    // Usage: DataService.listenToComplaints((complaints) => { updateUI(complaints) })
    listenToComplaints: (callback) => {
        const q = query(collection(db, "complaints"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const complaints = [];
            querySnapshot.forEach((doc) => {
                complaints.push({ id: doc.id, ...doc.data() });
            });
            callback(complaints);
        });
        return unsubscribe; // Call this to stop listening
    },

    // Update Upvote Count
    upvoteComplaint: async (id, currentVotes) => {
        const docRef = doc(db, "complaints", id);
        await updateDoc(docRef, {
            votes: currentVotes + 1
        });
    },

    // Resolve/Update Status
    updateStatus: async (id, newStatus, remark) => {
        const docRef = doc(db, "complaints", id);
        const updateData = { status: newStatus };
        if (remark) updateData.adminRemark = remark;

        await updateDoc(docRef, updateData);
    },

    // Add Comment (Appending to array is simpler for now, subcollections ideally later)
    addComment: async (id, comment, oldComments = []) => {
        const docRef = doc(db, "complaints", id);
        const updatedComments = [...oldComments, comment];
        await updateDoc(docRef, {
            comments: updatedComments
        });
    },

    // Vote on Comment (Read-Modify-Write entire array)
    voteComment: async (complaintId, commentId, type, oldComments) => {
        const docRef = doc(db, "complaints", complaintId);
        const updatedComments = oldComments.map(c => {
            if (c.id === commentId) {
                return { ...c, votes: type === 'up' ? c.votes + 1 : c.votes - 1 };
            }
            return c;
        });
        await updateDoc(docRef, { comments: updatedComments });
    },

    // Delete Comment (Read-Modify-Write)
    deleteComment: async (complaintId, commentId, oldComments) => {
        const docRef = doc(db, "complaints", complaintId);
        const updatedComments = oldComments.filter(c => c.id !== commentId);
        await updateDoc(docRef, { comments: updatedComments });
    }
};

// Expose for debugging if needed
window.DataService = DataService;
