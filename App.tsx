
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Book, Chapter, GenerationProgress, BookHistoryEvent } from './types';
import { geminiService } from './services/geminiService';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'aipen_projects_v3';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  hasProjects: boolean; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, hasProjects, currentStep, activeProject }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center no-print">
    <div className="flex items-center gap-3 cursor-pointer transition-all hover:opacity-80" onClick={() => setStep(AppState.HOME)}>
      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
        <i className="fas fa-pen-nib text-lg"></i>
      </div>
      <h1 className="text-xl font-black tracking-tight text-slate-900 serif-text">AiPen</h1>
    </div>
    
    <nav className="hidden md:flex items-center gap-2">
      <button 
        onClick={() => setStep(AppState.HOME)} 
        className={`px-5 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest ${currentStep === AppState.HOME ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Studio
      </button>
      {hasProjects && (
        <button 
          onClick={() => setStep(AppState.HISTORY)} 
          className={`px-5 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest ${currentStep === AppState.HISTORY ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Archive
        </button>
      )}
      <button 
        onClick={() => setStep(AppState.ABOUT)} 
        className={`px-5 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest ${currentStep === AppState.ABOUT ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Technology
      </button>
      <button 
        onClick={() => setStep(AppState.DEVELOPER)} 
        className={`px-5 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest ${currentStep === AppState.DEVELOPER ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Architect
      </button>
    </nav>

    {activeProject && currentStep !== AppState.VIEWER && (
      <button 
        onClick={() => setStep(AppState.VIEWER)} 
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold text-[10px] uppercase tracking-widest"
      >
        Resume Work
      </button>
    )}
  </header>
);

const Footer: React.FC = () => (
  <footer className="w-full bg-white py-10 px-6 border-t border-slate-50 no-print">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
        <span className="serif-text font-bold text-slate-900 tracking-tight">AiPen Studio</span>
        <span className="opacity-30">|</span>
        <span>© 2024 Elite Digital Architecture</span>
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
        Designed by <span className="text-slate-900">Sayed Mohsin Ali</span>
      </div>
      <div className="flex gap-6 text-slate-400">
        <a href="#" className="hover:text-indigo-600 transition-colors"><i className="fab fa-linkedin-in"></i></a>
        <a href="#" className="hover:text-indigo-600 transition-colors"><i className="fab fa-github"></i></a>
        <a href="mailto:mohsin@example.com" className="hover:text-indigo-600 transition-colors"><i className="far fa-envelope"></i></a>
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
          setError("Failed to generate illustration.");
          setLoading(false);
      }
  }

  return (
      <div className="my-12 p-10 bg-slate-50/50 border border-slate-200/50 rounded-[40px] text-center no-print">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
            <i className="fas fa-sparkles text-indigo-500 text-xl"></i>
          </div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Concept Representation</div>
          <p className="text-base text-slate-700 italic font-medium max-w-xl mx-auto mb-8 serif-text leading-relaxed">"{desc}"</p>
          
          <button 
              onClick={generate}
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 inline-flex items-center gap-3"
          >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Materialize Visual</>}
          </button>
          {error && <div className="text-red-500 text-xs mt-4 font-bold uppercase tracking-tighter">{error}</div>}
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
    setProjects(prev => prev.map(p => p.id === updatedBook.id ? updatedBook : p));
  };

  const startOutline = async () => {
    if (!title) {
      setError("A title is required to architect your manuscript.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const outline = await geminiService.generateOutline(title, genre, length);
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        author: author || 'Published by SMA',
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
      setError("The AI engine is momentarily unresponsive. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING);
    setLoading(true);
    
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Initializing drafting core...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({
          currentChapter: i + 1,
          totalChapters: updatedOutline.length,
          message: `Drafting ${updatedOutline[i].title}...`
        });
        
        updatedOutline[i].status = 'writing';
        const content = await geminiService.generateChapterContent(currentBook.title, currentBook.genre, updatedOutline[i]);
        updatedOutline[i].content = content;
        updatedOutline[i].status = 'completed';
        updatedOutline[i].wordCount = content.split(/\s+/).length;
        
        const partialBook = { ...currentBook, outline: [...updatedOutline] };
        setCurrentBook(partialBook);
        setProjects(prev => prev.map(p => p.id === partialBook.id ? partialBook : p));
      }
      
      const covers = await geminiService.generateCovers(currentBook.title, currentBook.genre);
      const finalBook = { ...currentBook, outline: [...updatedOutline], covers };
      setCurrentBook(finalBook);
      setProjects(prev => prev.map(p => p.id === finalBook.id ? finalBook : p));
      updateHistory(`Manuscript complete.`);
      setStep(AppState.VIEWER);
    } catch (err: any) {
      setError("Generation error during manuscript drafting.");
    } finally {
      setLoading(false);
    }
  };

  const loadProject = (project: Book) => {
    setCurrentBook(project);
    setStep(AppState.VIEWER);
    setActiveChapterIndex(0);
  };

  const handleReplaceVisual = (desc: string, base64: string, chapterIndex: number) => {
    if (!currentBook) return;
    const updatedOutline = [...currentBook.outline];
    const chapter = { ...updatedOutline[chapterIndex] };
    
    const regex = new RegExp(`\\[VISUAL:\\s*${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`);
    const imageHtml = `\n\n<div class="my-16 text-center break-inside-avoid"><img src="${base64}" alt="${desc}" class="rounded-[48px] shadow-2xl mx-auto w-full border-8 border-white" /><p class="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Generated Illustration</p></div>\n\n`;
    
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
    setProjects(prev => prev.map(p => p.id === updatedBook.id ? updatedBook : p));
  };

  const totalWords = useMemo(() => {
    return currentBook?.outline.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0;
  }, [currentBook]);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <Header 
        setStep={setStep} 
        hasProjects={projects.length > 0} 
        currentStep={step} 
        activeProject={!!currentBook}
      />
      
      <main className="flex-1 flex flex-col items-center px-6 py-12 md:p-20 max-w-7xl mx-auto w-full relative">
        
        {error && (
          <div className="w-full max-w-2xl mb-8 bg-slate-900 text-white px-6 py-4 rounded-[24px] flex items-center justify-between no-print shadow-2xl animate-in slide-in-from-top-4">
            <span className="text-xs font-bold tracking-tight uppercase"><i className="fas fa-info-circle mr-3 text-indigo-400"></i>{error}</span>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
          </div>
        )}

        {/* Home Screen */}
        {step === AppState.HOME && (
          <div className="w-full grid md:grid-cols-12 gap-16 items-center animate-in fade-in duration-1000">
            <div className="md:col-span-7 space-y-12 text-center md:text-left">
              <div className="space-y-6">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">v3.5 Professional Edition</span>
                  {projects.length > 0 && (
                    <button 
                      onClick={() => setStep(AppState.HISTORY)}
                      className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl"
                    >
                      <i className="fas fa-archive"></i> My Archive
                    </button>
                  )}
                </div>
                <h2 className="text-5xl md:text-8xl font-black text-slate-900 serif-text tracking-tighter leading-[1.05]">
                  Turn a Title into a <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-slate-400 italic">Complete Book.</span>
                </h2>
                <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto md:mx-0 serif-text leading-relaxed">
                  Architecting professional manuscripts from 50 to 500 pages with advanced AI narrative structures.
                </p>
              </div>

              <div className="bg-slate-50 p-10 md:p-14 rounded-[56px] shadow-sm border border-slate-100 space-y-8 text-left relative overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Manuscript Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Beyond the Event Horizon"
                      className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 font-semibold serif-text text-xl" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Author Name</label>
                    <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Sayed Mohsin Ali"
                      className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Genre</label>
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none appearance-none font-semibold">
                      <option>Business/Self-Help</option>
                      <option>Science Fiction</option>
                      <option>Mystery/Thriller</option>
                      <option>Biography</option>
                      <option>Educational</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Length (Pages)</label>
                    <div className="relative">
                      <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none font-semibold" />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">Pages</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <button onClick={startOutline} disabled={loading} className="flex-1 py-6 bg-slate-900 text-white rounded-[28px] font-black hover:bg-slate-800 transition-all shadow-2xl disabled:bg-slate-300 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3">
                    {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-layer-group"></i>}
                    {loading ? "Initializing..." : "Begin Manuscript Construction"}
                  </button>
                  {projects.length > 0 && (
                    <button onClick={() => setStep(AppState.HISTORY)} className="py-6 px-10 bg-white text-slate-900 border border-slate-200 rounded-[28px] font-black hover:bg-slate-50 transition-all uppercase text-xs tracking-[0.2em]">
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-5 hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <img 
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800" 
                  className="w-full aspect-[4/5] object-cover rounded-[64px] shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000 border-8 border-white relative z-10" 
                  alt="Elite Writing Tools" 
                />
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white p-6 rounded-[40px] shadow-2xl z-20 flex flex-col items-center justify-center text-center space-y-2 border border-slate-50">
                   <div className="text-3xl font-black text-indigo-600 serif-text">500</div>
                   <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Max Page Potential</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Developer Page - Redesigned to Professional Level */}
        {step === AppState.DEVELOPER && (
          <div className="w-full max-w-5xl py-12 animate-in zoom-in-95 duration-700">
            <div className="bg-slate-900 rounded-[64px] p-12 md:p-24 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-900/40 via-transparent to-transparent pointer-events-none"></div>
              <div className="flex flex-col md:flex-row gap-16 items-center md:items-start relative z-10">
                <div className="w-64 h-64 md:w-96 md:h-96 shrink-0 relative">
                  <div className="absolute -inset-4 bg-white/5 rounded-[56px] border border-white/10 blur-sm"></div>
                  <img src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" className="w-full h-full object-cover rounded-[48px] shadow-2xl relative z-10" alt="Sayed Mohsin Ali" />
                </div>
                <div className="space-y-10 text-center md:text-left">
                  <div className="space-y-4">
                    <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Lead Digital Architect</span>
                    <h2 className="text-5xl md:text-8xl font-black text-white serif-text tracking-tighter leading-none">Sayed <br className="hidden md:block"/>Mohsin Ali</h2>
                  </div>
                  <p className="text-xl md:text-2xl text-slate-400 font-medium serif-text italic leading-relaxed max-w-2xl">
                    "Bridging the gap between generative intelligence and high-end creative utility. AiPen is a testament to the future of digital literature."
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {['Generative AI', 'System Architecture', 'UI/UX Design', 'Manuscript Logic'].map(skill => (
                      <span key={skill} className="px-5 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{skill}</span>
                    ))}
                  </div>
                  <div className="pt-8 flex gap-8 justify-center md:justify-start items-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Connect:</span>
                    <a href="#" className="text-white text-2xl"><i className="fab fa-linkedin"></i></a>
                    <a href="#" className="text-white text-2xl"><i className="fab fa-github"></i></a>
                    <a href="#" className="text-white text-2xl"><i className="fas fa-globe"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History / Archive Dashboard */}
        {step === AppState.HISTORY && (
          <div className="w-full max-w-6xl py-12 animate-in slide-in-from-bottom-8 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="space-y-2">
                   <h2 className="text-5xl font-black text-slate-900 serif-text tracking-tight">Manuscript Archive</h2>
                   <p className="text-slate-400 text-lg serif-text italic">Refined collection of your literary assets.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(AppState.HOME)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl"
                  >
                    <i className="fas fa-plus mr-3"></i> New Manuscript
                  </button>
                </div>
             </div>

             {projects.length === 0 ? (
               <div className="text-center py-40 bg-slate-50 rounded-[64px] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-8">
                    <i className="fas fa-folder-open text-slate-200 text-3xl"></i>
                  </div>
                  <h3 className="text-3xl font-black text-slate-300 serif-text">No Archive Found</h3>
                  <p className="text-slate-400 text-sm mt-4 font-bold uppercase tracking-widest">Start your first project to populate this space.</p>
               </div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map(project => (
                    <div 
                      key={project.id} 
                      onClick={() => loadProject(project)}
                      className="group bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden flex flex-col"
                    >
                      <div className="space-y-8 flex-1">
                         <div className="flex justify-between items-start">
                           <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <i className="fas fa-book-open text-2xl"></i>
                           </div>
                           <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(project.createdAt).toLocaleDateString()}</div>
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-slate-900 serif-text line-clamp-2 leading-tight">{project.title}</h3>
                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-3">{project.genre}</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                            <div>
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Chapters</div>
                               <div className="text-sm font-black text-slate-800">{project.outline.length}</div>
                            </div>
                            <div>
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Author</div>
                               <div className="text-sm font-black text-slate-800 truncate">{project.author}</div>
                            </div>
                         </div>
                      </div>
                      <div className="mt-8 flex gap-2">
                        <button className="flex-1 py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all">
                          Open Studio
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* About Page - Redesigned to Elite Level */}
        {step === AppState.ABOUT && (
          <div className="w-full max-w-4xl py-12 animate-in fade-in duration-1000">
            <div className="space-y-16">
              <div className="text-center space-y-4">
                <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em]">Our Philosophy</span>
                <h2 className="text-6xl md:text-8xl font-black serif-text text-slate-900 tracking-tighter">AiPen Studio</h2>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <p className="serif-text text-2xl text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-8 py-4">
                  "AiPen is not just a generator; it is a digital architect. We believe that every great book starts with a robust structural integrity, which our AI provides through advanced semantic mapping."
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 pt-12">
                 <div className="space-y-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                       <i className="fas fa-microchip text-xl"></i>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 serif-text">Technological Core</h3>
                    <p className="text-slate-500 leading-relaxed serif-text text-lg">
                      Utilizing the Gemini 3 Flash series for lightning-fast semantic generation and reasoning, combined with specialized image diffusion models for cohesive visual storytelling.
                    </p>
                 </div>
                 <div className="space-y-6">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                       <i className="fas fa-fingerprint text-xl"></i>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 serif-text">Artistic Integrity</h3>
                    <p className="text-slate-500 leading-relaxed serif-text text-lg">
                      We prioritize narrative flow and structural coherence, ensuring that every 500-page manuscript maintains a consistent voice and professional quality from cover to cover.
                    </p>
                 </div>
              </div>

              <div className="bg-slate-50 p-12 rounded-[56px] flex flex-col items-center text-center space-y-6">
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ready to Begin?</div>
                 <h4 className="text-4xl font-black text-slate-900 serif-text">Your legacy starts with a title.</h4>
                 <button onClick={() => setStep(AppState.HOME)} className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform">
                    Start Studio
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewer Step */}
        {step === AppState.VIEWER && currentBook && (
          <div className="w-full animate-in fade-in duration-1000 flex flex-col items-center">
            <div className="hidden md:flex fixed left-12 top-1/2 -translate-y-1/2 flex-col gap-8 z-40 no-print">
               <button 
                disabled={activeChapterIndex === 0}
                onClick={() => setActiveChapterIndex(p => p - 1)}
                className="w-20 h-20 bg-white border border-slate-100 shadow-2xl rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all disabled:opacity-0"
               >
                 <i className="fas fa-arrow-left text-2xl"></i>
               </button>
               <button 
                disabled={activeChapterIndex === currentBook.outline.length - 1}
                onClick={() => setActiveChapterIndex(p => p + 1)}
                className="w-20 h-20 bg-slate-900 shadow-2xl rounded-full flex items-center justify-center text-white hover:scale-110 transition-all disabled:opacity-0"
               >
                 <i className="fas fa-arrow-right text-2xl"></i>
               </button>
            </div>
            
            <div className="w-full max-w-4xl space-y-10 mb-20">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm no-print">
                 <div className="flex gap-12 px-6">
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Word Count</div>
                       <div className="text-2xl font-black text-slate-900">{totalWords.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Architecture</div>
                       <div className="text-2xl font-black text-slate-900">{currentBook.outline.length} Ch.</div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-xl text-xs uppercase tracking-widest">
                      <i className="fas fa-print"></i> Export Manuscript
                    </button>
                 </div>
               </div>
               
               <div className="book-page p-12 md:p-32 relative overflow-hidden flex flex-col rounded-[64px] min-h-[95vh]">
                  <div className="flex-1 prose prose-slate max-w-none">
                    {activeChapterIndex === 0 && (
                      <div className="mb-32 text-center border-b border-slate-100 pb-24 space-y-10">
                         <div className="text-[10px] font-black tracking-[0.5em] uppercase text-indigo-500 mb-4">A Premium Publication</div>
                         <h1 className="text-6xl md:text-9xl font-black text-slate-900 leading-none serif-text tracking-tighter">{currentBook.title}</h1>
                         <div className="text-2xl md:text-4xl text-slate-400 italic serif-text font-medium">{currentBook.author}</div>
                      </div>
                    )}
                    <div className="flex justify-between items-end mb-16 border-b border-slate-50 pb-6 no-print">
                       <h2 className="text-3xl font-black text-indigo-600 serif-text tracking-tight uppercase">Chapter {activeChapterIndex + 1}</h2>
                       <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{(currentBook.outline[activeChapterIndex].wordCount || 0).toLocaleString()} Words Generated</div>
                    </div>
                    <div className="chapter-body text-xl md:text-2xl text-slate-700 leading-[1.85] serif-text">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) {
                          return <div key={i} dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} className="mb-10" />;
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

        {/* Progress Screens */}
        {(step === AppState.OUTLINING || step === AppState.WRITING) && (
          <div className="py-20 text-center animate-in fade-in duration-700 max-w-4xl w-full flex flex-col items-center">
             {step === AppState.WRITING ? (
               <div className="space-y-16">
                  <div className="relative">
                    <div className="w-40 h-40 border-[10px] border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <i className="fas fa-pen-nib text-slate-100 text-4xl"></i>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-5xl font-black serif-text text-slate-900">Crafting Your Narrative</h2>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">{progress.message}</p>
                    <div className="w-full max-w-md h-2 bg-slate-50 rounded-full mx-auto overflow-hidden">
                       <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}></div>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="space-y-16 w-full">
                  <div className="space-y-4">
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em]">Draft Verification</span>
                    <h2 className="text-5xl md:text-7xl font-black serif-text text-slate-900 tracking-tight">Manuscript Structure</h2>
                  </div>
                  <div className="grid gap-6 text-left w-full max-w-4xl mx-auto">
                     {currentBook?.outline.map((ch, idx) => (
                       <div key={idx} className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 flex gap-10 items-center hover:bg-white hover:shadow-xl transition-all">
                          <div className="text-5xl font-black text-slate-200 serif-text shrink-0">{String(idx + 1).padStart(2, '0')}</div>
                          <div className="flex-1 space-y-2">
                            <div className="font-black text-slate-900 text-xl serif-text">{ch.title}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ch.subsections.join(' • ')}</div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <button onClick={startWriting} className="w-full max-w-xl py-7 bg-slate-900 text-white rounded-[32px] font-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-transform uppercase text-xs tracking-[0.3em]">
                    Commence Full Manuscript Drafting
                  </button>
               </div>
             )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
