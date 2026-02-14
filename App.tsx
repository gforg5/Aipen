
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Book, Chapter, GenerationProgress, BookHistoryEvent } from './types';
import { geminiService } from './services/geminiService';
import { marked } from 'marked';

const PROJECTS_STORAGE_KEY = 'aipen_projects_v2';

const Header: React.FC<{ 
  setStep: (s: AppState) => void; 
  hasProjects: boolean; 
  currentStep: AppState;
  activeProject: boolean;
}> = ({ setStep, hasProjects, currentStep, activeProject }) => (
  <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 px-4 md:px-8 flex justify-between items-center no-print">
    <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => setStep(AppState.HOME)}>
      <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
        <i className="fas fa-pen-nib text-sm md:text-base"></i>
      </div>
      <h1 className="text-base md:text-lg font-black tracking-tighter text-slate-800 serif-text">AiPen</h1>
    </div>
    <div className="flex items-center gap-4 md:gap-6">
      <nav className="hidden md:flex items-center gap-2">
        <button 
          onClick={() => setStep(AppState.HOME)} 
          className={`px-5 py-2.5 rounded-full transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] bg-blue-600 text-white hover:bg-blue-700 shadow-md ${currentStep === AppState.HOME ? 'ring-4 ring-blue-300/50' : ''}`}
        >
          New Project
        </button>
        <button 
          onClick={() => setStep(AppState.DEVELOPER)} 
          className={`px-5 py-2.5 rounded-full transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] ${currentStep === AppState.DEVELOPER ? 'bg-blue-50 text-blue-600' : 'text-slate-500 bg-transparent'} hover:bg-blue-600 hover:text-white hover:shadow-md`}
        >
          Developer
        </button>
        {hasProjects && (
          <button 
            onClick={() => setStep(AppState.HISTORY)} 
            className={`px-5 py-2.5 rounded-full transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] ${currentStep === AppState.HISTORY ? 'bg-blue-50 text-blue-600' : 'text-slate-500 bg-transparent'} hover:bg-blue-600 hover:text-white hover:shadow-md`}
          >
            History
          </button>
        )}
        <button 
          onClick={() => setStep(AppState.ABOUT)} 
          className={`px-5 py-2.5 rounded-full transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] ${currentStep === AppState.ABOUT ? 'bg-blue-50 text-blue-600' : 'text-slate-500 bg-transparent'} hover:bg-blue-600 hover:text-white hover:shadow-md`}
        >
          About
        </button>
      </nav>
      {activeProject && currentStep !== AppState.VIEWER && (
        <button 
          onClick={() => setStep(AppState.VIEWER)} 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md font-black text-[9px] md:text-[10px] uppercase tracking-wider ml-2"
        >
          Resume Studio
        </button>
      )}
    </div>
  </header>
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
      <div className="my-10 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] text-center no-print">
          <i className="fas fa-sparkles text-blue-500 text-3xl mb-3"></i>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Illustration Concept</div>
          <p className="text-sm text-slate-600 italic font-medium max-w-lg mx-auto mb-6">"{desc}"</p>
          
          <button 
              onClick={generate}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
          >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Generating Image...</> : <><i className="fas fa-image"></i> Generate AI Image</>}
          </button>
          {error && <div className="text-red-500 text-xs mt-3 font-bold"><i className="fas fa-triangle-exclamation mr-1"></i> {error}</div>}
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

  // Sync projects to localStorage
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
      setError("Please enter a book title.");
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
        history: [{ timestamp: new Date().toLocaleTimeString(), event: 'Manuscript synchronized.', version: 1 }]
      };
      
      setCurrentBook(newBook);
      setProjects(prev => [newBook, ...prev]);
      setStep(AppState.OUTLINING);
    } catch (err: any) {
      setError("Connection timed out. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setStep(AppState.WRITING);
    setLoading(true);
    
    const updatedOutline = [...currentBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Warming up AiPen drafting engine...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({
          currentChapter: i + 1,
          totalChapters: updatedOutline.length,
          message: `Writing Chapter ${i + 1}: ${updatedOutline[i].title}...`
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
      updateHistory(`Full construction complete.`);
      setStep(AppState.VIEWER);
    } catch (err: any) {
      setError("AI Generation failed. Check network stability.");
    } finally {
      setLoading(false);
    }
  };

  const loadProject = (project: Book) => {
    setCurrentBook(project);
    setStep(AppState.VIEWER);
    setActiveChapterIndex(0);
  };

  const deleteProject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this project?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentBook?.id === id) setCurrentBook(null);
    }
  };

  const renameProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const newName = window.prompt("Enter new title for the book:", project.title);
    if (newName && newName !== project.title) {
      const updated = { ...project, title: newName };
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (currentBook?.id === id) setCurrentBook(updated);
    }
  };

  const handleReplaceVisual = (desc: string, base64: string, chapterIndex: number) => {
    if (!currentBook) return;
    const updatedOutline = [...currentBook.outline];
    const chapter = { ...updatedOutline[chapterIndex] };
    
    const regex = new RegExp(`\\[VISUAL:\\s*${desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`);
    const imageHtml = `\n\n<div class="my-12 text-center break-inside-avoid"><img src="${base64}" alt="${desc}" class="rounded-[32px] shadow-2xl mx-auto w-full max-w-3xl border border-slate-100" /></div>\n\n`;
    
    chapter.content = (chapter.content || '').replace(regex, imageHtml);
    updatedOutline[chapterIndex] = chapter;
    
    const updatedBook = { 
      ...currentBook, 
      outline: updatedOutline,
      history: [
        ...currentBook.history, 
        { 
          timestamp: new Date().toLocaleTimeString(), 
          event: `Inserted AI illustration into Chapter ${chapterIndex + 1}.`, 
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

  const downloadPDF = () => { window.print(); };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <Header 
        setStep={setStep} 
        hasProjects={projects.length > 0} 
        currentStep={step} 
        activeProject={!!currentBook}
      />
      
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:p-12 max-w-7xl mx-auto w-full relative">
        
        {error && (
          <div className="w-full max-w-2xl mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between no-print shadow-sm">
            <span className="text-xs font-bold"><i className="fas fa-circle-exclamation mr-2"></i>{error}</span>
            <button onClick={() => setError(null)}><i className="fas fa-xmark"></i></button>
          </div>
        )}

        {/* Home Screen */}
        {step === AppState.HOME && (
          <div className="w-full grid md:grid-cols-2 gap-12 md:gap-16 items-stretch mt-2 md:mt-8 animate-in fade-in duration-700">
            <div className="space-y-8 md:space-y-10 text-center md:text-left order-2 md:order-1 flex flex-col">
              <div className="relative">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black rounded-full uppercase tracking-[0.2em]">Professional Suite</span>
                  {projects.length > 0 && (
                    <button 
                      onClick={() => setStep(AppState.HISTORY)}
                      className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <i className="fas fa-history text-[8px]"></i> History
                    </button>
                  )}
                </div>
                
                {/* RECENT MANUSCRIPTS PREVIEW */}
                {projects.length > 0 && (
                  <div className="mt-2 mb-6 flex flex-col items-center md:items-start gap-3 animate-in slide-in-from-left-2 duration-700">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Manuscripts</div>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {projects.slice(0, 3).map(p => (
                        <button 
                          key={p.id}
                          onClick={() => loadProject(p)}
                          className="bg-white border border-slate-100 px-3 py-2 rounded-xl text-[9px] font-bold text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm flex items-center gap-2 max-w-[140px]"
                        >
                          <i className="fas fa-book-bookmark text-blue-400"></i>
                          <span className="truncate">{p.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-4xl md:text-7xl font-black leading-tight text-slate-900 serif-text tracking-tight">
                  Write Your Book <br className="hidden md:block"/><span className="text-blue-600 italic">with AiPen.</span>
                </h2>
                <p className="mt-6 text-sm md:text-lg text-slate-500 leading-relaxed max-w-md mx-auto md:mx-0">
                  Professional manuscripts from 50 to 500 pages. We handle the outline, content, and covers. You handle the vision.
                </p>
              </div>

              <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl border border-slate-100 space-y-6 text-left relative z-20 mt-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Manuscript Title</label>
                  <div className="relative">
                    <i className="fas fa-book-open absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Silence of Stars"
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Author Name</label>
                  <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Published by SMA"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Genre</label>
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none appearance-none">
                      <option>Business/Self-Help</option>
                      <option>Science Fiction</option>
                      <option>Mystery/Thriller</option>
                      <option>Biography</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Target Pages</label>
                    <input type="number" min="50" max="500" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none" />
                  </div>
                </div>
                <button onClick={startOutline} disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5 transition-all shadow-xl disabled:bg-slate-300 uppercase text-xs tracking-widest">
                  {loading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-rocket mr-2"></i>}
                  {loading ? "Warming Up..." : "Launch Writing Studio"}
                </button>
              </div>
            </div>
            
            <div className="order-1 md:order-2 relative flex justify-center md:justify-end items-end w-full h-full pb-2 md:pb-6">
              <div className="absolute bottom-10 right-0 w-full max-w-[400px] h-[500px] bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <img 
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" 
                className="w-full max-w-[280px] md:max-w-[340px] aspect-[9/16] object-cover rounded-[40px] shadow-2xl rotate-3 relative z-10 hover:rotate-0 transition-transform duration-700 border-8 border-white ml-auto mr-auto md:mr-0" 
                alt="Creative Writing Studio" 
              />
            </div>
          </div>
        )}

        {/* History / Library Dashboard */}
        {step === AppState.HISTORY && (
          <div className="w-full max-w-5xl py-4 md:py-12 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-end mb-12">
                <div>
                   <h2 className="text-4xl font-black serif-text">Project Library</h2>
                   <p className="text-slate-400 text-sm mt-1 font-medium italic">Manage your professional AI manuscripts.</p>
                </div>
                <button 
                  onClick={() => setStep(AppState.HOME)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                >
                  <i className="fas fa-plus mr-2"></i> Start New
                </button>
             </div>

             {projects.length === 0 ? (
               <div className="text-center py-32 bg-white rounded-[60px] border-2 border-dashed border-slate-100">
                  <i className="fas fa-folder-open text-slate-200 text-6xl mb-6"></i>
                  <h3 className="text-2xl font-black text-slate-300 serif-text">Your Library is Empty</h3>
                  <p className="text-slate-400 text-sm mt-2">Create your first book to populate your history.</p>
               </div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <div 
                      key={project.id} 
                      onClick={() => loadProject(project)}
                      className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col"
                    >
                      {/* Actions Overlays */}
                      <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={(e) => { e.stopPropagation(); renameProject(project.id, e); }}
                          className="w-9 h-9 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white shadow-sm"
                          title="Rename Book"
                         >
                           <i className="fas fa-edit text-[10px]"></i>
                         </button>
                         <button 
                          onClick={(e) => deleteProject(project.id, e)}
                          className="w-9 h-9 bg-red-50 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white shadow-sm"
                          title="Delete Manuscript"
                         >
                           <i className="fas fa-trash-can text-[10px]"></i>
                         </button>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-book text-lg"></i>
                         </div>
                         <div>
                            <h3 className="text-xl font-black text-slate-900 serif-text line-clamp-1">{project.title}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{project.genre} • {project.author}</p>
                         </div>
                         
                         <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <div className="text-left">
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Chapters</div>
                               <div className="text-sm font-black text-slate-800">{project.outline.length}</div>
                            </div>
                            <div className="text-right">
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Created</div>
                               <div className="text-sm font-black text-slate-800">{new Date(project.createdAt).toLocaleDateString()}</div>
                            </div>
                         </div>
                      </div>
                      
                      <button className="w-full mt-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        Open In Studio
                      </button>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* Developer Page */}
        {step === AppState.DEVELOPER && (
          <div className="w-full max-w-5xl py-4 md:py-12 animate-in zoom-in-95 duration-500">
            <div className="bg-slate-900 text-white rounded-[40px] md:rounded-[60px] p-8 md:p-20 relative overflow-hidden shadow-2xl flex flex-col md:flex-row gap-10 md:gap-16 items-center md:items-start">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
              <div className="w-48 h-48 md:w-80 md:h-80 flex-shrink-0 relative">
                <img src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" className="w-full h-full object-cover rounded-[40px] relative z-10 shadow-2xl" alt="Sayed Mohsin Ali" />
              </div>
              <div className="relative z-10 space-y-6 flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-6xl font-black serif-text tracking-tight">Sayed Mohsin Ali</h2>
                <p className="text-sm md:text-xl text-slate-400 font-light leading-relaxed serif-text">Engineering elite digital architectures for creative technology.</p>
              </div>
            </div>
          </div>
        )}

        {/* Viewer Step */}
        {step === AppState.VIEWER && currentBook && (
          <div className="w-full animate-in fade-in duration-1000 flex flex-col items-center">
            
            <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-6 z-40 no-print">
               <button 
                disabled={activeChapterIndex === 0}
                onClick={() => setActiveChapterIndex(p => p - 1)}
                className="w-16 h-16 bg-white border border-slate-100 shadow-2xl rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-110 transition-all disabled:opacity-0"
               >
                 <i className="fas fa-chevron-left text-xl"></i>
               </button>
               <button 
                disabled={activeChapterIndex === currentBook.outline.length - 1}
                onClick={() => setActiveChapterIndex(p => p + 1)}
                className="w-16 h-16 bg-blue-600 shadow-2xl rounded-full flex items-center justify-center text-white hover:scale-110 transition-all disabled:opacity-0"
               >
                 <i className="fas fa-chevron-right text-xl"></i>
               </button>
            </div>

            <div className="w-full max-w-4xl space-y-8 mb-16">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm no-print">
                 <div className="flex gap-10 px-4">
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Words</div>
                       <div className="text-xl font-black text-slate-900">{totalWords.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Chapters</div>
                       <div className="text-xl font-black text-slate-900">{currentBook.outline.length}</div>
                    </div>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={downloadPDF} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors shadow-lg text-xs uppercase">
                      <i className="fas fa-file-pdf text-blue-400"></i> Save PDF
                    </button>
                 </div>
               </div>

               <div className="book-page p-8 md:p-24 relative overflow-hidden flex flex-col rounded-[40px] min-h-[90vh]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
                  <div className="flex-1 prose prose-slate max-w-none serif-text">
                    {activeChapterIndex === 0 && (
                      <div className="mb-24 text-center border-b-2 border-slate-100 pb-20 space-y-8">
                         <div className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-600 mb-2">Original Manuscript</div>
                         <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-none">{currentBook.title}</h1>
                         <div className="text-xl md:text-3xl text-slate-400 italic font-serif">By Author: {currentBook.author}</div>
                      </div>
                    )}

                    <div className="chapter-header mb-12 flex justify-between items-center no-print border-b border-slate-100 pb-4">
                       <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">Chapter {activeChapterIndex + 1}</h2>
                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{(currentBook.outline[activeChapterIndex].wordCount || 0).toLocaleString()} Words</span>
                    </div>

                    <div className="chapter-body text-lg md:text-xl text-slate-700 leading-[1.8]">
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
          </div>
        )}

        {/* Progress Screens */}
        {(step === AppState.OUTLINING || step === AppState.WRITING) && (
          <div className="py-12 md:py-20 text-center animate-in fade-in duration-500 max-w-4xl w-full flex flex-col items-center">
             {step === AppState.WRITING ? (
               <div className="space-y-12">
                  <div className="w-32 h-32 border-8 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto shadow-2xl"></div>
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black serif-text">Constructing Masterpiece...</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">{progress.message}</p>
                  </div>
               </div>
             ) : (
               <div className="space-y-10 w-full px-4">
                  <h2 className="text-3xl md:text-5xl font-black serif-text">Manuscript Architecture</h2>
                  <div className="grid gap-4 text-left w-full max-w-3xl mx-auto">
                     {currentBook?.outline.map((ch, idx) => (
                       <div key={idx} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm flex gap-6 items-center">
                          <div className="text-3xl md:text-4xl font-black text-slate-100">{idx + 1}</div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900 text-sm md:text-base">{ch.title}</div>
                            <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-bold tracking-widest">{ch.subsections.join(' • ')}</div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <button onClick={startWriting} className="w-full max-w-md py-5 bg-blue-600 text-white rounded-[24px] font-black shadow-2xl hover:-translate-y-1 transition-transform uppercase text-xs tracking-widest">
                    Confirm & Build Manuscript
                  </button>
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
