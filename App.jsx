import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  List, 
  Target, 
  Trophy, 
  Heart, 
  X, 
  Play, 
  Pause,
  ChevronLeft,
  Loader2,
  LayoutGrid,
  Quote,
  Book,
  Type,
  ChevronDown,
  Maximize2,
  Library as LibraryIcon,
  Flame,
  Sparkles,
  Plus,
  Check,
  ArrowRight
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { SignIn } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, orderBy, limit, getDocs, getDoc, where } from 'firebase/firestore';

// --- CONFIGURATION ---
const ESV_API_KEY = "be4a8a6c93a524afa025790a3ed6fcfaea2431ec";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", 
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", 
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", 
  "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", 
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", 
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const BIBLE_DATA = {
  "Genesis": [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 67, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26],
  "Exodus": [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38],
  "Leviticus": [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34],
  "Numbers": [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13],
  "Deuteronomy": [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12],
  "Joshua": [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33],
  "Judges": [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25],
  "Ruth": [22, 23, 18, 22],
  "1 Samuel": [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 28, 22, 44, 25, 12, 25, 11, 31, 13],
  "2 Samuel": [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25],
  "1 Kings": [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53],
  "2 Kings": [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 25, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30],
  "1 Chronicles": [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30],
  "2 Chronicles": [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 25, 33, 25, 33, 27, 23],
  "Ezra": [11, 70, 13, 24, 17, 22, 28, 36, 15, 44],
  "Nehemiah": [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31],
  "Esther": [22, 23, 15, 17, 14, 14, 10, 17, 32, 3],
  "Job": [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17],
  "Psalms": [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 8, 20, 14, 9, 6],
  "Proverbs": [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31],
  "Ecclesiastes": [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14],
  "Song of Solomon": [17, 17, 11, 16, 16, 13, 13, 14],
  "Isaiah": [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24],
  "Jeremiah": [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34],
  "Lamentations": [22, 22, 66, 22, 22],
  "Ezekiel": [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35],
  "Daniel": [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13],
  "Hosea": [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9],
  "Joel": [20, 32, 21],
  "Amos": [15, 16, 15, 13, 27, 14, 17, 14, 15],
  "Obadiah": [21],
  "Jonah": [17, 10, 10, 11],
  "Micah": [16, 13, 12, 13, 15, 16, 20],
  "Nahum": [15, 13, 19],
  "Habakkuk": [17, 20, 19],
  "Zephaniah": [18, 15, 20],
  "Haggai": [15, 23],
  "Zechariah": [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21],
  "Malachi": [14, 17, 18, 6],
  "Matthew": [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20],
  "Mark": [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],
  "Luke": [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53],
  "John": [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25],
  "Acts": [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31],
  "Romans": [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27],
  "1 Corinthians": [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24],
  "2 Corinthians": [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14],
  "Galatians": [24, 21, 29, 31, 26, 18],
  "Ephesians": [23, 22, 21, 32, 33, 24],
  "Philippians": [30, 30, 21, 23],
  "Colossians": [29, 23, 25, 18],
  "1 Thessalonians": [10, 20, 13, 18, 28],
  "2 Thessalonians": [12, 17, 18],
  "1 Timothy": [20, 15, 16, 16, 25, 21],
  "2 Timothy": [18, 26, 17, 22],
  "Titus": [16, 15, 15],
  "Philemon": [25],
  "Hebrews": [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25],
  "James": [27, 26, 18, 17, 20],
  "1 Peter": [25, 25, 22, 19, 14],
  "2 Peter": [21, 22, 18],
  "1 John": [10, 29, 24, 21, 21],
  "2 John": [13],
  "3 John": [14],
  "Jude": [25],
  "Revelation": [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]
};

