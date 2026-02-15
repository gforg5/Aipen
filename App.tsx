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
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-3 px-4 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer z-[110]" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <i className="fas fa-pen-nib text-sm md:text-lg"></i>
          </div>
          <h1 className="text-lg md:text-xl font-black tracking-tighter text-slate-900 serif-text">AiPen</h1>
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
              className={`px-4 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest ${currentStep === item.step ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {activeProject && currentStep !== AppState.VIEWER && (
            <button 
              onClick={() => handleNav(AppState.VIEWER)} 
              className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-black text-[9px] uppercase tracking-widest"
            >
              <i className="fas fa-play text-[8px]"></i> Resume
            </button>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-900 focus:outline-none transition-all active:scale-95"
            aria-label="Open Menu"
          >
            <i className="fas fa-bars-staggered text-lg"></i>
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 w-full h-full bg-white z-[300] lg:hidden transition-all duration-500 ease-in-out flex flex-col ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-pen-nib text-xs"></i>
            </div>
            <span className="text-base font-black tracking-tighter text-slate-900 serif-text uppercase tracking-widest">Navigation</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="w-10 h-10 rounded-full bg-slate-50 text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 max-w-xl mx-auto w-full py-6">
          <div className="space-y-3">
            {[
              { label: 'Studio', step: AppState.HOME, icon: 'fa-layer-group', desc: 'Craft your book' },
              { label: 'Developer', step: AppState.DEVELOPER, icon: 'fa-user-astronaut', desc: 'About the creator' },
              { label: 'Technology', step: AppState.ABOUT, icon: 'fa-bolt-lightning', desc: 'Neural engine' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => handleNav(item.step)}
                className={`flex items-center gap-4 p-4 rounded-[20px] transition-all text-left border w-full group ${currentStep === item.step ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-600'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${currentStep === item.step ? 'bg-indigo-500' : 'bg-white shadow-sm'}`}>
                  <i className={`fas ${item.icon} text-[12px] ${currentStep === item.step ? 'text-white' : 'text-slate-400'}`}></i>
                </div>
                <div>
                  <span className="text-lg font-black serif-text block leading-none mb-0.5">{item.label}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${currentStep === item.step ? 'text-indigo-300' : 'text-slate-400'}`}>{item.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {activeProject && (
            <div className="mt-6 p-5 bg-indigo-600 rounded-[28px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <i className="fas fa-book-open text-3xl"></i>
              </div>
              <div className="relative z-10 flex flex-col items-start gap-3">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] mb-0.5 opacity-60">Session Storage</span>
                  <span className="text-md font-black serif-text">Resume Masterpiece</span>
                </div>
                <button 
                  onClick={() => handleNav(AppState.VIEWER)} 
                  className="w-full bg-white text-indigo-600 py-3 rounded-lg font-black text-[9px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg"
                >
                  Jump Back In
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-8 border-t border-slate-50 flex flex-col items-center gap-6 bg-slate-50/50">
          <div className="flex items-center justify-center gap-3 w-full">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md">
               <i className="fas fa-pen-nib text-xs"></i>
            </div>
            <div className="flex flex-col text-left">
              <span className="serif-text font-black text-slate-900 text-lg tracking-tight leading-none">AiPen Studio</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Premium Books Studio</span>
            </div>
          </div>
          
          <div className="flex gap-6 justify-center w-full">
             <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
               <i className="fab fa-linkedin-in text-lg"></i>
             </a>
             <a href="https://github.com/gforg5" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
               <i className="fab fa-github text-lg"></i>
             </a>
          </div>
        </div>
      </div>
    </>
  );
};

const Footer: React.FC = () => (
  <footer className="w-full bg-white py-10 px-6 border-t border-slate-50 no-print mt-auto">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
           <i className="fas fa-pen-nib"></i>
        </div>
        <div className="flex flex-col text-center md:text-left">
          <span className="serif-text font-black text-slate-900 text-lg tracking-tight leading-none">AiPen Studio</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Premium Books Studio</span>
        </div>
      </div>
      
      <div className="flex gap-5">
        <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i className="fab fa-linkedin-in text-lg"></i></a>
        <a href="https://github.com/gforg5" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i className="fab fa-github text-lg"></i></a>
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
      <div className="my-10 p-6 md:p-12 bg-slate-50 rounded-[32px] md:rounded-[48px] border border-slate-100 text-center no-print">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mx-auto mb-5">
            <i className="fas fa-wand-magic-sparkles text-indigo-500 text-lg"></i>
          </div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Narrative Visualization</div>
          <p className="text-base md:text-lg text-slate-700 italic font-medium max-w-xl mx-auto mb-8 serif-text leading-relaxed">"{desc}"</p>
          
          <button 
              onClick={generate}
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 inline-flex items-center gap-3"
          >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Rendering...</> : <><i className="fas fa-image"></i> Materialize Image</>}
          </button>
          {error && <div className="text-red-500 text-[9px] mt-4 font-bold uppercase tracking-widest">{error}</div>}
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
    const imageHtml = `\n\n<div class="my-10 md:my-16 text-center break-inside-avoid"><img src="${base64}" alt="${desc}" class="rounded-[24px] md:rounded-[40px] shadow-2xl mx-auto w-full border-4 border-white" /><p class="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Generated Illustration</p></div>\n\n`;
    
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
          <div className="fixed top-20 z-[110] w-[90%] max-w-2xl bg-slate-900 text-white px-5 py-3.5 rounded-[24px] flex items-center justify-between no-print shadow-2xl animate-in slide-in-from-top-4">
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-indigo-400"></i>
              {error}
            </span>
            <button onClick={() => setError(null)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center">
               <i className="fas fa-times text-[10px]"></i>
            </button>
          </div>
        )}

        {step === AppState.HOME && (
          <div className="w-full animate-in fade-in duration-1000">
            {/* COMPACT HERO SECTION */}
            <section className="px-6 py-8 md:py-16 max-w-7xl mx-auto w-full">
              <div className="grid lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
                <div className="lg:col-span-7 space-y-6 md:space-y-10 text-center lg:text-left">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">v5.0 Enterprise Edition</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-slate-900 serif-text tracking-tighter leading-[0.95]">
                      Architect <br className="hidden md:block"/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 italic">Masterpieces.</span>
                    </h2>
                    <p className="text-base md:text-lg lg:text-xl text-slate-400 font-medium max-w-xl mx-auto lg:mx-0 serif-text leading-relaxed">
                      AI-driven manuscript architecture. Turn a simple concept into a professional publication.
                    </p>
                  </div>

                  <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.06)] space-y-6 text-left">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Book Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Quantum Divide"
                          className="w-full px-5 py-4 rounded-[18px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all placeholder:text-slate-300 font-black serif-text text-lg" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Author Name</label>
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your Name"
                          className="w-full px-5 py-4 rounded-[18px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all font-bold text-sm" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Category</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-5 py-4 rounded-[18px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-50/50 outline-none appearance-none font-bold text-sm">
                          <option>Business/Self-Help</option>
                          <option>Science Fiction</option>
                          <option>Mystery/Thriller</option>
                          <option>Educational</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Target Pages</label>
                        <div className="relative">
                          <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full px-5 py-4 rounded-[18px] border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-50/50 outline-none font-bold text-sm" />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none hidden sm:block">Pages</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={startOutline} disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[20px] font-black hover:bg-slate-800 transition-all shadow-xl disabled:bg-slate-200 uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3">
                      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-layer-group"></i>}
                      {loading ? "Constructing..." : "Architect Manuscript"}
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-5 hidden lg:block relative">
                   <div className="absolute -inset-10 bg-indigo-500/5 blur-[100px] rounded-full"></div>
                   <div className="relative z-10 p-3 bg-white border border-slate-100 rounded-[60px] shadow-xl overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700">
                      <img 
                        src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200" 
                        className="w-full aspect-[4/5] object-cover rounded-[50px] grayscale brightness-110" 
                        alt="Elite Studio" 
                      />
                   </div>
                </div>
              </div>
            </section>

            {/* COMPACT HISTORY SECTION */}
            <section className="bg-slate-50 py-12 md:py-20 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 text-center md:text-left">
                  <div className="space-y-2">
                    <span className="text-indigo-600 text-[9px] font-black uppercase tracking-[0.4em]">Vault Access</span>
                    <h3 className="text-3xl md:text-5xl font-black text-slate-900 serif-text tracking-tight">Recent Archives</h3>
                    <p className="text-slate-400 text-base md:text-lg font-medium serif-text italic">Your persistent collection of literary architecture.</p>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="py-16 md:py-24 bg-white border border-slate-100 rounded-[48px] flex flex-col items-center text-center px-6 shadow-sm">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                        <i className="fas fa-folder-open text-3xl"></i>
                     </div>
                     <h4 className="text-xl font-black text-slate-300 serif-text">No History Found</h4>
                     <p className="text-slate-400 text-[9px] mt-2 font-black uppercase tracking-widest">Architect your first project above to populate this vault.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <div 
                        key={project.id} 
                        onClick={() => loadProject(project)}
                        className="group bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-5">
                           <button 
                             onClick={(e) => deleteProject(e, project.id)}
                             className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                           >
                             <i className="fas fa-trash-alt text-xs"></i>
                           </button>
                        </div>
                        <div className="space-y-6 flex-1">
                           <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                              <i className="fas fa-book-open text-xl"></i>
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-xl font-black text-slate-900 serif-text line-clamp-2 leading-tight">{project.title}</h4>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{project.genre}</span>
                                 <span className="text-slate-200">•</span>
                                 <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(project.createdAt).toLocaleDateString()}</span>
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
          <div className="w-full max-w-6xl px-6 py-10 md:py-16 animate-in zoom-in-95 duration-700 flex flex-col items-center">
             <div className="self-start mb-8 animate-fade-in-up">
                <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                  <i className="fas fa-arrow-left"></i> Studio
                </button>
             </div>
             
             <div className="w-full bg-slate-900 rounded-[40px] md:rounded-[60px] p-8 md:p-12 lg:p-20 relative overflow-hidden shadow-2xl border border-white/5 animate-float-slow">
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
               <div className="flex flex-col lg:flex-row gap-12 md:gap-16 items-center lg:items-start relative z-10">
                 
                 <div className="w-48 h-48 md:w-80 md:h-80 shrink-0 relative group animate-fade-in-up">
                   <div className="absolute -inset-4 bg-indigo-500/20 rounded-[50px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                   <div className="absolute -inset-1 bg-white/5 rounded-[42px] backdrop-blur-sm border border-white/10 group-hover:border-indigo-500/30 transition-all duration-500"></div>
                   <div className="w-full h-full rounded-[40px] overflow-hidden relative z-10 border-4 border-slate-800 shadow-xl">
                      <img 
                        src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" 
                        className="w-full h-full object-cover grayscale brightness-110 hover:grayscale-0 hover:scale-110 transition-all duration-1000 ease-in-out cursor-pointer" 
                        alt="Sayed Mohsin Ali" 
                      />
                   </div>
                 </div>

                 <div className="space-y-10 md:space-y-12 text-center lg:text-left flex-1 w-full overflow-hidden">
                   <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                     <span className="inline-block text-indigo-400 text-[10px] font-black uppercase tracking-[0.6em]">Developer</span>
                     {/* REFINED RESPONSIVE TYPOGRAPHY: ALI NOW FITS PERFECTLY ON ONE LINE */}
                     <h2 className="font-black text-white serif-text tracking-tighter leading-none whitespace-nowrap overflow-visible text-[clamp(1.5rem,5.2vw,3.6rem)]">
                       Sayed Mohsin Ali
                     </h2>
                     <div className="h-1 w-20 bg-indigo-600 rounded-full mx-auto lg:mx-0"></div>
                   </div>
                   
                   <p className="text-lg md:text-2xl text-slate-300 font-medium serif-text italic leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                     "Every line of code in AiPen is crafted to bridge the gap between creative thought and digital realization."
                   </p>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-10 pt-2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                      {[
                        { label: 'Intelligence', val: 'Gemini 3.0' },
                        { label: 'Architecture', val: 'Elite UI/UX' },
                        { label: 'Engineering', val: 'React / TS' }
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                           <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</div>
                           <div className="text-lg md:text-xl font-black text-white serif-text tracking-tight">{item.val}</div>
                        </div>
                      ))}
                   </div>

                   {/* KILLER LEVEL SOCIAL ANIMATIONS */}
                   <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                      <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" rel="noopener noreferrer" 
                        className="group relative px-8 py-4 bg-white text-slate-900 rounded-[18px] font-black text-[9px] uppercase tracking-widest hover:text-white transition-all duration-500 flex items-center gap-3 shadow-xl overflow-hidden hover:scale-105 active:scale-95"
                      >
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <i className="fab fa-linkedin-in relative z-10 group-hover:rotate-[360deg] transition-transform duration-700"></i>
                        <span className="relative z-10">LinkedIn</span>
                      </a>
                      
                      <a href="https://github.com/gforg5" target="_blank" rel="noopener noreferrer" 
                        className="group relative px-8 py-4 bg-slate-800 text-white rounded-[18px] font-black text-[9px] uppercase tracking-widest transition-all duration-500 flex items-center gap-3 border border-white/5 overflow-hidden hover:scale-105 active:scale-95"
                      >
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <i className="fab fa-github relative z-10 group-hover:rotate-[360deg] transition-transform duration-700"></i>
                        <span className="relative z-10">Profile</span>
                      </a>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {step === AppState.ABOUT && (
          <div className="w-full max-w-5xl px-6 py-10 md:py-16 animate-in fade-in duration-1000 flex flex-col items-center">
            <div className="self-start mb-10">
               <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                 <i className="fas fa-arrow-left"></i> Studio
               </button>
            </div>
            <div className="space-y-12 md:space-y-20 text-center">
              <div className="space-y-3">
                <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.5em]">The Core Engine</span>
                <h2 className="text-4xl md:text-7xl font-black serif-text text-slate-900 tracking-tighter leading-none">Intelligent Synthesis</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 text-left">
                 <div className="space-y-6 p-8 bg-slate-50 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                       <i className="fas fa-microchip text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 serif-text">Neural Drafting</h3>
                    <p className="text-slate-500 text-base leading-relaxed serif-text">
                      AiPen leverages the latest Gemini models to maintain narrative consistency over hundreds of pages.
                    </p>
                 </div>
                 <div className="space-y-6 p-8 bg-slate-900 rounded-[32px] text-white">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
                       <i className="fas fa-image text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-black serif-text">Visual Context</h3>
                    <p className="text-slate-400 text-base leading-relaxed serif-text">
                      Automated visual materialization integrates high-fidelity illustrations directly into the text.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {step === AppState.OUTLINING && (
          <div className="w-full max-w-5xl px-6 py-10 md:py-16 animate-in fade-in duration-700 flex flex-col items-center">
            <div className="self-start mb-8">
               <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                 <i className="fas fa-arrow-left"></i> Adjust Inputs
               </button>
            </div>
            <div className="w-full space-y-12">
               <div className="text-center space-y-3">
                  <span className="text-indigo-600 text-[9px] font-black uppercase tracking-[0.4em]">Structure Verified</span>
                  <h2 className="text-4xl md:text-6xl font-black serif-text text-slate-900 tracking-tight">Project Hierarchy</h2>
               </div>
               <div className="grid gap-4 w-full max-w-4xl mx-auto">
                  {currentBook?.outline.map((ch, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 flex gap-6 items-center group hover:bg-white hover:shadow-lg transition-all">
                       <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl font-black text-slate-200 serif-text group-hover:text-indigo-600 transition-all shadow-sm">
                         {String(idx + 1).padStart(2, '0')}
                       </div>
                       <div className="flex-1 space-y-1">
                          <div className="font-black text-slate-900 text-xl serif-text leading-tight">{ch.title}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{ch.subsections.join(' • ')}</div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex flex-col items-center gap-6 pt-6">
                  <button onClick={startWriting} className="w-full max-w-lg py-5 bg-slate-900 text-white rounded-[24px] font-black shadow-xl hover:scale-[1.02] transition-transform uppercase text-[10px] tracking-[0.4em]">
                    Commence Full Drafting
                  </button>
               </div>
            </div>
          </div>
        )}

        {step === AppState.WRITING && (
           <div className="py-20 md:py-32 text-center animate-in fade-in duration-700 max-w-4xl w-full flex flex-col items-center px-6">
              <div className="relative mb-12">
                 <div className="w-24 h-24 md:w-36 md:h-36 border-[6px] md:border-[10px] border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-xl"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-feather-pointed text-slate-200 text-2xl md:text-4xl animate-pulse"></i>
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-3xl md:text-5xl font-black serif-text text-slate-900 tracking-tight">Drafting Manuscript</h2>
                 <div className="flex flex-col gap-2">
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">{progress.message}</p>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Constructing {progress.currentChapter} / {progress.totalChapters}</span>
                 </div>
                 <div className="w-full max-w-sm h-1.5 bg-slate-50 rounded-full mx-auto overflow-hidden border border-slate-100">
                    <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}></div>
                 </div>
              </div>
           </div>
        )}

        {step === AppState.VIEWER && currentBook && (
          <div className="w-full animate-in fade-in duration-1000 flex flex-col items-center px-4 md:px-0">
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-14 md:top-1/2 md:-translate-y-1/2 flex md:flex-col gap-4 z-50 no-print bg-white/70 backdrop-blur-2xl p-3 md:p-0 rounded-[28px] md:bg-transparent shadow-xl md:shadow-none border border-slate-200 md:border-none">
               <button 
                disabled={activeChapterIndex === 0}
                onClick={() => { setActiveChapterIndex(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="w-12 h-12 md:w-20 md:h-20 bg-white border border-slate-200 shadow-lg rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:scale-105 transition-all disabled:opacity-20"
               >
                 <i className="fas fa-chevron-left md:text-xl"></i>
               </button>
               <button 
                disabled={activeChapterIndex === currentBook.outline.length - 1}
                onClick={() => { setActiveChapterIndex(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="w-12 h-12 md:w-20 md:h-20 bg-slate-900 shadow-lg rounded-full flex items-center justify-center text-white hover:scale-105 transition-all disabled:opacity-20"
               >
                 <i className="fas fa-chevron-right md:text-xl"></i>
               </button>
            </div>
            
            <div className="w-full max-w-5xl space-y-6 md:space-y-10 mb-24 md:mb-32">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-5 md:p-8 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm no-print">
                 <div className="flex gap-8 md:gap-12 px-2">
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Lexicon</div>
                       <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{totalWords.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Progress</div>
                       <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{activeChapterIndex + 1}/{currentBook.outline.length}</div>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setStep(AppState.HOME)} className="flex-1 sm:flex-none px-6 py-4 bg-slate-50 text-slate-900 rounded-[18px] font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                       Home
                    </button>
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none px-6 py-4 bg-slate-900 text-white rounded-[18px] font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
                       <i className="fas fa-file-pdf"></i> PDF
                    </button>
                 </div>
               </div>
               
               <div className="book-page p-8 md:p-16 lg:p-24 relative overflow-hidden flex flex-col rounded-[48px] min-h-[85vh]">
                  <div className="flex-1 prose prose-slate max-w-none">
                    {activeChapterIndex === 0 && (
                      <div className="mb-16 md:mb-24 text-center border-b border-slate-50 pb-12 md:pb-20 space-y-8">
                         <div className="text-[9px] md:text-[10px] font-black tracking-[0.5em] uppercase text-indigo-500">Publication Draft</div>
                         <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-none serif-text tracking-tighter">{currentBook.title}</h1>
                         <div className="text-xl md:text-3xl text-slate-400 italic serif-text font-medium">{currentBook.author}</div>
                      </div>
                    )}
                    <div className="flex justify-between items-end mb-10 border-b border-slate-50 pb-4 no-print">
                       <h2 className="text-xl md:text-3xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0">Chapter {activeChapterIndex + 1}</h2>
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">v1.0 Draft</div>
                    </div>
                    <div className="chapter-body text-lg md:text-xl lg:text-2xl text-slate-700 leading-[1.7] serif-text">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) {
                          return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} className="mb-6 md:mb-10" />;
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