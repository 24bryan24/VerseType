import React, { useState, useEffect, useMemo, memo } from 'react';
import { Search, List, EyeOff, Layout, Type, RefreshCw, AlertCircle, GraduationCap, ChevronRight, Timer, Eye, Play, RotateCcw, AlignLeft, Grid3X3 } from 'lucide-react';

// Simplified Bible Metadata for the selector
const BIBLE_DATA = [
  { book: 'Genesis', chapters: 50 }, { book: 'Exodus', chapters: 40 }, { book: 'Leviticus', chapters: 27 },
  { book: 'Numbers', chapters: 36 }, { book: 'Deuteronomy', chapters: 34 }, { book: 'Joshua', chapters: 24 },
  { book: 'Judges', chapters: 21 }, { book: 'Ruth', chapters: 4 }, { book: '1 Samuel', chapters: 31 },
  { book: '2 Samuel', chapters: 24 }, { book: '1 Kings', chapters: 22 }, { book: '2 Kings', chapters: 25 },
  { book: '1 Chronicles', chapters: 29 }, { book: '2 Chronicles', chapters: 36 }, { book: 'Ezra', chapters: 10 },
  { book: 'Nehemiah', chapters: 13 }, { book: 'Esther', chapters: 10 }, { book: 'Job', chapters: 42 },
  { book: 'Psalms', chapters: 150 }, { book: 'Proverbs', chapters: 31 }, { book: 'Ecclesiastes', chapters: 12 },
  { book: 'Song of Solomon', chapters: 8 }, { book: 'Isaiah', chapters: 66 }, { book: 'Jeremiah', chapters: 52 },
  { book: 'Lamentations', chapters: 5 }, { book: 'Ezekiel', chapters: 48 }, { book: 'Daniel', chapters: 12 },
  { book: 'Hosea', chapters: 14 }, { book: 'Joel', chapters: 3 }, { book: 'Amos', chapters: 9 },
  { book: 'Obadiah', chapters: 1 }, { book: 'Jonah', chapters: 4 }, { book: 'Micah', chapters: 7 },
  { book: 'Nahum', chapters: 3 }, { book: 'Habakkuk', chapters: 3 }, { book: 'Zephaniah', chapters: 3 },
  { book: 'Haggai', chapters: 2 }, { book: 'Zechariah', chapters: 14 }, { book: 'Malachi', chapters: 4 },
  { book: 'Matthew', chapters: 28 }, { book: 'Mark', chapters: 16 }, { book: 'Luke', chapters: 24 },
  { book: 'John', chapters: 21 }, { book: 'Acts', chapters: 28 }, { book: 'Romans', chapters: 16 },
  { book: '1 Corinthians', chapters: 16 }, { book: '2 Corinthians', chapters: 13 }, { book: 'Galatians', chapters: 6 },
  { book: 'Ephesians', chapters: 6 }, { book: 'Philippians', chapters: 4 }, { book: 'Colossians', chapters: 4 },
  { book: '1 Thessalonians', chapters: 5 }, { book: '2 Thessalonians', chapters: 3 }, { book: '1 Timothy', chapters: 6 },
  { book: '2 Timothy', chapters: 4 }, { book: 'Titus', chapters: 3 }, { book: 'Philemon', chapters: 1 },
  { book: 'Hebrews', chapters: 13 }, { book: 'James', chapters: 5 }, { book: '1 Peter', chapters: 5 },
  { book: '2 Peter', chapters: 3 }, { book: '1 John', chapters: 5 }, { book: '2 John', chapters: 1 },
  { book: '3 John', chapters: 1 }, { book: 'Jude', chapters: 1 }, { book: 'Revelation', chapters: 22 }
];