const NT_BOOKS = [
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", 
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", 
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", 
  "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const WPM_TARGETS = Array.from({ length: 35 }, (_, i) => 25 + i * 5);

// Embedded word list for bigram drill fallback (common words, no API). Used when Datamuse returns few.
const BIGRAM_FALLBACK_WORDS = (
  'the and that with this from have been more some would could their there ' +
  'they think thing through those these where when which while after about ' +
  'other every first right might still those three together another nothing ' +
  'something anything everything whether rather father mother brother either ' +
  'neither weather further rather gather rather other another brother mother ' +
  'rather further gather either neither weather leather heather altogether ' +
  'worthy wealthy healthy stealthy lengthy strength perfectly thoughtfully ' +
  'thoughtless thoroughly throughout thoughtful something anything nothing ' +
  'everything worthwhile somewhere anywhere everywhere nowhere somehow ' +
  'church character which much such each reach teach branch bench stretch ' +
  'enough though although rough tough cough laugh right night light sight ' +
  'tight thought brought fought sought wrought daughter slaughter'
).split(/\s+/).filter(Boolean);

async function fetchWordsForBigram(bigram) {
  if (!bigram || bigram.length !== 2) return { words: null, error: 'invalid_bigram' };
  const key = bigram.toLowerCase();
  try {
    const pattern = `*${key[0]}${key[1]}*`;
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(pattern)}&max=80`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    const fromApi = (Array.isArray(data) ? data : [])
      .map((o) => (typeof o.word === 'string' ? o.word : '').toLowerCase().trim())
      .filter((w) => w.length > 1 && w.includes(key));
    const fromFallback = BIGRAM_FALLBACK_WORDS.filter((w) => w.includes(key));
    const combined = [...new Set([...fromApi, ...fromFallback])];
    if (combined.length < 1) return { words: null, error: 'too_few_words' };
    return { words: combined };
  } catch (e) {
    const fromFallback = BIGRAM_FALLBACK_WORDS.filter((w) => w.includes(key));
    if (fromFallback.length >= 1) return { words: fromFallback };
    return { words: null, error: e.message || 'Network error' };
  }
} 

// Fallback logic: Use system config if available (Canvas), otherwise use custom config (GitHub/Hosting)
const customFirebaseConfig = {
  apiKey: "AIzaSyCaqeOPN3sMZYSm21WCJYWC9GjjIZIAF9g",
  authDomain: "scripturetype.firebaseapp.com",
  projectId: "scripturetype",
  storageBucket: "scripturetype.firebasestorage.app",
  messagingSenderId: "737106048545",
  appId: "1:737106048545:web:7f2534744495ae5e4d1560",
  measurementId: "G-4FD3PQ1F7R"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : customFirebaseConfig;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Use system app ID if available, otherwise default to a safe generic ID
const appId = typeof __app_id !== 'undefined' ? __app_id : 'scripturetype';

export default function App() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [view, setView] = useState('library');
  const [activePassage, setActivePassage] = useState(null);
  const [targetWPM, setTargetWPM] = useState(60);
  const [preferredTranslation, setPreferredTranslation] = useState('ESV');
  const [drillBigram, setDrillBigram] = useState(null);
  const [drillTargetWPM, setDrillTargetWPM] = useState(60);
  const [drillHistoryId, setDrillHistoryId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isSignedIn || !clerkUser) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl border border-stone-200'
            }
          }}
        />
      </div>
    );
  }

  const user = { uid: clerkUser.id };

  const renderView = () => {
    switch(view) {
      case 'typing': 
        return <TypingEngine passage={activePassage} user={user} targetWPM={targetWPM} setTargetWPM={setTargetWPM} onBack={() => setView('library')} />;
      case 'achievements':
        return <AchievementsView user={user} onStartBigramDrill={(bigram, targetWPM, historyId) => { setDrillBigram(bigram); setDrillTargetWPM(targetWPM ?? 60); setDrillHistoryId(historyId ?? null); setView('bigramDrill'); }} />;
      case 'bigramDrill':
        return drillBigram ? (
          <BigramDrill bigram={drillBigram} targetWPM={drillTargetWPM} historyId={drillHistoryId} user={user} onBack={() => { setDrillBigram(null); setDrillHistoryId(null); setView('achievements'); }} />
        ) : (
          <AchievementsView user={user} onStartBigramDrill={(b, targetWPM, historyId) => { setDrillBigram(b); setDrillTargetWPM(targetWPM ?? 60); setDrillHistoryId(historyId ?? null); setView('bigramDrill'); }} />
        );
      case 'quotes':
        return <QuoteExplorer user={user} onImport={() => setView('library')} />;
      default:
        return (
          <Library 
            user={user} 
            targetWPM={targetWPM} 
            setTargetWPM={setTargetWPM}
            onStart={(p) => { setActivePassage(p); setView('typing'); }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-900 font-sans selection:bg-amber-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => setView('library')}>
            <div className="bg-amber-500 p-1.5 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-black tracking-tight group-hover:text-amber-600 transition hidden sm:block">VerseType</h1>
          </div>
          
          <GlobalNavSearch user={user} translation={preferredTranslation} onImport={() => setView('library')} />
          
          <nav className="flex items-center gap-1 shrink-0">
            <NavBtn active={view === 'library'} onClick={() => setView('library')} icon={<List className="w-5 h-5"/>} label="Library" />
            <NavBtn active={view === 'achievements'} onClick={() => setView('achievements')} icon={<Trophy className="w-5 h-5"/>} label="Stats" />
            <NavBtn active={view === 'quotes'} onClick={() => setView('quotes')} icon={<Quote className="w-5 h-5"/>} label="Quotes" />
            <div className="ml-1 flex items-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-grow max-w-[1600px] w-full mx-auto p-4 md:p-6">{renderView()}</main>
      <footer className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 mt-auto border-t border-stone-100">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-stone-400">
          <button type="button" onClick={() => setShowFeedbackModal(true)} className="hover:text-amber-600 transition font-medium">Have a suggestion?</button>
          <span className="text-stone-300">·</span>
          <a href="https://versevault-app.web.app" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition font-medium">VerseVault</a>
          <span className="text-stone-300">·</span>
          <a href="https://verseaxis.web.app" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition font-medium">VerseAxis</a>
        </div>
      </footer>
      <FeedbackModal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-sm ${
        active ? 'bg-amber-50 text-amber-600' : 'text-stone-500 hover:bg-stone-100'
      }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

const FORMSPREE_FEEDBACK_ID = import.meta.env.VITE_FORMSPREE_FEEDBACK_ID;

function FeedbackModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!FORMSPREE_FEEDBACK_ID) {
      setError('Feedback form is not configured. Add VITE_FORMSPREE_FEEDBACK_ID to your .env');
      return;
    }
    setError(null);
    setSending(true);
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('email', email.trim());
    formData.append('message', message.trim());
    formData.append('_subject', 'VerseType feedback / suggestion');
    if (file) formData.append('photo', file);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_FEEDBACK_ID}`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || (res.status === 404 ? 'Invalid form ID. Check VITE_FORMSPREE_FEEDBACK_ID in .env' : res.status === 422 ? 'Please check your entries and try again.' : `Submission failed (${res.status}). Try again.`);
        console.error('Formspree error:', res.status, data);
        throw new Error(msg);
      }
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
      setFile(null);
      setTimeout(() => { setSent(false); onClose(); }, 2000);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      console.error('Feedback submit error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-stone-800">Send feedback</h3>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1" aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!FORMSPREE_FEEDBACK_ID && (
            <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">Add VITE_FORMSPREE_FEEDBACK_ID to your .env to receive submissions by email.</p>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {sent && <p className="text-emerald-600 text-sm font-medium">Thanks! We&apos;ll review your feedback.</p>}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Details</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none" placeholder="Bug report or feature idea..." />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Attach a photo (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-bold" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 font-bold text-stone-600 hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={sending} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PASSAGE_SEARCH_COOLDOWN_MS = 3000;

function GlobalNavSearch({ user, translation, onImport }) {
  const [isManual, setIsManual] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState('1');
  const [startV, setStartV] = useState('1');
  const [endV, setEndV] = useState('1');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const lastPassageSearchAt = useRef(0);

  const chaptersInBook = BIBLE_DATA[book] || [];
  const maxVerses = chaptersInBook[parseInt(chapter) - 1] || 1;

  useEffect(() => {
    if (parseInt(chapter) > chaptersInBook.length) {
      setChapter('1');
    }
  }, [book]);

  useEffect(() => {
    if (parseInt(startV) > maxVerses) setStartV('1');
    if (parseInt(endV) > maxVerses) setEndV('1');
  }, [chapter, book]);

  const performSearch = async () => {
    const now = Date.now();
    if (now - lastPassageSearchAt.current < PASSAGE_SEARCH_COOLDOWN_MS) return;
    lastPassageSearchAt.current = now;
    setLoading(true);
    const queryStr = isManual ? manualQuery : `${book} ${chapter}:${startV}${startV !== endV ? '-' + endV : ''}`;
    
    try {
      if (translation === 'ESV' && ESV_API_KEY) {
        const params = new URLSearchParams({
          'q': queryStr,
          'include-passage-references': 'false',
          'include-verse-numbers': 'false',
          'include-footnotes': 'false',
          'include-headings': 'false',
          'include-short-copyright': 'false'
        });
        const response = await fetch(`https://api.esv.org/v3/passage/text/?${params.toString()}`, {
          headers: { 'Authorization': `Token ${ESV_API_KEY}` }
        });
        const data = await response.json();
        if (data.passages?.[0]) {
          setResults([{ reference: data.canonical, text: data.passages[0].trim(), translation: 'ESV' }]);
        }
      } else {
        const response = await fetch(`https://bible-api.com/${queryStr}?translation=${translation.toLowerCase()}`);
        const data = await response.json();
        if (data.text) {
          setResults([{ reference: data.reference, text: data.text.trim(), translation }]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (item) => {
    if (!user) {
      console.error("User not authenticated. Please enable Anonymous Auth in your Firebase Console.");
      return;
    }
    setResults(null);
    setManualQuery('');
    onImport();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'passages'), {
        ...item,
        favorite: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Import failed:", err);
      alert("Import failed. Check console for details (likely Firestore permissions).");
    }
  };

  const selectWholeChapter = () => {
    setStartV('1');
    setEndV(maxVerses.toString());
  };

  return (
    <div className="flex-grow max-w-xl relative">
      <div className="flex items-center bg-stone-100 rounded-2xl p-1 border border-stone-200 shadow-inner">
        <button 
          onClick={() => setIsManual(!isManual)} 
          className="px-3 py-1.5 text-stone-400 hover:text-amber-600 transition border-r border-stone-200 flex items-center justify-center group"
        >
          {isManual ? (
            <ChevronDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
          ) : (
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
          )}
        </button>
        
        {isManual ? (
          <input 
            type="text" placeholder="Type verse (e.g. John 3:16)..." 
            className="flex-grow bg-transparent px-3 py-1.5 text-xs outline-none font-bold"
            value={manualQuery} onChange={(e) => setManualQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
          />
        ) : (
          <div className="flex-grow flex items-center gap-0.5 px-2">
            <select 
              value={book} 
              onChange={e => setBook(e.target.value)} 
              className="bg-transparent text-[11px] font-black outline-none cursor-pointer appearance-none px-1"
            >
              {BIBLE_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex items-center gap-0.5">
              <select 
                value={chapter} 
                onChange={e => setChapter(e.target.value)} 
                className="bg-white/50 rounded-md w-8 text-[11px] font-black text-center outline-none py-1 appearance-none cursor-pointer"
              >
                {Array.from({length: chaptersInBook.length}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-stone-300 font-bold">:</span>
              <select 
                value={startV} 
                onChange={e => setStartV(e.target.value)} 
                className="bg-white/50 rounded-md w-8 text-[11px] font-black text-center outline-none py-1 appearance-none cursor-pointer"
              >
                {Array.from({length: maxVerses}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-stone-300 font-bold">-</span>
              <select 
                value={endV} 
                onChange={e => setEndV(e.target.value)} 
                className="bg-white/50 rounded-md w-8 text-[11px] font-black text-center outline-none py-1 appearance-none cursor-pointer"
              >
                {Array.from({length: maxVerses}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button 
                onClick={selectWholeChapter}
                title="Select Full Chapter"
                className="ml-1.5 p-1.5 rounded-md hover:bg-white/80 text-amber-600 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        
        <button 
          onClick={performSearch} 
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : "Search"}
        </button>
      </div>

      {results && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-stone-200 z-[60] p-4 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm">{results[0].reference}</h4>
            <div className="flex gap-2">
              <button onClick={() => setResults(null)} className="text-stone-400 p-1"><X className="w-4 h-4"/></button>
              <button onClick={() => handleImport(results[0])} className="bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-bold">Import</button>
            </div>
          </div>
          <p className="text-xs text-stone-500 italic line-clamp-2">"{results[0].text}"</p>
        </div>
      )}
    </div>
  );
}

function TypingEngine({ passage, user, targetWPM, setTargetWPM, onBack }) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [stats, setStats] = useState(null);
  const inputRef = useRef(null);
  const keyTimestamps = useRef([]);

  const normalizedText = useMemo(() => {
    return passage.text.trim().replace(/\s+/g, ' ');
  }, [passage.text]);

  const progress = (input.length / normalizedText.length) * 100;
  const totalWords = useMemo(() => normalizedText.trim().split(/\s+/).filter(Boolean).length, [normalizedText]);
  const wordsTyped = input.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => { inputRef.current?.focus(); }, [isPaused]);

  // Keyboard shortcut listener for pausing/resuming
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle pause: CapsLock + Space
      if (e.code === 'Space' && e.getModifierState('CapsLock')) {
        e.preventDefault();
        setIsPaused(true);
        return;
      }
      // Resume: Space while paused
      if (e.code === 'Space' && isPaused) {
        e.preventDefault();
        setIsPaused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);

  const calculateMetrics = (currentInput, durationMs) => {
    if (!durationMs || durationMs <= 0) return { wpm: 0, accuracy: 100 };
    let correctChars = 0;
    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === normalizedText[i]) correctChars++;
    }
    const elapsedMin = durationMs / 60000;
    const wpm = Math.round((correctChars / 5) / elapsedMin);
    const accuracy = currentInput.length > 0 ? Math.round((correctChars / currentInput.length) * 100) : 100;
    return { wpm, accuracy };
  };

  useEffect(() => {
    if (!startTime || stats || isPaused) return;
    const interval = setInterval(() => {
      const metrics = calculateMetrics(input, Date.now() - startTime);
      setLiveWpm(metrics.wpm);
      setLiveAccuracy(metrics.accuracy);
    }, 200);
    return () => clearInterval(interval);
  }, [startTime, input, stats, normalizedText, isPaused]);

  const handleChange = (e) => {
    if (isPaused) return;
    const val = e.target.value;
    if (val.length === 1 && !startTime) {
      setStartTime(Date.now());
      keyTimestamps.current = [];
    }
    if (val.length > input.length) {
      const t = Date.now();
      for (let i = input.length; i < val.length; i++) keyTimestamps.current[i] = t;
    } else if (val.length < input.length) {
      keyTimestamps.current = keyTimestamps.current.slice(0, val.length);
    }
    if (val.length <= normalizedText.length) {
      setInput(val);
    }
    if (val.length === normalizedText.length) {
      const finalMetrics = calculateMetrics(val, Date.now() - startTime);
      setStats(finalMetrics);
      const bigrams = [];
      const isLetter = (c) => /^[a-zA-Z]$/.test(c);
      for (let i = 1; i < normalizedText.length; i++) {
        const c0 = normalizedText[i - 1];
        const c1 = normalizedText[i];
        if (!isLetter(c0) || !isLetter(c1)) continue;
        const t0 = keyTimestamps.current[i - 1];
        const t1 = keyTimestamps.current[i];
        if (t0 != null && t1 != null) {
          bigrams.push({ bigram: c0 + c1, ms: t1 - t0 });
        }
      }
      const bySlowest = [...bigrams].sort((a, b) => b.ms - a.ms);
      const byFastest = [...bigrams].sort((a, b) => a.ms - b.ms);
      const thresholdMs = 24000 / targetWPM;
      const belowTargetByBigram = new Map();
      bigrams
        .filter((b) => b.ms > thresholdMs)
        .forEach((b) => {
          const prev = belowTargetByBigram.get(b.bigram);
          if (!prev || b.ms > prev.ms) belowTargetByBigram.set(b.bigram, { bigram: b.bigram, ms: b.ms });
        });
      const belowTargetBigrams = [...belowTargetByBigram.values()]
        .sort((a, b) => b.ms - a.ms)
        .map(({ bigram, ms }) => ({ bigram, ms }));
      const slowestBigrams = bySlowest.slice(0, 2).map(({ bigram, ms }) => ({ bigram, ms }));
      const fastestBigrams = byFastest.slice(0, 2).map(({ bigram, ms }) => ({ bigram, ms }));
      if (finalMetrics.wpm >= targetWPM && window.confetti) {
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24'] });
      }
      if (user) {
        addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          passageId: passage.id, reference: passage.reference, wpm: finalMetrics.wpm,
          accuracy: finalMetrics.accuracy, targetWPM, timestamp: serverTimestamp(),
          slowestBigrams, fastestBigrams, belowTargetBigrams
        }).catch((err) => {
          console.error('Could not save session to Firestore:', err?.code || err?.message || err);
        });
      }
    }
  };

  if (stats) return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in">
      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100 text-center">
        <Trophy className={`w-12 h-12 mx-auto mb-4 ${stats.wpm >= targetWPM ? 'text-amber-500' : 'text-stone-300'}`} />
        <h2 className="text-4xl font-serif font-black mb-8">{stats.wpm >= targetWPM ? 'Goal Met!' : 'Well Done!'}</h2>
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-stone-50 p-8 rounded-3xl">
            <div className="text-6xl font-mono font-black">{stats.wpm}</div>
            <div className="text-[10px] font-black uppercase text-stone-400 mt-2">WPM</div>
          </div>
          <div className="bg-stone-50 p-8 rounded-3xl">
            <div className="text-6xl font-mono font-black text-emerald-600">{stats.accuracy}%</div>
            <div className="text-[10px] font-black uppercase text-stone-400 mt-2">Accuracy</div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={onBack} className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black">Library</button>
          <button onClick={() => { setInput(''); setStartTime(null); setStats(null); }} className="px-10 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black">Restart</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Practice Header */}
      <div className="bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden">
        <div className="px-8 py-4 flex justify-between items-center border-b border-stone-50">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="flex items-center gap-2 text-stone-400 font-bold hover:text-stone-900 transition">
              <ChevronLeft className="w-5 h-5" /> Exit
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPaused(!isPaused)} 
                className={`flex items-center gap-2 font-bold transition ${isPaused ? 'text-amber-500' : 'text-stone-400 hover:text-stone-900'}`}
              >
                {isPaused ? <Play className="w-4 h-4 fill-amber-500" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <div className="hidden md:flex items-center gap-1 text-[9px] font-black text-stone-300 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 uppercase tracking-widest select-none">
                <span>Caps + Space</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-8 md:gap-16 items-center">
             <div className="text-center flex items-center gap-2">
                <div>
                  <span className="block text-[10px] font-black text-stone-400 uppercase tracking-tighter">Speed</span>
                  <span className={`text-xl font-mono font-black ${liveWpm >= targetWPM ? 'text-amber-500' : 'text-stone-800'}`}>{liveWpm} <span className="text-[10px] text-stone-300">/ {targetWPM}</span></span>
                </div>
                {setTargetWPM && (
                  <button
                    type="button"
                    onClick={() => setTargetWPM(prev => prev >= 195 ? 25 : prev + 5)}
                    className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold text-sm leading-none transition-colors active:scale-95"
                    title="Goal +5 WPM"
                  >
                    +5
                  </button>
                )}
             </div>
             <div className="text-center">
                <span className="block text-[10px] font-black text-stone-400 uppercase tracking-tighter">Accuracy</span>
                <span className="text-xl font-mono font-black text-emerald-500">{liveAccuracy}%</span>
             </div>
          </div>
          
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>

        {/* Practice Body */}
        <div 
          className="p-12 md:p-16 cursor-text min-h-[50vh] flex flex-col items-center relative"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Words typed - prominent */}
          <div className="text-center mb-6">
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Words</p>
            <p className="text-4xl md:text-5xl font-mono font-black text-stone-800">
              <span className="text-amber-500">{wordsTyped}</span>
              <span className="text-stone-300 font-medium"> / </span>
              <span>{totalWords}</span>
            </p>
          </div>
          {/* Progress Bar */}
          <div className="w-full max-w-lg mb-8">
            <div className="h-2 bg-stone-100 w-full rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-amber-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)] rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Heading - Moved from right to above text */}
          <div className="mb-6 text-center">
            <h2 className="text-lg font-serif font-black text-stone-800">{passage.reference}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">{passage.translation || 'Sacred Text'}</h3>
            </div>
          </div>

          <div className={`max-w-2xl w-full transition-all duration-500 ${isPaused ? 'blur-md opacity-20 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="font-serif text-2xl md:text-3xl leading-[2] text-justify select-none text-stone-200">
              <span className="inline-block w-12"></span>
              {normalizedText.split('').map((char, i) => {
                let color = i < input.length ? (input[i] === char ? "text-stone-800" : "text-red-500 bg-red-50") : "";
                let cursor = i === input.length ? "border-b-4 border-amber-500 bg-amber-400/20" : "";
                return <span key={i} className={`${color} ${cursor}`}>{char}</span>;
              })}
            </div>
          </div>

          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#faf9f6]/40 backdrop-blur-[2px]">
              <div className="bg-white px-8 py-6 rounded-3xl shadow-xl border border-stone-100 text-center animate-in zoom-in-95 duration-200">
                <Pause className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="text-xl font-black mb-1">Paused</h3>
                <p className="text-stone-500 text-sm font-medium">Press <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200 font-mono text-xs">Space</span> to resume</p>
              </div>
            </div>
          )}
          
          <textarea 
            ref={inputRef} value={input} onChange={handleChange} 
            className="opacity-0 absolute inset-0 pointer-events-none" autoFocus spellCheck="false" 
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest">{wordsTyped} / {totalWords} words · {Math.round(progress)}%</p>
        <p className="text-[8px] font-black text-stone-200 uppercase tracking-widest">Hold CapsLock + Space to Pause</p>
      </div>
    </div>
  );
}

function BigramDrill({ bigram, targetWPM = 60, historyId, user, onBack }) {
  const [wordList, setWordList] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const wordKeyTimestamps = useRef([]);
  const bigramTimes = useRef([]);
  const correctWordsCount = useRef(0);
  const drillResultSaved = useRef(false);
  const TOTAL_WORDS = 20;

  const [wordListError, setWordListError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setWordListError(null);
    (async () => {
      const result = await fetchWordsForBigram(bigram);
      if (cancelled) return;
      if (result.error || !result.words || result.words.length === 0) {
        setWordListError(result.error || 'Could not generate words');
        setWordList([]);
        return;
      }
      const base = result.words;
      const repeated = [];
      for (let i = 0; i < TOTAL_WORDS; i++) repeated.push(base[i % base.length]);
      const shuffled = [...repeated].sort(() => Math.random() - 0.5);
      setWordList(shuffled);
    })();
    return () => { cancelled = true; };
  }, [bigram]);

  const safeList = wordList && wordList.length > 0 ? wordList : [];
  const currentWord = safeList[wordIndex];
  const isComplete = wordIndex >= TOTAL_WORDS || wordIndex >= safeList.length;
  const hasWords = safeList.length > 0;

  useEffect(() => {
    if (wordList === null || isComplete) return;
    const t = setTimeout(() => { inputRef.current?.focus(); }, 50);
    return () => clearTimeout(t);
  }, [wordIndex, wordList, isComplete]);

  useEffect(() => {
    if (!isComplete || !user || !historyId || drillResultSaved.current) return;
    drillResultSaved.current = true;
    const bigramLower = bigram.toLowerCase();
    const hasTimes = bigramTimes.current.length > 0;
    const avgMs = hasTimes ? bigramTimes.current.reduce((a, t) => a + t, 0) / bigramTimes.current.length : 0;
    const bigramWpm = hasTimes ? (2 / 5) / (avgMs / 60000) : 0;
    const passed = hasTimes && bigramWpm >= targetWPM;
    const historyRef = doc(db, 'artifacts', appId, 'users', user.uid, 'history', historyId);
    getDoc(historyRef)
      .then((snap) => {
        if (!snap.exists()) return Promise.resolve();
        const data = snap.data();
        const updateBigram = (b) =>
          (b.bigram || '').toLowerCase() === bigramLower
            ? { ...b, drillPassed: passed, drillAvgMs: hasTimes ? Math.round(avgMs) : null }
            : b;
        const updatedSlowest = (data.slowestBigrams || []).map(updateBigram);
        const updatedBelow = (data.belowTargetBigrams || []).map(updateBigram);
        return updateDoc(historyRef, { slowestBigrams: updatedSlowest, belowTargetBigrams: updatedBelow });
      })
      .catch(console.warn);
  }, [isComplete, bigram, targetWPM, historyId, user]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (!currentWord) return;
    if (val.length > input.length) {
      const t = Date.now();
      for (let i = input.length; i < val.length; i++) wordKeyTimestamps.current[i] = t;
    }
    if (val.length <= currentWord.length) {
      setInput(val);
    } else {
      setInput(val.slice(0, currentWord.length));
    }
  };

  const handleKeyDown = (e) => {
    if (!currentWord) return;
    if (e.key === ' ') {
      e.preventDefault();
      if (input.toLowerCase() === currentWord.toLowerCase()) {
        correctWordsCount.current++;
        const idx = currentWord.toLowerCase().indexOf(bigram.toLowerCase());
        if (idx !== -1 && wordKeyTimestamps.current[idx] != null && wordKeyTimestamps.current[idx + 1] != null) {
          bigramTimes.current.push(wordKeyTimestamps.current[idx + 1] - wordKeyTimestamps.current[idx]);
        }
      }
      wordKeyTimestamps.current = [];
      setInput('');
      const nextIndex = wordIndex + 1;
      setWordIndex((i) => i + 1);
      if (nextIndex >= TOTAL_WORDS) onBack();
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-400 font-bold hover:text-stone-900 transition">
            <ChevronLeft className="w-5 h-5" /> Back to Stats
          </button>
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
            Practicing “{bigram.replace(/\s/g, '␣')}” · {Math.min(wordIndex, TOTAL_WORDS)} / {TOTAL_WORDS}
          </span>
        </div>
        <div
          className="p-12 md:p-16 cursor-text min-h-[40vh] flex flex-col items-center justify-center relative"
          onClick={() => inputRef.current?.focus()}
        >
          {wordList === null ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-stone-500">Loading practice words for “{bigram}”…</p>
            </div>
          ) : wordListError || !hasWords ? (
            <div className="text-center space-y-4 max-w-md px-4">
              <p className="text-stone-600 font-medium">
                {wordListError && wordListError.startsWith('Rate limit')
                  ? 'API rate limit reached'
                  : "Couldn't generate words for this combo."}
              </p>
              <p className="text-sm text-stone-400">
                {wordListError === 'no_api_key'
                  ? 'Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.'
                  : wordListError === 'too_few_words'
                    ? 'The API returned too few valid words.'
                    : typeof wordListError === 'string'
                      ? wordListError
                      : 'Check your connection and API key, then try again.'}
              </p>
              {wordListError && !wordListError.startsWith('Rate limit') && wordListError !== 'no_api_key' && wordListError !== 'too_few_words' ? (
                <p className="text-[10px] text-stone-300">Restart the app after changing .env. For deployed builds, set the secret in GitHub repo Settings → Secrets.</p>
              ) : null}
              <button onClick={onBack} className="px-6 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-bold text-sm">
                Back to Stats
              </button>
            </div>
          ) : isComplete ? (
            <div className="text-center">
              <p className="text-sm text-stone-400 font-medium">Returning to stats…</p>
            </div>
          ) : hasWords ? (
            <>
              <p className="text-2xl font-mono font-black text-stone-400 mb-6">
                {wordIndex + 1}/{TOTAL_WORDS}
              </p>
              <div className="font-serif text-4xl md:text-5xl font-black select-none text-center">
                {currentWord.split('').map((char, i) => {
                  const isTyped = i < input.length;
                  const correct = input[i] === char;
                  const color = !isTyped ? 'text-stone-200' : correct ? 'text-stone-800' : 'text-red-500 bg-red-50';
                  const cursor = i === input.length ? 'border-b-4 border-amber-500 bg-amber-400/20' : '';
                  return <span key={i} className={`${color} ${cursor}`}>{char}</span>;
                })}
                {input.length === currentWord.length && (
                  <span className="border-b-4 border-amber-500 bg-amber-400/20">&nbsp;</span>
                )}
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoFocus
                className="opacity-0 absolute inset-0 w-full h-full pointer-events-none cursor-text"
                aria-hidden
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Library({ user, targetWPM, setTargetWPM, onStart }) {
  const [passages, setPassages] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubP = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'passages'), s => setPassages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubH = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), s => setHistory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubP(); unsubH(); };
  }, [user]);

  const toggleFavorite = async (e, p) => {
    e.stopPropagation();
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'passages', p.id), {
      favorite: !p.favorite
    });
  };

  const deletePassage = async (e, id) => {
    e.stopPropagation();
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'passages', id));
  };

  const grouped = useMemo(() => {
    const data = {
      favorites: passages.filter(p => p.favorite),
      oldTestament: passages.filter(p => !p.favorite && p.translation !== 'Quote' && !NT_BOOKS.includes(p.reference.match(/^([1-3]\s)?[A-Za-z]+/)?.[0])),
      newTestament: passages.filter(p => !p.favorite && p.translation !== 'Quote' && NT_BOOKS.includes(p.reference.match(/^([1-3]\s)?[A-Za-z]+/)?.[0])),
      quotes: passages.filter(p => !p.favorite && p.translation === 'Quote')
    };
    return data;
  }, [passages]);

  const PassageCard = ({ p }) => {
    const attempts = history.filter(h => h.passageId === p.id);
    const best = attempts.length > 0 ? Math.max(...attempts.map(a => a.wpm)) : 0;
    
    return (
      <div 
        onClick={() => onStart(p)} 
        className="aspect-square bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-lg transition-all cursor-pointer group shadow-sm flex flex-col active:scale-[0.98] relative"
      >
        <div className="flex justify-between items-start mb-2 pr-1">
          <h4 className="font-serif font-black text-sm group-hover:text-amber-600 transition-colors line-clamp-1">{p.reference}</h4>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => toggleFavorite(e, p)} className="p-1 text-stone-300 hover:text-amber-500">
              <Heart className={`w-3.5 h-3.5 ${p.favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <button onClick={(e) => deletePassage(e, p.id)} className="p-1 text-stone-300 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-stone-500 text-[11px] line-clamp-4 italic mb-3 flex-grow leading-relaxed">"{p.text}"</p>
        
        <div className="flex justify-between items-center pt-3 border-t border-stone-50">
          <div className="flex items-center gap-2 group-hover:text-amber-600 transition-colors">
            <Play className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-tight">Practice</span>
          </div>
          
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${best >= targetWPM ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'}`}>
            {best || '--'} WPM
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-black">Library</h2>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-stone-200">
          <Target className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-black uppercase text-stone-400">Goal</span>
          <select 
            value={targetWPM} 
            onChange={(e) => setTargetWPM(Number(e.target.value))} 
            className="bg-transparent text-xs font-black outline-none cursor-pointer appearance-none"
          >
            {WPM_TARGETS.map(t => <option key={t} value={t}>{t} WPM</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-12">
        {/* Favorites at the top full width */}
        {grouped.favorites.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
               <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
               <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400">Favorites</h3>
               <span className="ml-auto text-[10px] bg-stone-100 px-2 py-0.5 rounded-full font-bold">{grouped.favorites.length}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {grouped.favorites.map(p => <PassageCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* OT, NT, and Quotes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Old Testament */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
               <LibraryIcon className="w-4 h-4 text-stone-400" />
               <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400">Old Testament</h3>
               <span className="ml-auto text-[10px] bg-stone-100 px-2 py-0.5 rounded-full font-bold">{grouped.oldTestament.length}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6">
              {grouped.oldTestament.map(p => <PassageCard key={p.id} p={p} />)}
            </div>
          </div>

          {/* New Testament */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
               <Flame className="w-4 h-4 text-stone-400" />
               <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400">New Testament</h3>
               <span className="ml-auto text-[10px] bg-stone-100 px-2 py-0.5 rounded-full font-bold">{grouped.newTestament.length}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6">
              {grouped.newTestament.map(p => <PassageCard key={p.id} p={p} />)}
            </div>
          </div>

          {/* Quotes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
               <Quote className="w-4 h-4 text-stone-400" />
               <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-400">Quotes</h3>
               <span className="ml-auto text-[10px] bg-stone-100 px-2 py-0.5 rounded-full font-bold">{grouped.quotes.length}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6">
              {grouped.quotes.map(p => <PassageCard key={p.id} p={p} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const QUOTE_SEARCH_COOLDOWN_SEC = 15;

function QuoteExplorer({ user, onImport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [importedItems, setImportedItems] = useState({});
  const [searchError, setSearchError] = useState(null);
  const [cooldownSecLeft, setCooldownSecLeft] = useState(0);
  const lastQuoteSearchAt = useRef(0);

  useEffect(() => {
    if (cooldownSecLeft <= 0) return;
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastQuoteSearchAt.current) / 1000);
      const left = Math.max(0, QUOTE_SEARCH_COOLDOWN_SEC - elapsed);
      setCooldownSecLeft(left);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSecLeft]);

  const searchQuotes = async () => {
    if (!searchTerm.trim()) return;
    if (cooldownSecLeft > 0) {
      setSearchError(`Please wait ${cooldownSecLeft}s before searching again.`);
      return;
    }
    if (!GEMINI_API_KEY) {
      setSearchError('Quotes search needs a Gemini API key. Add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }
    lastQuoteSearchAt.current = Date.now();
    setCooldownSecLeft(QUOTE_SEARCH_COOLDOWN_SEC);
    setLoading(true);
    setSearchError(null);
    setImportedItems({});
    const prompt = `Search for 8 quotes from Christian authors, theologians, or historical figures related to: ${searchTerm.trim()}. Ensure all results are specifically within the Christian tradition.`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "Return only a JSON object with a 'quotes' array. Each quote must have 'text', 'author', and 'resource' (string). No markdown, no code fences." }] },
      generationConfig: { responseMimeType: "application/json" }
    };
    const tryModel = async (model) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return { response, data };
    };
    try {
      // Single request: use 1.5-flash (free tier). Only fallback to 2.0 on 404/not found (not on quota to avoid extra request).
      let { response, data } = await tryModel('gemini-1.5-flash');
      const shouldTryFallback = !response.ok && (response.status === 404 || data?.error?.message?.includes('not found')) && !data?.error?.message?.toLowerCase().includes('quota');
      if (shouldTryFallback) {
        const fallback = await tryModel('gemini-2.0-flash');
        response = fallback.response;
        data = fallback.data;
      }
      if (!response.ok) {
        const msg = data?.error?.message || data?.error?.status || `Request failed (${response.status})`;
        const retryMatch = msg.match(/retry in ([\d.]+)s/i);
        setSearchError(retryMatch ? `Rate limit reached. Try again in ${Math.ceil(parseFloat(retryMatch[1]))} seconds.` : msg);
        setQuotes([]);
        return;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const blockReason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason;
        setSearchError(blockReason ? `Response blocked: ${blockReason}` : 'No results returned. Try a different search.');
        setQuotes([]);
        return;
      }
      const parsed = typeof text === 'string' ? JSON.parse(text) : text;
      const list = Array.isArray(parsed?.quotes) ? parsed.quotes : [];
      setQuotes(list.filter(q => q && (q.text != null && q.author != null)));
    } catch (e) {
      console.error(e);
      setSearchError(e.message || 'Search failed. Check your connection and try again.');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImport = async (q, index) => {
    if (!user) return;
    const docId = importedItems[index];

    if (docId) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'passages', docId));
        setImportedItems(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      } catch (err) {
        console.error("Removal failed", err);
      }
    } else {
      const reference = `${q.author}\n${q.resource}`;
      try {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'passages'), {
          reference: reference, text: q.text, translation: 'Quote', favorite: false, createdAt: serverTimestamp()
        });
        setImportedItems(prev => ({ ...prev, [index]: docRef.id }));
      } catch (err) {
        console.error("Import failed", err);
      }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 py-10">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider mb-2">
          <span className="animate-pulse">✨</span>
          <span>Christian Wisdom</span>
        </div>
        <h2 className="text-5xl font-serif font-black text-stone-900 tracking-tight">Explore Great Quotes</h2>
        <p className="text-stone-500 font-medium">Search for wisdom from the history of the Church to add to your personal typing collection.</p>
        
        <div className="flex bg-white rounded-3xl p-1.5 shadow-xl shadow-stone-200/50 border border-stone-200 max-w-lg mx-auto transition-all focus-within:ring-4 focus-within:ring-amber-100">
          <input 
            type="text" 
            placeholder="Search topics (e.g. Grace, Prayer, Augustine)..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="flex-grow px-5 outline-none font-bold text-sm bg-transparent"
            onKeyDown={e => e.key === 'Enter' && searchQuotes()}
          />
          <button 
            onClick={searchQuotes} 
            disabled={loading || cooldownSecLeft > 0}
            className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-[1.25rem] font-black text-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />}
            {loading ? 'Finding...' : cooldownSecLeft > 0 ? `Try again in ${cooldownSecLeft}s` : 'Discover'}
          </button>
        </div>
        {searchError && (
          <p className="mt-3 text-sm text-red-600 font-medium max-w-lg mx-auto">{searchError}</p>
        )}
      </div>

      <div className="space-y-4">
        {quotes.map((q, i) => {
          const isImported = !!importedItems[i];
          return (
            <div 
              key={i} 
              className="w-full bg-white rounded-2xl p-6 border border-stone-200 flex flex-col md:flex-row items-center gap-4 group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="bg-amber-50 p-3 rounded-xl shrink-0"><Quote className="w-5 h-5 text-amber-500" /></div>
              <div className="flex-grow min-w-0">
                <p className="text-stone-700 font-serif italic text-base leading-relaxed break-words">"{q.text}"</p>
              </div>
              <div className="shrink-0 flex items-center gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-stone-100">
                <div className="space-y-1 text-right md:min-w-[120px] max-w-[180px]">
                  <div className="mb-1">
                     <span className="block text-[8px] font-black uppercase text-amber-600 tracking-widest leading-none mb-0.5">Author</span>
                     <span className="block font-black text-[11px] text-stone-900 truncate" title={q.author}>{q.author}</span>
                  </div>
                  <div>
                     <span className="block text-[8px] font-black uppercase text-amber-600 tracking-widest leading-none mb-0.5">Resource</span>
                     <span className="block font-medium text-[10px] text-stone-500 truncate italic" title={q.resource}>{q.resource}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleImport(q, i)} 
                  className={`flex items-center justify-center h-11 w-11 rounded-full font-black transition-all duration-300 ml-auto shrink-0 ${
                    isImported 
                    ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100' 
                    : 'bg-stone-50 group-hover:bg-amber-500 text-stone-500 group-hover:text-white'
                  }`}
                >
                  {isImported ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AchievementsView({ user, onStartBigramDrill }) {
  const [history, setHistory] = useState([]);
  const [comboMetricWpm, setComboMetricWpm] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setHistoryError(null);
    const unsub = onSnapshot(
      query(
        collection(db, 'artifacts', appId, 'users', user.uid, 'history'),
        orderBy('timestamp', 'desc'),
        limit(50)
      ),
      (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error('Stats / history query failed:', err?.code || err?.message, err);
        setHistoryError(err?.code === 'permission-denied' ? 'Firestore permission denied. Update rules in Firebase Console → Firestore → Rules.' : err?.message || 'Could not load stats.');
      }
    );
    return () => unsub();
  }, [user]);

  const bigramMsToWpm = (ms) => (ms > 0 ? Math.round(24000 / ms) : 0);
  const formatBigram = (b, useWpm) => {
    const s = (b.bigram || '').replace(/\s/g, '␣');
    const ms = b.ms != null ? b.ms : 0;
    if (useWpm && ms > 0) return `${s} (${bigramMsToWpm(ms)} WPM)`;
    return `${s} (${ms}ms)`;
  };
  const formatDrillResult = (b, useWpm) => {
    const ms = b.drillAvgMs;
    if (ms != null) return useWpm ? `${bigramMsToWpm(ms)} WPM` : `${ms} ms avg`;
    if (b.drillPassed === true || b.drillPassed === false) return '—';
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-10">
      <div className="text-center">
        <Trophy className="w-16 h-16 mx-auto text-amber-200" />
        <h2 className="text-2xl font-serif font-black mt-4">Stats & Achievements</h2>
        <p className="text-stone-400 mt-1">Complete sessions to see your trends and key-combo stats.</p>
        {history.length > 0 && (
          <label className="inline-flex items-center gap-2 cursor-pointer select-none mt-4">
            <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Combo metric:</span>
            <button
              type="button"
              role="switch"
              aria-checked={comboMetricWpm}
              onClick={() => setComboMetricWpm((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${comboMetricWpm ? 'bg-amber-500' : 'bg-stone-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${comboMetricWpm ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ marginTop: 2 }} />
            </button>
            <span className="text-[10px] font-mono text-stone-500 w-12">{comboMetricWpm ? 'WPM' : 'ms'}</span>
          </label>
        )}
      </div>
      {historyError ? (
        <p className="text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          {historyError} Check the browser console for details.
        </p>
      ) : history.length === 0 ? (
        <p className="text-center text-stone-400">Complete a practice session to see stats here.</p>
      ) : (
        <div className="space-y-8">
          {history.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
                <span className="font-serif font-black text-stone-800">{h.reference || 'Practice'}</span>
                <span className="text-sm font-mono font-bold text-amber-600">{h.wpm} WPM · {h.accuracy}%</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-wider mb-2">Slowest 2 key combos</h3>
                    <ul className="space-y-1.5 font-mono text-sm">
                      {(h.slowestBigrams || []).length ? (
                        (h.slowestBigrams || []).map((b, i) => (
                          <li key={i} className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-stone-600">{formatBigram(b, comboMetricWpm)}</span>
                            {onStartBigramDrill && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onStartBigramDrill(b.bigram, h.targetWPM, h.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors shrink-0 ${
                                    b.drillPassed === true ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                    b.drillPassed === false ? 'bg-red-500 hover:bg-red-600 text-white' :
                                    'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                  }`}
                                >
                                  Practice
                                </button>
                                {formatDrillResult(b, comboMetricWpm) != null && (
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">{formatDrillResult(b, comboMetricWpm)}</span>
                                )}
                              </>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="text-stone-400">—</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-wider mb-2">Fastest 2 key combos</h3>
                    <ul className="space-y-1.5 font-mono text-sm">
                      {(h.fastestBigrams || []).length ? (
                        (h.fastestBigrams || []).map((b, i) => (
                          <li key={i} className="text-emerald-600">
                            {formatBigram(b, comboMetricWpm)}
                          </li>
                        ))
                      ) : (
                        <li className="text-stone-400">—</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-2">Below target (need practice)</h3>
                  <ul className="space-y-1.5 font-mono text-sm">
                    {(h.belowTargetBigrams || []).length ? (
                      (h.belowTargetBigrams || []).map((b, i) => (
                        <li key={i} className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-stone-600">{formatBigram(b, comboMetricWpm)}</span>
                          {onStartBigramDrill && (
                            <>
                              <button
                                type="button"
                                onClick={() => onStartBigramDrill(b.bigram, h.targetWPM, h.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors shrink-0 ${
                                  b.drillPassed === true ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                  b.drillPassed === false ? 'bg-red-500 hover:bg-red-600 text-white' :
                                  'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                }`}
                              >
                                Practice
                              </button>
                              {formatDrillResult(b, comboMetricWpm) != null && (
                                <span className="text-[10px] font-mono text-stone-400 shrink-0">{formatDrillResult(b, comboMetricWpm)}</span>
                              )}
                            </>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="text-stone-400">—</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
