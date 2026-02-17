
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Book, Chapter, GenerationProgress } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'AIPEN_PRO_STORAGE_V3';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, currentStep, activeProject }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  const handleNav = (step: AppState) => {
    setStep(step);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 px-4 md:px-12 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 cursor-pointer group z-[110]" onClick={() => handleNav(AppState.HOME)}>
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-[360deg]">
            <i className="fas fa-pen-nib text-sm"></i>
          </div>
          <div className="text-perspective-container">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 serif-text animate-wobble-killer text-3d-hover">AiPen</h1>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Studio', step: AppState.HOME },
            { label: 'Developer', step: AppState.DEVELOPER },
          ].map((item) => (
            <div key={item.label} className="text-perspective-container">
              <button 
                onClick={() => handleNav(item.step)} 
                className={`px-4 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest text-3d-hover ${currentStep === item.step ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {activeProject && currentStep !== AppState.VIEWER && (
            <button 
              onClick={() => handleNav(AppState.VIEWER)} 
              className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black text-[9px] uppercase tracking-widest btn-killer"
            >
              <i className="fas fa-play text-[8px]"></i> Resume Book
            </button>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
          >
            <i className="fas fa-bars-staggered text-lg"></i>
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 w-full h-full bg-white z-[300] lg:hidden transition-all duration-500 ease-in-out flex flex-col ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-pen-nib text-xs"></i>
            </div>
            <div className="text-perspective-container">
              <span className="text-base font-black text-slate-900 serif-text uppercase tracking-widest animate-wobble-killer text-3d-hover">Navigation</span>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center active:scale-90 transition-all">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-10 gap-3 max-w-lg mx-auto w-full">
          {[
            { label: 'Studio', step: AppState.HOME, icon: 'fa-layer-group' },
            { label: 'Developer', step: AppState.DEVELOPER, icon: 'fa-user-astronaut' },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => handleNav(item.step)}
              className={`flex items-center gap-5 p-5 rounded-2xl transition-all text-left border-2 w-full hover:translate-x-2 ${currentStep === item.step ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-slate-50 border-transparent text-slate-600'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${currentStep === item.step ? 'bg-indigo-500' : 'bg-white shadow-sm'}`}>
                <i className={`fas ${item.icon} text-lg ${currentStep === item.step ? 'text-white' : 'text-slate-400'}`}></i>
              </div>
              <span className="text-xl font-black serif-text">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const Footer: React.FC = () => (
  <footer className="w-full bg-slate-50 py-12 px-6 border-t border-slate-100 no-print mt-auto">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-1000 group-hover:rotate-[360deg]">
           <i className="fas fa-pen-nib"></i>
        </div>
        <div className="flex flex-col text-perspective-container">
          <span className="serif-text font-black text-slate-900 text-xl tracking-tight animate-wobble-killer text-3d-hover">AiPen Studio</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-80 cursor-default">Premium AI Engineering</span>
        </div>
      </div>
      <div className="flex gap-4">
        <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
          <i className="fab fa-linkedin-in text-lg"></i>
        </a>
        <a href="https://github.com/gforg5" target="_blank" className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
          <i className="fab fa-github text-lg"></i>
        </a>
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
      } catch (e: any) {
          setError(e.message || "Visual synthesis failed.");
          setLoading(false);
      }
  }

  return (
    <div className="my-12 p-8 md:p-16 bg-slate-50 rounded-[32px] border border-slate-100 text-center no-print animate-scale-up hover:bg-white transition-all duration-500 hover:shadow-xl">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mx-auto mb-6 animate-float">
          <i className="fas fa-wand-magic-sparkles text-indigo-500 text-xl"></i>
        </div>
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Neural Materialization Required</div>
        <p className="text-lg md:text-xl text-slate-700 italic font-medium max-w-xl mx-auto mb-10 serif-text leading-relaxed">"{desc}"</p>
        
        <button 
            onClick={generate}
            disabled={loading}
            className="group relative bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 inline-flex items-center gap-3 btn-killer"
        >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
            {loading ? "Synthesizing..." : "Manifest Visual Context"}
        </button>
        {error && <div className="text-red-500 text-[10px] mt-4 font-bold uppercase tracking-widest">{error}</div>}
    </div>
  )
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [step, setStep] = useState<AppState>(AppState.HOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Business/Self-Help');
  const [length, setLength] = useState(100);
  const [author, setAuthor] = useState('SMA');
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  
  const [progress, setProgress] = useState<GenerationProgress>({
    currentChapter: 0,
    totalChapters: 0,
    message: ''
  });

  // Robust Persistence
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  const ensureApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        return true; 
      }
    }
    return true;
  };

  const handleApiError = async (err: any) => {
    const errorMessage = err.message || "";
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("quota") || errorMessage.includes("429")) {
      setError("AI Engine Overloaded or Key Reset Required. Please ensure you have selected a valid Billing Key.");
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        await aistudio.openSelectKey();
      }
    } else {
      setError(`Operation Interrupted: ${errorMessage}`);
    }
    setLoading(false);
  };

  const startOutline = async () => {
    if (!title) {
      setError("Please provide a title to begin.");
      return;
    }
    
    setLoading(true);
    setError(null);

    await ensureApiKey();

    try {
      const outline = await geminiService.generateOutline(title, genre, length);
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        author: author || 'SMA',
        genre,
        targetLength: length,
        outline,
        covers: [],
        createdAt: new Date().toISOString(),
        history: [{ timestamp: new Date().toLocaleTimeString(), event: 'Blueprint Architected.', version: 1 }]
      };
      
      setCurrentBook(newBook);
      setStep(AppState.OUTLINING);
    } catch (err: any) {
      await handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING);
    setLoading(true);
    setError(null);
    
    await ensureApiKey();

    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Priming authorial cores...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({
          currentChapter: i + 1,
          totalChapters: updatedOutline.length,
          message: `Drafting Manuscript: ${updatedOutline[i].title}`
        });
        
        updatedOutline[i].status = 'writing';
        const content = await geminiService.generateChapterContent(currentBook.title, currentBook.genre, updatedOutline[i]);
        updatedOutline[i].content = content;
        updatedOutline[i].status = 'completed';
        updatedOutline[i].wordCount = (content || '').split(/\s+/).length;
        
        const partialBook = { ...currentBook, outline: [...updatedOutline] };
        setCurrentBook(partialBook);
      }
      
      setProgress(p => ({ ...p, message: 'Synthesizing cinematic covers...' }));
      const covers = await geminiService.generateCovers(currentBook.title, currentBook.genre);
      const finalBook = { ...currentBook, outline: [...updatedOutline], covers };
      
      setCurrentBook(finalBook);
      setProjects(prev => {
         const filtered = prev.filter(p => p.id !== finalBook.id);
         return [finalBook, ...filtered];
      });
      setStep(AppState.VIEWER);
    } catch (err: any) {
      await handleApiError(err);
      setStep(AppState.OUTLINING);
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

  const deleteProject = (id: string) => {
    if (confirm("Permanently remove this archive?")) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (currentBook?.id === id) setCurrentBook(null);
    }
  }

  const handleReplaceVisual = (desc: string, base64: string, chapterIndex: number) => {
    if (!currentBook) return;
    const updatedOutline = [...currentBook.outline];
    const chapter = { ...updatedOutline[chapterIndex] };
    
    const regex = new RegExp(`\\[VISUAL:\\s*${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`);
    const imageHtml = `\n\n<div class="my-16 text-center animate-scale-up group no-print"><img src="${base64}" alt="${desc}" class="rounded-[32px] shadow-2xl mx-auto w-full border-[8px] border-white group-hover:scale-105 transition-all duration-1000" /><p class="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Neural Synthesis</p></div>\n\n`;
    
    chapter.content = (chapter.content || '').replace(regex, imageHtml);
    updatedOutline[chapterIndex] = chapter;
    
    const updatedBook = { ...currentBook, outline: updatedOutline };
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
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Header 
        setStep={setStep} 
        currentStep={step} 
        activeProject={!!currentBook}
      />
      
      <main className="flex-1 flex flex-col items-center w-full relative">
        
        {error && (
          <div className="fixed top-24 z-[110] w-[90%] max-w-xl bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center justify-between no-print shadow-2xl animate-fade-in-up">
            <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-indigo-400"></i> {error}
            </span>
            <button onClick={() => setError(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center">
               <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {step === AppState.HOME && (
          <div className="w-full animate-fade-in-up no-print">
            <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto w-full">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">v11.0 High-Fidelity Studio</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 serif-text tracking-tighter leading-none">
                      Architect <br/>
                      <span className="text-indigo-600 italic">Masterpieces.</span>
                    </h2>
                  </div>

                  <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-2xl space-y-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Book Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Agentic Intelligence"
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none font-black serif-text text-xl transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Author Name</label>
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="SMA"
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none font-bold text-sm transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Volume (50-500 Pages)</label>
                        <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(Number(e.target.value))}
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Genre Classification</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)}
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all">
                           <option>Business/Self-Help</option>
                           <option>Science Fiction</option>
                           <option>History/Biography</option>
                           <option>Educational</option>
                           <option>Thriller/Mystery</option>
                        </select>
                      </div>
                    </div>
                    
                    <button onClick={startOutline} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black transition-all shadow-xl disabled:bg-slate-200 uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 btn-killer active:scale-95">
                      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-layer-group"></i>}
                      {loading ? "Architecting..." : "Architect Book"}
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-5 hidden lg:block">
                   <div className="killer-perspective">
                     <div className="killer-tilt rounded-[48px] shadow-3xl rotate-2 aspect-[4/5] w-full bg-slate-100 border-8 border-white">
                       <img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200" alt="Hero Manuscript" />
                     </div>
                   </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50 py-20 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="mb-12">
                   <h3 className="text-3xl font-black text-slate-900 serif-text tracking-tight uppercase">Archive Vault</h3>
                </div>

                {projects.length === 0 ? (
                  <div className="py-20 bg-white border border-slate-100 rounded-[48px] flex flex-col items-center text-center">
                     <i className="fas fa-folder-open text-6xl text-slate-100 mb-8"></i>
                     <h4 className="text-xl font-black text-slate-300 serif-text uppercase tracking-widest">No volumes archived</h4>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map(project => (
                      <div key={project.id} onClick={() => loadProject(project)} className="group bg-white p-8 rounded-[32px] border border-slate-100 hover-card cursor-pointer relative transition-all">
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="absolute top-6 right-6 text-slate-300 hover:text-red-600 z-10 p-2">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                        <div className="space-y-6">
                           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                              <i className="fas fa-book text-2xl"></i>
                           </div>
                           <h4 className="text-2xl font-black text-slate-900 serif-text line-clamp-1">{project.title}</h4>
                           <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{project.genre} • {new Date(project.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {step === AppState.OUTLINING && (
          <div className="py-20 animate-fade-in-up w-full max-w-4xl px-6 no-print">
             <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl space-y-10">
                <div className="flex justify-between items-center">
                   <h2 className="text-4xl font-black serif-text text-slate-900 uppercase">Architecture Blueprint</h2>
                   <button onClick={() => setStep(AppState.HOME)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                   {currentBook?.outline.map((ch, idx) => (
                      <div key={ch.id} className="p-6 bg-slate-50 rounded-2xl flex justify-between items-start border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                         <div className="space-y-2">
                            <span className="font-bold text-slate-900 block text-lg">{idx + 1}. {ch.title}</span>
                            <div className="flex flex-wrap gap-2">
                               {ch.subsections.slice(0, 3).map((sub, i) => (
                                  <span key={i} className="text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-500 uppercase font-bold">{sub}</span>
                               ))}
                               {ch.subsections.length > 3 && <span className="text-[9px] px-2 py-1 bg-white text-slate-300 uppercase font-bold">+{ch.subsections.length - 3} more</span>}
                            </div>
                         </div>
                         <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Segment Ready</span>
                      </div>
                   ))}
                </div>
                <button onClick={startWriting} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95">Initiate Drafting Cycle</button>
             </div>
          </div>
        )}

        {step === AppState.WRITING && (
           <div className="py-40 text-center animate-fade-in-up flex flex-col items-center w-full px-6 no-print">
              <div className="relative mb-20">
                 <div className="w-32 h-32 md:w-48 md:h-48 border-[12px] border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-feather-pointed text-slate-200 text-4xl animate-pulse"></i>
                 </div>
              </div>
              <h2 className="text-4xl font-black serif-text text-slate-900 uppercase mb-4 tracking-tight">Synthesizing Manuscript</h2>
              <div className="h-1.5 w-20 bg-indigo-500 mx-auto mb-8 rounded-full"></div>
              <p className="text-indigo-600 font-bold italic text-xl animate-pulse">{progress.message}</p>
              <div className="w-full max-w-md h-2.5 bg-slate-50 rounded-full mx-auto overflow-hidden border border-slate-100 mt-10 shadow-inner">
                 <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}></div>
              </div>
              <div className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Neural Convergence in Progress</div>
           </div>
        )}

        {step === AppState.VIEWER && currentBook && (
          <>
            <div className="hidden print:block w-full">
              <div className="book-page flex flex-col items-center justify-center text-center" style={{ breakAfter: 'page' }}>
                 <div className="text-[20px] font-black tracking-[1.6em] uppercase text-slate-900 mb-20 opacity-90">O F F I C I A L  B O O K</div>
                 <h1 className="text-9xl font-black text-slate-900 serif-text leading-tight mb-8">{currentBook.title}</h1>
                 <div className="w-32 h-1 bg-slate-900/10 mb-12 rounded-full"></div>
                 <div className="text-4xl text-slate-600 italic serif-text font-medium">Writer: {currentBook.author}</div>
              </div>
              
              {currentBook.outline.map((ch, idx) => (
                <div key={ch.id} className="book-page">
                  <div className="flex justify-between items-center mb-20 border-b border-slate-100 pb-8">
                    <h2 className="text-3xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0">Segment {idx + 1}: {ch.title}</h2>
                    <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">AiPen Studio v11.0</div>
                  </div>
                  <div className="prose-book">
                     <div dangerouslySetInnerHTML={{ __html: marked.parse(ch.content || '') as string }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full animate-fade-in-up flex flex-col items-center px-6 no-print">
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:left-20 md:top-1/2 md:-translate-y-1/2 flex md:flex-col gap-8 z-50 bg-white/80 backdrop-blur-2xl p-4 rounded-[40px] shadow-3xl border border-white/20">
                 <button 
                  disabled={activeChapterIndex === 0}
                  onClick={() => { setActiveChapterIndex(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="w-16 h-16 md:w-24 md:h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
                 >
                   <i className="fas fa-chevron-left md:text-2xl"></i>
                 </button>
                 <button 
                  disabled={activeChapterIndex === currentBook.outline.length - 1}
                  onClick={() => { setActiveChapterIndex(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="w-16 h-16 md:w-24 md:h-24 bg-slate-900 shadow-2xl rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
                 >
                   <i className="fas fa-chevron-right md:text-2xl"></i>
                 </button>
              </div>
              
              <div className="w-full max-w-5xl space-y-12 mb-32">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm mt-12">
                   <div className="flex gap-12 text-center md:text-left">
                      <div>
                         <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Lexicon</div>
                         <div className="text-3xl font-black text-slate-900 tracking-tighter">{totalWords.toLocaleString()}</div>
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Segment</div>
                         <div className="text-3xl font-black text-slate-900 tracking-tighter">{activeChapterIndex + 1}/{currentBook.outline.length}</div>
                      </div>
                   </div>
                   <div className="flex gap-4 w-full sm:w-auto">
                      <button onClick={() => setStep(AppState.HOME)} className="px-8 py-5 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition-all">Studio</button>
                      <button onClick={() => window.print()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><i className="fas fa-file-pdf"></i> Export Volume</button>
                   </div>
                 </div>
                 
                 <div className="bg-white rounded-[64px] shadow-2xl p-12 md:p-32 border border-slate-50 overflow-hidden">
                    {activeChapterIndex === 0 && (
                      <div className="mb-40 text-center border-b border-slate-50 pb-32 space-y-12 animate-fade-in-up">
                         <div className="text-[16px] font-black tracking-[1.4em] uppercase text-slate-900 mb-20">O F F I C I A L  B O O K</div>
                         <h1 className="text-7xl md:text-9xl font-black text-slate-900 serif-text leading-tight tracking-tighter mb-4">{currentBook.title}</h1>
                         <div className="text-3xl text-slate-400 italic serif-text font-medium block">Writer: {currentBook.author}</div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-16 border-b border-slate-50 pb-8">
                       <h2 className="text-3xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0">Segment {activeChapterIndex + 1}: {currentBook.outline[activeChapterIndex].title}</h2>
                       <div className="text-[11px] font-black text-slate-300 uppercase italic">Architect Draft v11.0</div>
                    </div>
                    
                    <div className="prose-book animate-fade-in-up">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) {
                          return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} />;
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
          </>
        )}

        {step === AppState.DEVELOPER && (
           <div className="w-full max-w-4xl px-6 py-20 animate-fade-in-up no-print">
              <div className="bg-slate-900 p-12 md:p-20 rounded-[64px] shadow-3xl text-center space-y-12 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-slate-900"></div>
                 <div className="w-48 h-48 mx-auto rounded-full border-8 border-indigo-600 overflow-hidden shadow-2xl transition-transform hover:scale-110 duration-700">
                    <img src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" className="w-full h-full object-cover grayscale" alt="Sayed Mohsin Ali" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-5xl font-black text-white serif-text uppercase tracking-tight">Sayed Mohsin Ali</h2>
                    <p className="text-indigo-400 text-xl font-medium italic serif-text">"Engineering the future of autonomous manuscripts."</p>
                 </div>
                 <div className="flex justify-center gap-6">
                    <a href="https://github.com/gforg5" target="_blank" className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all shadow-lg"><i className="fab fa-github text-2xl"></i></a>
                    <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-[#0077B5] hover:text-white transition-all shadow-lg"><i className="fab fa-linkedin-in text-2xl"></i></a>
                 </div>
                 <button onClick={() => setStep(AppState.HOME)} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all active:scale-95">Back to Studio</button>
              </div>
           </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