// Optimized Word Component to prevent unnecessary re-renders during layout shifts
const Word = memo(({ word, visibilityMode, revealedLetters, currentWpmIndex, showUnderlines, onClick }) => {
  const baseVisibility = visibilityMode === 'full' ? 99 : parseInt(visibilityMode);
  const extraReveal = revealedLetters[word.id] || 0;
  const totalVisible = baseVisibility + extraReveal;
  const charVisibleMode = visibilityMode === 'wpm' && word.id === currentWpmIndex;

  return (
    <div 
      onClick={() => onClick(word.id)}
      className={`cursor-pointer select-none transition-all group relative ${showUnderlines ? 'font-mono tracking-tighter' : 'tracking-[-0.1em]'}`}
    >
      {word.letters.map((char, cIdx) => {
        const isPunctuation = /[^a-zA-Z0-9]/.test(char);
        let isCurrentlyVisible = false;
        
        if (visibilityMode === 'wpm') {
          isCurrentlyVisible = charVisibleMode;
        } else {
          isCurrentlyVisible = isPunctuation || cIdx < totalVisible;
        }

        return (
          <span 
            key={cIdx} 
            className={`transition-all duration-200 inline-block ${isCurrentlyVisible ? 'opacity-100' : 'opacity-0'} ${showUnderlines && !isCurrentlyVisible && !isPunctuation ? 'border-b-2 border-slate-200 !opacity-100 text-transparent' : ''}`}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
});

const App = () => {
  const API_TOKEN = '2e524054a71754facfb7f01d2a41452552d1b6a1';

  // Search/Selection State
  const [searchMode, setSearchMode] = useState('text'); 
  const [manualQuery, setManualQuery] = useState('John 3:16');
  
  // Selector State
  const [selBook, setSelBook] = useState('John');
  const [selChapter, setSelChapter] = useState('3');
  const [selVerse, setSelVerse] = useState('16');

  // App State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verseData, setVerseData] = useState(null);
  const [visibilityMode, setVisibilityMode] = useState('full'); 
  const [showUnderlines, setShowUnderlines] = useState(true);
  const [isStudyModeActive, setIsStudyModeActive] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState({});

  // WPM State
  const [wpmValue, setWpmValue] = useState(50);
  const [currentWpmIndex, setCurrentWpmIndex] = useState(-1);
  const [isWpmPlaying, setIsWpmPlaying] = useState(false);
  const [wpmCycleTarget, setWpmCycleTarget] = useState(5);
  const [wpmCycleCount, setWpmCycleCount] = useState(0);

  // App Title Options State
  const appNameOptions = [
    "Word Heart", "Verse Flow", "Lampsight", "Scripture Recall", "Logos Memo",
    "Fountain Recall", "Gospel Ink", "Spirit Script", "Heart Tablet", "The Reminder",
    "Living Word", "Verse Vault", "Sacred Echo", "Anchor Memory", "Truth Trace",
    "Seed Sower", "Bright Lamp", "Daily Manna", "Pure Logos", "Way Marker",
    "Deep Roots", "Morning Star", "Rock Steady", "Spirit Breath", "Golden Lamp",
    "Eternal Echo", "Light Path", "Ancient Path", "Zion Stream", "Shepherd Voice",
    "Wisdom Well", "Narrow Gate", "Kingdom Key", "Temple Wall", "Selah Space"
  ];
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  // Memoized lists for the selector
  const chaptersList = useMemo(() => {
    const book = BIBLE_DATA.find(b => b.book === selBook);
    return book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : [1];
  }, [selBook]);

  // Exponential backoff helper for API retries
  const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  // Fetch Logic
  const fetchPassage = async () => {
    let finalQuery = searchMode === 'text' ? manualQuery : `${selBook} ${selChapter}:${selVerse}`;
    setLoading(true);
    setError(null);
    setRevealedLetters({});
    setIsStudyModeActive(false);
    resetWpm();

    try {
      const isFullBook = BIBLE_DATA.some(b => b.book.toLowerCase() === finalQuery.trim().toLowerCase());
      const selectedBookMeta = BIBLE_DATA.find(b => b.book.toLowerCase() === finalQuery.trim().toLowerCase());

      let chaptersToFetch = [];
      if (isFullBook && selectedBookMeta) {
        chaptersToFetch = Array.from({ length: selectedBookMeta.chapters }, (_, i) => `${selectedBookMeta.book} ${i + 1}`);
      } else {
        chaptersToFetch = [finalQuery];
      }

      let allWords = [];
      let sections = [];
      let globalWordCounter = 0;

      for (const query of chaptersToFetch) {
        const esvUrl = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(query)}&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false`;
        
        const data = await fetchWithRetry(esvUrl, {
          headers: { 'Authorization': `Token ${API_TOKEN}` }
        });

        if (data.passages?.[0]) {
          const rawText = data.passages[0].trim();
          
          const rawTokens = rawText.split(/\s+/);
          const processedTokens = [];
          
          rawTokens.forEach(token => {
            if (token.includes('-')) {
              const parts = token.split(/(-)/);
              let current = "";
              parts.forEach((p, idx) => {
                if (p === '-') {
                  current += p;
                  processedTokens.push(current);
                  current = "";
                } else if (p !== "") {
                  if (idx === parts.length - 1) {
                    processedTokens.push(p);
                  } else {
                    current = p;
                  }
                }
              });
            } else {
              processedTokens.push(token);
            }
          });

          const wordsInChapter = processedTokens.map((w) => {
            const wordObj = {
              id: globalWordCounter++,
              text: w,
              letters: w.split('')
            };
            allWords.push(wordObj);
            return wordObj;
          });

          sections.push({
            title: isFullBook ? query : data.canonical,
            words: wordsInChapter
          });
        }
      }

      if (sections.length === 0) throw new Error("Passage not found.");

      setVerseData({ 
        reference: isFullBook ? selectedBookMeta.book : sections[0].title, 
        sections: sections,
        allWords: allWords
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetWpm = () => {
    setIsWpmPlaying(false);
    setCurrentWpmIndex(-1);
    setWpmCycleCount(0);
  };

  // Study Mode Cycle
  useEffect(() => {
    let interval;
    if (isStudyModeActive) {
      const modes = ['full', '3', '2', '1'];
      interval = setInterval(() => {
        setVisibilityMode(prev => {
          const idx = modes.indexOf(prev);
          return modes[(idx + 1) % modes.length];
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isStudyModeActive]);

  // WPM Cycle Logic
  useEffect(() => {
    let interval;
    if (visibilityMode === 'wpm' && isWpmPlaying && verseData?.allWords) {
      const msPerWord = (60 / wpmValue) * 1000;
      
      interval = setInterval(() => {
        setCurrentWpmIndex(prev => {
          if (prev >= verseData.allWords.length - 1) {
            setWpmCycleCount(c => {
              const nextCount = c + 1;
              if (nextCount >= wpmCycleTarget) {
                setIsWpmPlaying(false);
                return nextCount;
              }
              return nextCount;
            });
            return 0; 
          }
          return prev + 1;
        });
      }, msPerWord);
    }
    return () => clearInterval(interval);
  }, [visibilityMode, isWpmPlaying, wpmValue, verseData, wpmCycleTarget]);

  const toggleWpmValue = () => {
    setWpmValue(prev => (prev >= 500 ? 50 : prev + 50));
  };

  const toggleCycleTarget = () => {
    setWpmCycleTarget(prev => (prev === 5 ? 10 : 5));
  };

  const handleWordClick = (wordGlobalIdx) => {
    if (visibilityMode === 'full' || visibilityMode === 'wpm') return;
    setRevealedLetters(prev => ({
      ...prev,
      [wordGlobalIdx]: (prev[wordGlobalIdx] || 0) + 1
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 font-sans p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div className="cursor-pointer group" onClick={() => setCurrentTitleIndex((prev) => (prev + 1) % appNameOptions.length)}>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
              {appNameOptions[currentTitleIndex].split(' ')[0]} <span className="text-blue-600">{appNameOptions[currentTitleIndex].split(' ')[1]}</span>
            </h1>
            <p className="text-slate-500 font-medium">Click title to cycle names • Interactive ESV Tool</p>
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-400 tracking-widest uppercase border-b-2 border-slate-200">
            ESV API v3
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</span>
                <button 
                  onClick={() => setSearchMode(searchMode === 'text' ? 'select' : 'text')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold uppercase"
                >
                  {searchMode === 'text' ? <List size={12}/> : <Type size={12}/>}
                  {searchMode === 'text' ? 'Browse Bible' : 'Manual Search'}
                </button>
              </div>
              
              <div className="flex gap-2">
                {searchMode === 'text' ? (
                  <div className="relative w-full">
                    <input 
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchPassage()}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 pl-11 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder="e.g. Philippians 4:8"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <select 
                      value={selBook} 
                      onChange={(e) => setSelBook(e.target.value)}
                      className="flex-[2] bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 font-medium outline-none focus:border-blue-500"
                    >
                      {BIBLE_DATA.map(b => <option key={b.book} value={b.book}>{b.book}</option>)}
                    </select>
                    <select 
                      value={selChapter} 
                      onChange={(e) => setSelChapter(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 font-medium outline-none focus:border-blue-500"
                    >
                      {chaptersList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex-1 relative">
                      <input 
                        type="number" 
                        value={selVerse}
                        onChange={(e) => setSelVerse(e.target.value)}
                        placeholder="V"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 font-medium outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={fetchPassage}
                  disabled={loading}
                  className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : <ChevronRight size={24} />}
                </button>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Sticky Memory Toolbar */}
        <div className="sticky top-4 z-50 flex flex-wrap items-center justify-between gap-4 mb-8 bg-neutral-50/80 backdrop-blur-md py-2 px-1 rounded-2xl">
          <div className="flex bg-white rounded-xl shadow-lg border border-slate-200 p-1">
            <button
              onClick={() => { setVisibilityMode('full'); setIsStudyModeActive(false); resetWpm(); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                visibilityMode === 'full' && !isStudyModeActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Eye size={16} />
            </button>
            {[
              { id: '1', label: '1L' },
              { id: '2', label: '2L' },
              { id: '3', label: '3L' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => { setVisibilityMode(m.id); setIsStudyModeActive(false); resetWpm(); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  visibilityMode === m.id && !isStudyModeActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="font-black text-sm">{m.label}</span>
              </button>
            ))}
            <button
              onClick={() => { setVisibilityMode('wpm'); setIsStudyModeActive(false); }}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-l border-slate-100 ml-1 ${
                visibilityMode === 'wpm' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Timer size={14} />
              WPM
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setIsStudyModeActive(!isStudyModeActive); resetWpm(); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg text-xs font-bold uppercase tracking-widest border-2 transition-all ${
                isStudyModeActive ? 'bg-orange-500 border-orange-500 text-white shadow-orange-200' : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <GraduationCap size={16} />
              Study
            </button>

            <button
              onClick={() => setShowUnderlines(!showUnderlines)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg text-xs font-bold uppercase tracking-widest border-2 transition-all ${
                !showUnderlines ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200' : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              {showUnderlines ? <Grid3X3 size={16} /> : <AlignLeft size={16} />}
              {showUnderlines ? 'Word Map' : 'Natural Flow'}
            </button>
          </div>
        </div>

        {/* Verse Canvas */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-16 min-h-[450px] relative overflow-hidden">
          {verseData ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <header className="flex justify-between items-start mb-10 pb-6 border-b border-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8">
                    {verseData.reference}
                  </h2>
                </div>

                {/* WPM Reader HUD */}
                {visibilityMode === 'wpm' && (
                  <div className="flex flex-col items-end gap-3 animate-in slide-in-from-right-4">
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button onClick={toggleWpmValue} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50">{wpmValue} WPM</button>
                      <button onClick={toggleCycleTarget} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50">{wpmCycleTarget} CYCLES</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">CYCLE {wpmCycleCount} / {wpmCycleTarget}</div>
                      <button onClick={() => setIsWpmPlaying(!isWpmPlaying)} className={`p-2 rounded-full transition-all shadow-lg ${isWpmPlaying ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
                        {isWpmPlaying ? <RotateCcw size={16} /> : <Play size={16} className="ml-0.5" />}
                      </button>
                    </div>
                  </div>
                )}
                {isStudyModeActive && <div className="px-3 py-1 text-[10px] font-black rounded-full animate-pulse bg-orange-100 text-orange-600">AUTO-CYCLE ACTIVE</div>}
              </header>
              
              <div className="space-y-12">
                {verseData.sections.map((section, sIdx) => (
                  <div key={sIdx} className="animate-in fade-in duration-700">
                    {verseData.sections.length > 1 && <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-4">{section.title}</h3>}
                    <div className={`flex flex-wrap ${showUnderlines ? 'gap-x-4 gap-y-6' : 'gap-x-[0.1em] gap-y-4'} text-2xl md:text-3xl font-medium text-slate-800 leading-[1.4]`}>
                      {section.words.map((word) => (
                        <Word 
                          key={word.id}
                          word={word}
                          visibilityMode={visibilityMode}
                          revealedLetters={revealedLetters}
                          currentWpmIndex={currentWpmIndex}
                          showUnderlines={showUnderlines}
                          onClick={handleWordClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 pt-20">
              <EyeOff size={64} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-xl font-bold text-slate-300">Ready to memorize?</p>
              <p className="text-sm font-medium text-slate-300 mt-1 uppercase tracking-tighter">Choose a passage above</p>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center pb-20">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ESV® Bible • Crossway Publishing • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
