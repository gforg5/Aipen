import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Book, Chapter, GenerationProgress, BookHistoryEvent } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'aipen_projects_v7';

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
            { label: 'Technology', step: AppState.ABOUT },
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
              <i className="fas fa-play text-[8px]"></i> Resume Session
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
            { label: 'Technology', step: AppState.ABOUT, icon: 'fa-bolt-lightning' },
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
          {/* Subtle little zoom for the text */}
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:scale-[1.05] hover:text-indigo-600 transition-all duration-500 opacity-80 cursor-default">Premium AI Engineering</span>
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
          setError(e.message || "Materialization failed.");
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
            {loading ? "Materializing..." : "Manifest Visual Context"}
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

  const startOutline = async () => {
    if (!title) {
      setError("Provide a manuscript title.");
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
        history: [{ timestamp: new Date().toLocaleTimeString(), event: 'Core blueprint initialized.', version: 1 }]
      };
      
      setCurrentBook(newBook);
      setProjects(prev => [newBook, ...prev]);
      setStep(AppState.OUTLINING);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Engine latency detected (Outline phase).");
    } finally {
      setLoading(false);
    }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING);
    setLoading(true);
    
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Initializing neural cores...' });

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
      setStep(AppState.VIEWER);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authoring process interrupted.");
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
    if (confirm("Permanently delete archive?")) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (currentBook?.id === id) setCurrentBook(null);
    }
  }

  const handleReplaceVisual = (desc: string, base64: string, chapterIndex: number) => {
    if (!currentBook) return;
    const updatedOutline = [...currentBook.outline];
    const chapter = { ...updatedOutline[chapterIndex] };
    
    const regex = new RegExp(`\\[VISUAL:\\s*${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`);
    const imageHtml = `\n\n<div class="my-16 text-center animate-scale-up group"><img src="${base64}" alt="${desc}" class="rounded-[32px] shadow-2xl mx-auto w-full border-[8px] border-white group-hover:scale-105 transition-all duration-1000" /><p class="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Neural Materialization</p></div>\n\n`;
    
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
          <div className="w-full animate-fade-in-up">
            <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto w-full">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full animate-float">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                      <div className="text-perspective-container">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 animate-text-float text-3d-hover">v7.0 Master Engine</span>
                      </div>
                    </div>
                    <div className="text-perspective-container block w-full">
                      <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 serif-text tracking-tighter leading-none animate-reveal-skew text-3d-hover">
                        <span className="animate-wobble-killer">Architect</span> <br/>
                        <span className="text-indigo-600 italic animate-text-float">Masterpieces.</span>
                      </h2>
                    </div>
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl serif-text leading-relaxed">
                      Translate abstract concepts into professional-grade manuscripts with high-fidelity semantic drafting.
                    </p>
                  </div>

                  <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-2xl space-y-8 hover:shadow-indigo-50 transition-all duration-700">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Manuscript Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Quantum Divide"
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all placeholder:text-slate-200 font-black serif-text text-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Author Name</label>
                        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your Name"
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Target Pages (50-500)</label>
                        <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(Number(e.target.value))}
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Category (Genre)</label>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)}
                          className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-sm">
                           <option>Business/Self-Help</option>
                           <option>Science Fiction</option>
                           <option>History/Biography</option>
                           <option>Educational</option>
                           <option>Thriller/Mystery</option>
                        </select>
                      </div>
                    </div>
                    
                    <button onClick={startOutline} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:bg-slate-200 uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 btn-killer">
                      {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-layer-group"></i>}
                      {loading ? "Constructing..." : "Architect Manuscript"}
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-5 hidden lg:block relative">
                   <div className="absolute -inset-20 bg-indigo-500/5 blur-[120px] rounded-full"></div>
                   {/* Clean Image Container with internal zoom clipping */}
                   <div className="relative z-10 killer-perspective">
                     <div className="killer-tilt rounded-[48px] shadow-3xl rotate-2 aspect-[4/5] w-full cursor-pointer bg-slate-100 border-8 border-white">
                       <img 
                         src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200" 
                         className="grayscale brightness-110 h-full w-full object-cover" 
                         alt="Hero Manuscript Illustration"
                       />
                     </div>
                   </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50 py-20 px-6">
              <div className="max-w-7xl mx-auto w-full">
                <div className="mb-12 space-y-2 text-center md:text-left">
                  <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-text-float">Archive Vault</span>
                  <div className="text-perspective-container">
                    <h3 className="text-3xl md:text-5xl font-black text-slate-900 serif-text tracking-tight animate-wobble-killer text-3d-hover">Your Books History</h3>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="py-20 bg-white border border-slate-100 rounded-[48px] flex flex-col items-center text-center shadow-sm hover-card group">
                     <i className="fas fa-folder-open text-6xl text-slate-100 mb-8 transition-transform group-hover:scale-125 duration-500"></i>
                     <h4 className="text-xl font-black text-slate-300 serif-text uppercase tracking-widest animate-text-float">No manuscripts archived</h4>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map(project => (
                      <div key={project.id} onClick={() => loadProject(project)} className="group bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover-card cursor-pointer flex flex-col relative overflow-hidden">
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center z-10">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                        <div className="space-y-6">
                           <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                              <i className="fas fa-book text-2xl"></i>
                           </div>
                           <div className="space-y-2">
                              <h4 className="text-2xl font-black text-slate-900 serif-text line-clamp-1 group-hover:text-indigo-600 transition-colors animate-text-float">{project.title}</h4>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                 <span className="text-indigo-500">{project.genre}</span>
                                 <span>•</span>
                                 <span>{new Date(project.createdAt).toLocaleDateString()}</span>
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
          <div className="w-full max-w-6xl px-6 py-16 flex flex-col items-center animate-fade-in-up">
             <div className="self-start mb-10">
                <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <i className="fas fa-arrow-left"></i> Home
                </button>
             </div>
             
             <div className="w-full bg-slate-900 rounded-[64px] p-10 md:p-20 relative overflow-hidden shadow-3xl">
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
               <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-start relative z-10">
                 
                 <div className="w-64 h-64 md:w-96 md:h-96 shrink-0 killer-perspective group relative">
                   {/* High Intensity Killer Glow Aura Layer */}
                   <div className="absolute inset-0 bg-indigo-500/50 blur-[100px] rounded-full animate-pulse scale-75 opacity-70"></div>
                   
                   <div className="killer-tilt killer-glow-aura rounded-[60px] cursor-pointer bg-slate-800 h-full w-full relative z-10">
                      <img src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" className="grayscale brightness-110 h-full w-full object-cover rounded-[56px]" />
                   </div>
                 </div>

                 <div className="space-y-12 text-center lg:text-left flex-1">
                   <div className="space-y-4">
                     <span className="text-indigo-400 text-[11px] font-black uppercase tracking-[1em] animate-text-float">Architect</span>
                     <div className="text-perspective-container block w-full">
                       <h2 className="font-black text-white serif-text tracking-tighter leading-none whitespace-nowrap text-[clamp(2.3rem,6.5vw,4.8rem)] overflow-hidden animate-reveal-skew text-3d-hover">
                         <span className="animate-wobble-killer">Sayed Mohsin Ali</span>
                       </h2>
                     </div>
                     <div className="h-1.5 w-24 bg-indigo-600 rounded-full mx-auto lg:mx-0 animate-pulse"></div>
                   </div>
                   
                   <p className="text-xl md:text-3xl text-slate-300 font-medium serif-text italic leading-relaxed max-w-2xl mx-auto lg:mx-0">
                     "We engineer high-fidelity tools that harness intelligence to empower storytellers through premium digital experiences."
                   </p>
                   
                   <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-8">
                      <a href="https://www.linkedin.com/in/sayed-mohsin-ali-924b8926b" target="_blank" className="group relative px-10 py-5 bg-white text-slate-900 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:text-white transition-all duration-500 overflow-hidden hover:scale-110 shadow-3xl">
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <div className="relative z-10 flex items-center gap-3">
                          <i className="fab fa-linkedin-in group-hover:rotate-[360deg] transition-transform duration-1000"></i> LinkedIn Connect
                        </div>
                      </a>
                      
                      <a href="https://github.com/gforg5" target="_blank" className="group relative px-10 py-5 bg-slate-800 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all duration-500 overflow-hidden hover:scale-110 border border-white/10 shadow-3xl">
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <div className="relative z-10 flex items-center gap-3">
                          <i className="fab fa-github group-hover:rotate-[360deg] transition-transform duration-1000"></i> GitHub Profile
                        </div>
                      </a>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {step === AppState.ABOUT && (
          <div className="w-full max-w-5xl px-6 py-20 text-center space-y-24 animate-fade-in-up">
            <div className="space-y-4">
              <span className="text-indigo-600 text-[11px] font-black uppercase tracking-[0.6em] animate-text-float">Core Intelligence</span>
              <div className="text-perspective-container">
                <h2 className="text-5xl md:text-7xl font-black serif-text tracking-tighter animate-wobble-killer text-3d-hover">Semantic Technology</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-10">
               <div className="p-12 bg-slate-50 rounded-[48px] border border-slate-100 text-left space-y-6 hover-card group">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm animate-float group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                     <i className="fas fa-microchip text-3xl"></i>
                  </div>
                  <h3 className="text-3xl font-black serif-text animate-text-float">Context Awareness</h3>
                  <p className="text-slate-500 text-lg leading-relaxed">Advanced narrative alignment that maintains character voice and consistency over long-form drafting.</p>
               </div>
               <div className="p-12 bg-slate-900 rounded-[48px] text-left space-y-6 hover-card group">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 animate-float group-hover:bg-white group-hover:text-indigo-600 transition-colors duration-500">
                     <i className="fas fa-image text-3xl"></i>
                  </div>
                  <h3 className="text-3xl font-black serif-text text-white animate-text-float">Visual Synthesis</h3>
                  <p className="text-slate-400 text-lg leading-relaxed">High-fidelity materialization of visual content derived directly from the semantic core of the manuscript.</p>
               </div>
            </div>
          </div>
        )}

        {step === AppState.OUTLINING && (
          <div className="w-full max-w-5xl px-6 py-16 animate-fade-in-up flex flex-col items-center">
            <div className="self-start mb-8">
               <button onClick={() => setStep(AppState.HOME)} className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all">
                 <i className="fas fa-arrow-left"></i> Adjust Blueprint
               </button>
            </div>
            <div className="w-full space-y-12">
               <div className="text-center space-y-4">
                  <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em] animate-text-float">Structure Verified</span>
                  <div className="text-perspective-container">
                    <h2 className="text-4xl md:text-6xl font-black serif-text text-slate-900 tracking-tight animate-wobble-killer text-3d-hover">Manuscript Architecture</h2>
                  </div>
               </div>
               <div className="grid gap-4 w-full max-w-4xl mx-auto">
                  {currentBook?.outline.map((ch, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 flex gap-8 items-center hover-card hover:bg-white">
                       <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-slate-200 serif-text shadow-sm group-hover:text-indigo-600 transition-all">
                         {String(idx + 1).padStart(2, '0')}
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="font-black text-slate-900 text-2xl serif-text leading-tight animate-text-float">{ch.title}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ch.subsections.join(' • ')}</div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex flex-col items-center gap-6 pt-10">
                  <button onClick={startWriting} className="w-full max-w-lg py-6 bg-slate-900 text-white rounded-3xl font-black shadow-2xl hover:scale-[1.02] transition-transform uppercase text-[11px] tracking-[0.4em] btn-killer">
                    Commence Full Authoring
                  </button>
               </div>
            </div>
          </div>
        )}

        {step === AppState.WRITING && (
           <div className="py-40 text-center animate-fade-in-up flex flex-col items-center w-full px-6">
              <div className="relative mb-20 animate-float">
                 <div className="w-32 h-32 md:w-48 md:h-48 border-[12px] border-slate-50 border-t-indigo-600 rounded-full animate-spin shadow-2xl"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-feather-pointed text-slate-200 text-4xl md:text-6xl animate-pulse"></i>
                 </div>
              </div>
              <div className="space-y-6">
                 <div className="text-perspective-container">
                   <h2 className="text-4xl md:text-6xl font-black serif-text text-slate-900 tracking-tight animate-wobble-killer text-3d-hover">Synthesizing Manuscript</h2>
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-[0.6em] text-[11px] animate-text-float">{progress.message}</p>
                 <div className="w-full max-w-md h-2 bg-slate-50 rounded-full mx-auto overflow-hidden border border-slate-100 shadow-inner">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}></div>
                 </div>
              </div>
           </div>
        )}

        {step === AppState.VIEWER && currentBook && (
          <div className="w-full animate-fade-in-up flex flex-col items-center px-6">
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:left-20 md:top-1/2 md:-translate-y-1/2 flex md:flex-col gap-8 z-50 no-print bg-white/80 backdrop-blur-2xl p-4 md:p-0 rounded-[40px] shadow-3xl md:shadow-none border border-slate-200 md:border-none">
               <button 
                disabled={activeChapterIndex === 0}
                onClick={() => { setActiveChapterIndex(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="w-16 h-16 md:w-24 md:h-24 bg-white border border-slate-200 shadow-2xl rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:scale-110 active:scale-90 transition-all disabled:opacity-20"
               >
                 <i className="fas fa-chevron-left md:text-2xl"></i>
               </button>
               <button 
                disabled={activeChapterIndex === currentBook.outline.length - 1}
                onClick={() => { setActiveChapterIndex(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="w-16 h-16 md:w-24 md:h-24 bg-slate-900 shadow-2xl rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all disabled:opacity-20"
               >
                 <i className="fas fa-chevron-right md:text-2xl"></i>
               </button>
            </div>
            
            <div className="w-full max-w-5xl space-y-12 mb-32">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm no-print">
                 <div className="flex gap-12 text-center md:text-left">
                    <div>
                       <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 animate-text-float">Lexicon</div>
                       <div className="text-3xl font-black text-slate-900 tracking-tighter">{totalWords.toLocaleString()}</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 animate-text-float">Segment</div>
                       <div className="text-3xl font-black text-slate-900 tracking-tighter">{activeChapterIndex + 1}/{currentBook.outline.length}</div>
                    </div>
                 </div>
                 <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={() => setStep(AppState.HOME)} className="flex-1 sm:flex-none px-8 py-5 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all">Home</button>
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 btn-killer"><i className="fas fa-file-pdf"></i> Export PDF</button>
                 </div>
               </div>
               
               <div className="book-page p-12 md:p-32 bg-white rounded-[64px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] min-h-screen">
                  <div className="prose prose-slate max-w-none">
                    {activeChapterIndex === 0 && (
                      <div className="mb-40 text-center border-b border-slate-50 pb-32 space-y-12">
                         <div className="text-[11px] font-black tracking-[0.8em] uppercase text-indigo-500 animate-text-float">Official Manuscript</div>
                         <div className="text-perspective-container">
                          <h1 className="text-6xl md:text-9xl font-black text-slate-900 leading-[0.85] serif-text tracking-tighter animate-reveal-skew animate-wobble-killer text-3d-hover">{currentBook.title}</h1>
                         </div>
                         <div className="text-3xl text-slate-400 italic serif-text font-medium animate-text-float">{currentBook.author}</div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-16 border-b border-slate-50 pb-8 no-print">
                       <div className="text-perspective-container">
                        <h2 className="text-3xl font-black text-indigo-600 serif-text tracking-tight uppercase m-0 animate-wobble-killer text-3d-hover">Segment {activeChapterIndex + 1}</h2>
                       </div>
                       <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Architect Draft v1.2</div>
                    </div>
                    <div className="chapter-body text-2xl text-slate-700 leading-relaxed serif-text">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) {
                          return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} className="mb-12" />;
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