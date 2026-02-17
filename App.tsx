
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Book, Chapter, GenerationProgress } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'AIPEN_V11_STABLE_PRO';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, currentStep, activeProject }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleNav = (step: AppState) => {
    setStep(step);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 px-4 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-[360deg]">
            <i className="fas fa-pen-nib text-sm"></i>
          </div>
          <h1 className="text-xl font-black text-slate-900 serif-text tracking-tighter animate-wobble-killer">AiPen</h1>
        </div>
        
        <nav className="hidden lg:flex items-center gap-2">
          {[{ label: 'Studio', step: AppState.HOME }, { label: 'Architect', step: AppState.DEVELOPER }].map((item) => (
            <button key={item.label} onClick={() => handleNav(item.step)} 
              className={`px-5 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest ${currentStep === item.step ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {activeProject && currentStep !== AppState.VIEWER && (
            <button onClick={() => handleNav(AppState.VIEWER)} className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-xl font-black text-[9px] uppercase tracking-widest">
              <i className="fas fa-play text-[8px]"></i> Resume
            </button>
          )}
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-900"><i className="fas fa-bars-staggered"></i></button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 w-full h-full bg-white z-[300] lg:hidden transition-all duration-500 flex flex-col ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><i className="fas fa-pen-nib text-xs"></i></div><span className="text-base font-black text-slate-900 serif-text uppercase tracking-widest">Navigation</span></div>
          <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center"><i className="fas fa-times"></i></button>
        </div>
        <div className="flex-1 flex flex-col justify-center px-10 gap-4">
          {[{ label: 'Studio', step: AppState.HOME }, { label: 'Architect', step: AppState.DEVELOPER }].map((item) => (
            <button key={item.label} onClick={() => handleNav(item.step)} className={`text-3xl font-black serif-text text-left p-4 rounded-2xl ${currentStep === item.step ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</button>
          ))}
        </div>
      </div>
    </>
  );
};

const VisualPlaceholder: React.FC<{desc: string, genre: string, onReplace: (desc: string, b64: string) => void}> = ({desc, genre, onReplace}) => {
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const b64 = await geminiService.generateChapterImage(desc, genre);
      onReplace(desc, b64);
    } catch (e) { console.error(e); }
    setLoading(false);
  }
  return (
    <div className="my-16 p-10 bg-slate-50 rounded-[40px] border border-slate-100 text-center no-print">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Neural Materialization Required</div>
      <p className="text-xl text-slate-700 italic font-medium max-w-xl mx-auto mb-8 serif-text">"{desc}"</p>
      <button onClick={generate} disabled={loading} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-50">
        {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-image mr-2"></i>}
        {loading ? "Materializing..." : "Generate Visual Context"}
      </button>
    </div>
  )
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [step, setStep] = useState<AppState>(AppState.HOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('SMA');
  const [genre, setGenre] = useState('Business/Self-Help');
  const [length, setLength] = useState(100);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [progress, setProgress] = useState<GenerationProgress>({ currentChapter: 0, totalChapters: 0, message: '' });

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const ensureApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        return true; // Proceed assuming key selection initiated
      }
    }
    return true;
  };

  const startOutline = async () => {
    if (!title) { setError("Title required."); return; }
    setLoading(true); setError(null);
    await ensureApiKey();

    try {
      const outline = await geminiService.generateOutline(title, genre, length);
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title, author: author || 'SMA', genre, targetLength: length,
        outline, covers: [], createdAt: new Date().toISOString(), history: []
      };
      setCurrentBook(newBook);
      setProjects(prev => [newBook, ...prev]);
      setStep(AppState.OUTLINING);
    } catch (err: any) {
      setError(err.message || "Failed to start. Check your API key.");
    } finally { setLoading(false); }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING); setLoading(true); setError(null);
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Priming cores...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({ currentChapter: i + 1, totalChapters: updatedOutline.length, message: `Drafting: ${updatedOutline[i].title}` });
        const content = await geminiService.generateChapterContent(currentBook.title, currentBook.genre, updatedOutline[i]);
        updatedOutline[i].content = content;
        updatedOutline[i].status = 'completed';
        updatedOutline[i].wordCount = (content || '').split(/\s+/).length;
        
        const partialBook = { ...currentBook, outline: [...updatedOutline] };
        setCurrentBook(partialBook);
        setProjects(prev => [partialBook, ...prev.filter(p => p.id !== partialBook.id)]);
      }
      setStep(AppState.VIEWER);
    } catch (err: any) { setError("Interrupted. Please retry."); } finally { setLoading(false); }
  };

  const deleteProject = (id: string) => {
    if (confirm("Delete archive?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentBook?.id === id) setCurrentBook(null);
    }
  }

  const exportBook = () => {
    if (!currentBook) return;
    document.title = `${currentBook.title} - ${currentBook.author}`;
    window.print();
  }

  const handleReplaceVisual = (desc: string, base64: string, idx: number) => {
    if (!currentBook) return;
    const outline = [...currentBook.outline];
    const regex =