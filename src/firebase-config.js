// استيراد الدوال الأساسية من Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // لاستخدام المصادقة
import { getFirestore, setLogLevel } from "firebase/firestore"; // لاستخدام Firestore

// تكوين Firebase الخاص بك (الواجهة الأمامية)
const firebaseConfig = {
 apiKey: "AIzaSyDh2miXzTIza7u85ygQMgPnvGnjNa13WAM",
 authDomain: "giftsbot-eslam.firebaseapp.com",
 projectId: "giftsbot-eslam",
 storageBucket: "giftsbot-eslam.firebasestorage.app",
 messagingSenderId: "61353800748",
 appId: "1:61353800748:web:6a4bc3ce09f5bb4db70d89"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير خدمات Firebase التي سيتم استخدامها في تطبيق React
export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseApp = app; // تصدير كائن التطبيق نفسه إذا لزم الأمر
export const firestoreAppId = firebaseConfig.appId; // تصدير الـ appId مباشرة

// (اختياري) لتعطيل رسائل log من Firebase في الـ console (تفعيل هذا قد يجعل تصحيح الأخطاء أصعب)
// setLogLevel('silent');