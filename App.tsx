
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Book, Chapter, GenerationProgress, BookHistoryEvent } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'aipen_projects_v5';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, currentStep, activeProject }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Strictly lock body scroll to prevent any background interaction
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMenuOpen]);

  const handleNav = (step: AppState) => {
    setStep(step);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-4 px-4 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer z-[110]" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-9 h-9 md:w-11 md:h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <i className="fas fa-pen-nib text-base md:text-xl"></i>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 serif-text">AiPen</h1>
        </div>
        
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Studio', step: AppState.HOME },
            { label: 'Developer', step: AppState.DEVELOPER },
            { label: 'Technology', step: AppState.ABOUT },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => handleNav(item.step)} 
              className={`px-5 py-2 rounded-full transition-all text-[11px] font-black uppercase tracking-widest ${currentStep === item.step ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {activeProject && currentStep !== AppState.VIEWER && (
            <button 
              onClick={() => handleNav(AppState.VIEWER)} 
              className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-black text-[10px] uppercase tracking-widest"
            >
              <i className="fas fa-play text-[8px]"></i> Resume
            </button>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 text-slate-900 focus:outline-none transition-all active:scale-95"
            aria-label="Open Menu"
          >
            <i className="fas fa-bars-staggered text-lg"></i>
          </button>
        </div>
      </header>

      {/* FULL SCREEN SOLID WHITE NAVIGATION */}
      <div className={`fixed inset-0 w-full h-full bg-white z-[300] lg:hidden transition-all duration-500 ease-in-out flex flex-col ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-pen-nib text-xs"></i>
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-900 serif-text uppercase tracking-widest text-[14px]">Navigation</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="w-12 h-12 rounded-full bg-slate-50 text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 max-w-xl mx-auto w-full py-8">
          <div className="space-y-3">
            {[
              { label: 'Studio', step: AppState.HOME, icon: 'fa-layer-group', desc: 'Craft your book' },
              { label: 'Developer', step: AppState.DEVELOPER, icon: 'fa-user-astronaut', desc: 'About the creator' },
              { label: 'Technology', step: AppState.ABOUT, icon: 'fa-bolt-lightning', desc: 'Neural engine' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => handleNav(item.step)}
                className={`flex items-center gap-4 p-4 rounded-[24px] transition-all text-left border w-full group ${currentStep === item.step ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-600'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentStep === item.step ? 'bg-indigo-500' : 'bg-white shadow-sm'}`}>
                  <i className={`fas ${item.icon} text-[13px] ${currentStep === item.step ? 'text-white' : 'text-slate-400'}`}></i>
                </div>
                <div>
                  <span className="text-lg font-black serif-text block leading-none mb-0.5">{item.label}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${currentStep === item.step ? 'text-indigo-300' : 'text-slate-400'}`}>{item.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {activeProject && (
            <div className="mt-8 p-6 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <i className="fas fa-book-open text-4xl"></i>
              </div>
              <div className="relative z-10 flex flex-col items-start gap-3">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] mb-0.5 opacity-60">Session Storage</span>
                  <span className="text-md font-black serif-text">Resume Masterpiece</span>
                </div>
                <button 
                  onClick={() => handleNav(AppState.VIEWER)} 
                  className="w-full bg-white text-indigo-600 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg"
                >
                  Jump Back In
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* REFINED MOBILE FOOTER - CENTERED & ALIGNED */}
        <div className="p-10 border-t border-slate-50 flex flex-col items-center gap-8 bg-slate-50/50">
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
               <i className="fas fa-pen-nib text-sm"></i>
            </div>
            <div className="flex flex-col text-left">
              <span className="serif-text font-black text-slate-900 text-xl tracking-tight leading-none">AiPen Studio</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Premium Books Studio</span>
            </div>
          </div>
          
          <div className="flex gap-8 justify-center w-full">
             <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
               <i className="fab fa-linkedin-in text-xl"></i>
             </a>
             <a href="https://github.com/gforg5" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
               <i className="fab fa-github text-xl"></i>
             </a>
          </div>
        </div>
      </div>
    </>
  );
};

const Footer: React.FC = () => (
  <footer className="w-full bg-white py-12 px-6 border-t border-slate-50 no-print mt-auto">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
           <i className="fas fa-pen-nib"></i>
        </div>
        <div className="flex flex-col text-center md:text-left">
          <span className="serif-text font-black text-slate-900 text-xl tracking-tight">AiPen Studio</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Books Studio</span>
        </div>
      </div>
      
      <div className="flex gap-6">
        <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><i className="fab fa-linkedin-in text-lg"></i></a>
        <a href="https://github.com/gforg5" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><i className="fab fa-github text-lg"></i></a>
      </div>
    </div>
  </footer>
);

const VisualPlaceholder: React.FC<{desc: string, genre: string, onReplace: (desc: string, b64: string) => void}> = ({desc, genre, onReplace}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
      setLoading(true);
      setError(null);
      try {
          const imgB64 = await geminiService.generateChapterImage(desc, genre);
          onReplace(desc, imgB64);
      } catch (e) {
          setError("Generation Error.");
          setLoading(false);
      }
  }

  return (
      <div className="my-12 p-8 md:p-16 bg-slate-50 rounded-[40px] md:rounded-[64px] border border-slate-100 text-center no-print">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
            <i className="fas fa-wand-magic-sparkles text-indigo-500 text-xl"></i>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Narrative Visualization</div>
          <p className="text-base md:text-xl text-slate-700 italic font-medium max-w-2xl mx-auto mb-10 serif-text leading-relaxed">"{desc}"</p>
          
          <button 
              onClick={generate}
              disabled={loading}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 inline-flex items-center gap-3"
          >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Rendering...</> : <><i className="fas fa-image"></i> Materialize Image</>}
          </button>
          {error && <div className="text-red-500 text-[10px] mt-4 font-bold uppercase tracking-widest">{error}</div>}
      </div>
  )
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Book[]>(() => {
    const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [step, setStep] = useState<AppState>(AppState.HOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Business/Self-Help');
  const [length, setLength] = useState(100);
  const [author, setAuthor] = useState('');
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  
  const [progress, setProgress] = useState<GenerationProgress>({
    currentChapter: 0,
    totalChapters: 0,
    message: ''
  });

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const updateHistory = (event: string) => {
    if (!currentBook) return;
    const newEvent: BookHistoryEvent = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      version: currentBook.history.length + 1
    };
    
    const updatedBook = { 
      ...currentBook, 
      history: [...currentBook.history, newEvent] 
    };
    
    setCurrentBook(updatedBook);
    setProjects(prev => {
        const filtered = prev.filter(p => p.id !== updatedBook.id);
        return [updatedBook, ...filtered];
    });
  };

  const startOutline = async () => {
    if (!title) {
      setError("Please specify a manuscript title.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const outline = await geminiService.generateOutline(title, genre, length);
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        author: author || 'Elite Digital Author',
        genre,
        targetLength: length,
        outline,
        covers: [],
        createdAt: new Date().toLocaleString(),
        history: [{ timestamp: new Date().toLocaleTimeString(), event: 'Outline structured.', version: 1 }]
      };
      
      setCurrentBook(newBook);
      setProjects(prev => [newBook, ...prev]);
      setStep(AppState.OUTLINING);
    } catch (err: any) {
      setError("Engine latency detected. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING);
    setLoading(true);
    
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Initializing deep semantic core...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({
          currentChapter: i + 1,
          totalChapters: updatedOutline.length,
          message: `Drafting: ${updatedOutline[i].title}`
        });
        
        updatedOutline[i].status = 'writing';
        const content = await geminiService.generateChapterContent(currentBook.title, currentBook.genre, updatedOutline[i]);
        updatedOutline[i].content = content;
        updatedOutline[i].status = 'completed';
        updatedOutline[i].wordCount = content.split(/\s+/).length;
        
        const partialBook = { ...currentBook, outline: [...updatedOutline] };
        setCurrentBook(partialBook);
        setProjects(prev => {
           const filtered = prev.filter(p => p.id !== partialBook.id);
           return [partialBook, ...filtered];
        });
      }
      
      const covers = await geminiService.generateCovers(currentBook.title, currentBook.genre);
      const finalBook = { ...currentBook, outline: [...updatedOutline], covers };
      setCurrentBook(finalBook);
      setProjects(prev => {
         const filtered = prev.filter(p => p.id !== finalBook.id);
         return [finalBook, ...filtered];
      });
      updateHistory(`Manuscript Finalized.`);
      setStep(AppState.VIEWER);
    } catch (err: any) {
      setError("A drafting interruption occurred. Progress saved.");
    } finally {
      setLoading(false);
    }
  };

  const loadProject = (project: Book) => {
    setCurrentBook(project);
    setStep(AppState.VIEWER);
    setActiveChapterIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Permanently remove this manuscript from archives?")) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (currentBook?.id === id) setCurrentBook(null);
    }
  }

  const handleReplaceVisual = (desc: string, base64: string, chapterIndex: number) => {
    if (!currentBook) return;
    const updatedOutline = [...currentBook.outline];
    const chapter = { ...updatedOutline[chapterIndex] };
    
    const regex = new RegExp(`\\[VISUAL:\\s*${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`);
    const imageHtml = `\n\n<div class="my-12 md:my-20 text-center break-inside-avoid"><img src="${base64}" alt="${desc}" class="rounded-[32px] md:rounded-[64px] shadow-2xl mx-auto w-full border-8 border-white" /><p class="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Generated Illustration</p></div>\n\n`;
    
    chapter.content = (chapter.content || '').replace(regex, imageHtml);
    updatedOutline[chapterIndex] = chapter;
    
    const updatedBook = { 
      ...currentBook, 
      outline: updatedOutline,
      history: [
        ...currentBook.history, 
        { 
          timestamp: new Date().toLocaleTimeString(), 
          event: `Illustration integrated.`, 
          version: currentBook.history.length + 1 
        }
      ]
    };
    
    setCurrentBook(updatedBook);
    setProjects(prev => {
        const filtered = prev.filter(p => p.id !== updatedBook.id);
        return [updatedBook, ...filtered];
    });
  };

  const totalWords = useMemo(() => {
    return currentBook?.outline.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0;
  }, [currentBook]);

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <Header 
        setStep={setStep} 
        currentStep={step} 
        activeProject={!!currentBook}
      />
      
      <main className="flex-1 flex flex-col items-center w-full relative z-0">
        
        {error && (
          <div className="fixed top-24 z-[110] w-[90%] max-w-2xl bg-slate-900 text-white px-6 py-4 rounded-[28px] flex items-center justify-between no-print shadow-2xl animate-in slide-in-from-top-4">
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-indigo-400"></i>
              {error}
            </span>
            <button onClick={() => setError(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center">
               <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        )}

        {step === AppState.HOME && (
          <div className="w-full animate-in fade-in duration-1000">
            <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto w-full">
              <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                <div className="lg:col-span-7 space-y-10 md:space-y-14 text-center lg:text-left">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">v5.0 Enterprise Edition</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl lg:text-9xl font-black text-slate-900 serif-text tracking-tighter leading-[0.95]">
                      Architect <br className="hidden md:block"/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 italic">Masterpieces.</span>
                    </h2>
                    <p className="text-lg md:text-xl lg:text-2xl text-slate-400 font-medium max-w-2xl mx-auto lg:mx-0 serif-text leading-relaxed">
                      AI-driven manuscript architecture. Turn a simple concept into a 50 to 500-page professional publication.
                    </p>
                  </div>

                  <div className="bg-white p-6 md:p-12 rounded-[40px] md:rounded-[64px] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] space-y-8 text-left">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Book Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Quantum Divide"
                          className="w-full px-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 font-black serif-text text-xl" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Author Name</label>
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your Name"
                          className="w-full px-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Category</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none appearance-none font-bold">
                          <option>Business/Self-Help</option>
                          <option>Science Fiction</option>
                          <option>Mystery/Thriller</option>
                          <option>Educational</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Target Pages</label>
                        <div className="relative">
                          <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full px-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none font-bold" />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none hidden sm:block">Pages</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={startOutline} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black hover:bg-slate-800 transition-all shadow-2xl disabled:bg-slate-200 uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4">
                      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-layer-group"></i>}
                      {loading ? "Constructing..." : "Architect Manuscript"}
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-5 hidden lg:block relative">
                   <div className="absolute -inset-12 bg-indigo-500/5 blur-[120px] rounded-full"></div>
                   <div className="relative z-10 p-4 bg-white border border-slate-100 rounded-[80px] shadow-2xl overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700">
                      <img 
                        src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200" 
                        className="w-full aspect-[4/5.5] object-cover rounded-[64px] grayscale brightness-110" 
                        alt="Elite Studio" 
                      />
                   </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50 py-24 md:py-32 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8 text-center md:text-left">
                  <div className="space-y-4">
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em]">Vault Access</span>
                    <h3 className="text-4xl md:text-6xl font-black text-slate-900 serif-text tracking-tight">Recent Books History</h3>
                    <p className="text-slate-400 text-lg md:text-xl font-medium serif-text italic">Your persistent collection of literary architecture.</p>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="py-24 md:py-40 bg-white border border-slate-100 rounded-[64px] flex flex-col items-center text-center px-6 shadow-sm">
                     <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
                        <i className="fas fa-folder-open text-4xl"></i>
                     </div>
                     <h4 className="text-2xl font-black text-slate-300 serif-text">No History Found</h4>
                     <p className="text-slate-400 text-[10px] mt-4 font-black uppercase tracking-widest">Architect your first project above to populate this vault.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map(project => (
                      <div 
                        key={project.id} 
                        onClick={() => loadProject(project)}
                        className="group bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-8">
                           <button 
                             onClick={(e) => deleteProject(e, project.id)}
                             className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                           >
                             <i className="fas fa-trash-alt text-sm"></i>
                           </button>
                        </div>
                        <div className="space-y-8 flex-1">
                           <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <i className="fas fa-book-open text-2xl"></i>
                           </div>
                           <div className="space-y-2">
                              <h4 className="text-2xl font-black text-slate-900 serif-text line-clamp-2 leading-tight">{project.title}</h4>
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{project.genre}</span>
                                 <span className="text-slate-200">•</span>
                                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(project.createdAt).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {step === AppState.DEVELOPER && (
          <div className="w-full max-w-6xl px-6 py-12 md:py-24 animate-in zoom-in-95 duration-700 flex flex-col items-center">
             <div className="self-start mb-10">
                <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                  <i className="fas fa-arrow-left"></i> Studio
                </button>
             </div>
             
             <div className="w-full bg-slate-900 rounded-[48px] md:rounded-[80px] p-8 md:p-12 lg:p-24 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5">
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
               <div className="flex flex-col lg:flex-row gap-16 md:gap-24 items-center lg:items-start relative z-10">
                 
                 <div className="w-64 h-64 md:w-96 md:h-96 shrink-0 relative group">
                   <div className="absolute -inset-6 bg-indigo-500/20 rounded-[70px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                   <div className="absolute -inset-2 bg-white/5 rounded-[56px] backdrop-blur-sm border border-white/10 group-hover:border-indigo-500/30 transition-all duration-500"></div>
                   <div className="w-full h-full rounded-[48px] overflow-hidden relative z-10 border-4 border-slate-800 shadow-2xl">
                      <img 
                        src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" 
                        className="w-full h-full object-cover grayscale brightness-110 hover:grayscale-0 hover:scale-110 transition-all duration-1000 ease-in-out cursor-pointer" 
                        alt="Sayed Mohsin Ali" 
                      />
                   </div>
                   <div className="absolute -bottom-8 -right-8 w-24 h-24 md:w-32 md:h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow z-20 border-8 border-slate-900 group-hover:scale-110 transition-all duration-500">
                      <i className="fas fa-bolt-lightning text-white text-3xl md:text-4xl"></i>
                   </div>
                 </div>

                 <div className="space-y-12 md:space-y-16 text-center lg:text-left flex-1 w-full overflow-hidden">
                   <div className="space-y-6">
                     <span className="inline-block text-indigo-400 text-[11px] font-black uppercase tracking-[0.8em]">Developer</span>
                     {/* FLUID FONT SIZE ENSURES FULL NAME ON ONE LINE WITHOUT TRUNCATION */}
                     <h2 className="font-black text-white serif-text tracking-tighter leading-none whitespace-nowrap overflow-visible text-[clamp(1.5rem,5.5vw,4.5rem)]">
                       Sayed Mohsin Ali
                     </h2>
                     <div className="h-1 w-24 bg-indigo-600 rounded-full mx-auto lg:mx-0"></div>
                   </div>
                   
                   <p className="text-xl md:text-3xl text-slate-300 font-medium serif-text italic leading-relaxed max-w-3xl mx-auto lg:mx-0">
                     "Every line of code in AiPen is crafted to bridge the gap between creative thought and digital realization. We are defining a new era of professional literary intelligence."
                   </p>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12 pt-4">
                      {[
                        { label: 'Intelligence', val: 'Gemini 3.0' },
                        { label: 'Architecture', val: 'Elite UI/UX' },
                        { label: 'Engineering', val: 'React / TS' }
                      ].map(item => (
                        <div key={item.label} className="space-y-2">
                           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</div>
                           <div className="text-xl md:text-2xl font-black text-white serif-text tracking-tight">{item.val}</div>
                        </div>
                      ))}
                   </div>

                   <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-8">
                      <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-white text-slate-900 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:scale-105 transition-all flex items-center gap-3 shadow-2xl">
                        <i className="fab fa-linkedin-in"></i> LinkedIn
                      </a>
                      <a href="https://github.com/gforg5" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-slate-800 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 hover:scale-105 transition-all flex items-center gap-3 border border-white/5">
                        <i className="fab fa-github"></i> Developer Profile
                      </a>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {step === AppState.ABOUT && (
          <div className="w-full max-w-5xl px-6 py-12 md:py-24 animate-in fade-in duration-1000 flex flex-col items-center">
            <div className="self-start mb-12">
               <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                 <i className="fas fa-arrow-left"></i> Studio
               </button>
            </div>
            <div className="space-y-16 md:space-y-24 text-center">
              <div className="space-y-4">
                <span className="text-indigo-600 text-[11px] font-black uppercase tracking-[0.5em]">The Core Engine</span>
                <h2 className="text-5xl md:text-8xl font-black serif-text text-slate-900 tracking-tighter leading-none">Intelligent Synthesis</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 md:gap-20 text-left">
                 <div className="space-y-8 p-10 bg-slate-50 rounded-[48px] border border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                       <i className="fas fa-microchip text-2xl"></i>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 serif-text">Neural Drafting</h3>
                    <p className="text-slate-500 text-lg leading-relaxed serif-text">
                      AiPen leverages the latest Gemini models to maintain narrative consistency over hundreds of pages, ensuring your manuscript flows with professional integrity.
                    </p>
                 </div>
                 <div className="space-y-8 p-10 bg-slate-900 rounded-[48px] text-white">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                       <i className="fas fa-image text-2xl"></i>
                    </div>
                    <h3 className="text-3xl font-black serif-text">Visual Context</h3>
                    <p className="text-slate-400 text-lg leading-relaxed serif-text">
                      Automated visual materialization integrates high-fidelity illustrations directly into the text, conceptualized from the narrative context itself.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {step === AppState.OUTLINING && (
          <div className="w-full max-w-5xl px-6 py-12 md:py-24 animate-in fade-in duration-700 flex flex-col items-center">
            <div className="self-start mb-12">
               <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                 <i className="fas fa-arrow-left"></i> Adjust Inputs
               </button>
            </div>
            <div className="w-full space-y-16">
               <div className="text-center space-y-4">
                  <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em]">Structure Verified</span>
                  <h2 className="text-5xl md:text-7xl font-black serif-text text-slate-900 tracking-tight">Project Hierarchy</h2>
               </div>
               <div className="grid gap-6 w-full max-w-4xl mx-auto">
                  {currentBook?.outline.map((ch, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 flex gap-8 items-center group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all">
                       <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-slate-200 serif-text group-hover:text-indigo-600 transition-all shadow-sm">
                         {String(idx + 1).padStart(2, '0')}
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="font-black text-slate-900 text-xl md:text-2xl serif-text leading-tight">{ch.title}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{ch.subsections.join(' • ')}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {step === AppState.WRITING && (
           <div className="py-24 md:py-40 text-center animate-in fade-in duration-700 max-w-4xl w-full flex flex-col items-center px-6">
              <div className="relative mb-16">
                 <div className="w-32 h-32 md:w-48 md:h-48 border-[8px] md:border-[12px] border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-2xl"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-feather-pointed text-slate-200 text-3xl md:text-5xl animate-pulse"></i>
                 </div>
              </div>
              <div className="space-y-8">
                 <h2 className="text-4xl md:text-6xl font-black serif-text text-slate-900 tracking-tight">Drafting Manuscript</h2>
                 <div className="flex flex-col gap-2">
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">{progress.message}</p>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Constructing Chapter {progress.currentChapter} / {progress.totalChapters}</span>
                 </div>
                 <div className="w-full max-w-md h-2 bg-slate-50 rounded-full mx-auto overflow-hidden border border-slate-100">
                    <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}></div>
                 </div>
              </div>
           </div>
        )}

        {step === AppState.VIEWER && currentBook && (
          <div className="w-full animate-in fade-in duration-1000 flex flex-col items-center px-4 md:px-0">
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-14 md:top-1/2 md:-translate-y-1/2 flex md:flex-col gap-4 md:gap-8 z-50 no-print bg-white/70 backdrop-blur-2xl p-4 md:p-0 rounded-[32px] md:bg-transparent shadow-2xl md:shadow-none border border-slate-200 md:border-none">
               <button 
                disabled={activeChapterIndex === 0}
                onClick={() => { setActiveChapterIndex(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="w-14 h-14 md:w-24 md:h-24 bg-white border border-slate-200 shadow-xl rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:scale-105 transition-all disabled:opacity-20"
               >
                 <i className="fas fa-chevron-left md:text-2xl"></i>
               </button>
               <button 
                disabled={activeChapterIndex === currentBook.outline.length - 1}
                onClick={() => { setActiveChapterIndex(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="w-14 h-14 md:w-24 md:h-24 bg-slate-900 shadow-xl rounded-full flex items-center justify-center text-white hover:scale-105 transition-all disabled:opacity-20"
               >
                 <i className="fas fa-chevron-right md:text-2xl"></i>
               </button>
            </div>
            
            <div className="w-full max-w-5xl space-y-8 md:space-y-12 mb-32 md:mb-40">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-6 md:p-10 rounded-[40px] md:rounded-[56px] border border-slate-100 shadow-sm no-print">
                 <div className="flex gap-10 md:gap-14 px-4">
                    <div className="text-center">
                       <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Lexicon</div>
                       <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{totalWords.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Progress</div>
                       <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{activeChapterIndex + 1}/{currentBook.outline.length}</div>
                    </div>
                 </div>
                 <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={() => setStep(AppState.HOME)} className="flex-1 sm:flex-none px-8 py-5 bg-slate-50 text-slate-900 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                       Back to Home
                    </button>
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none px-8 py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3">
                       <i className="fas fa-file-pdf"></i> Export PDF
                    </button>
                 </div>
               </div>
               
               <div className="book-page p-10 md:p-24 lg:p-36 relative overflow-hidden flex flex-col rounded-[64px] min-h-[90vh]">
                  <div className="flex-1 prose prose-slate max-w-none">
                    {activeChapterIndex === 0 && (
                      <div className="mb-24 md:mb-40 text-center border-b border-slate-50 pb-20 md:pb-32 space-y-10 md:space-y-14">
                         <div className="text-[10px] md:text-[11px] font-black tracking-[0.5em] uppercase text-indigo-500">Premium Publication Draft</div>
                         <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-none serif-text tracking-tighter">{currentBook.title}</h1>
                         <div className="text-2xl md:text-4xl text-slate-400 italic serif-text font-medium">{currentBook.author}</div>
                      </div>
                    )}
                    <div className="flex justify-between items-end mb-12 md:mb-20 border-b border-slate-50 pb-6 no-print">
                       <h2 className="text-2xl md:text-4xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0">Chapter {activeChapterIndex + 1}</h2>
                       <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Architectural Draft v1.0</div>
                    </div>
                    <div className="chapter-body text-xl md:text-2xl lg:text-3xl text-slate-700 leading-[1.8] md:leading-[1.9] serif-text">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) {
                          return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} className="mb-8 md:mb-12" />;
                        } else {
                          return <VisualPlaceholder 
                            key={i} 
                            desc={part} 
                            genre={currentBook.genre} 
                            onReplace={(desc, b64) => handleReplaceVisual(desc, b64, activeChapterIndex)} 
                          />;
                        }
                      })}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
