
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setStep(AppState.HOME)}>
      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
        <i className="fas fa-feather-pointed text-lg"></i>
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl font-black tracking-tight text-slate-900 serif-text leading-none">AiPen</h1>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600">Pro Studio</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <nav className="hidden md:flex items-center gap-2">
        <button 
          onClick={() => setStep(AppState.HOME)} 
          className={`px-5 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest ${currentStep === AppState.HOME ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
        >
          Studio
        </button>
        {hasProjects && (
          <button 
            onClick={() => setStep(AppState.HISTORY)} 
            className={`px-5 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest ${currentStep === AppState.HISTORY ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Library
          </button>
        )}
        <button 
          onClick={() => setStep(AppState.DEVELOPER)} 
          className={`px-5 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest ${currentStep === AppState.DEVELOPER ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
        >
          Architect
        </button>
      </nav>
      {activeProject && currentStep !== AppState.VIEWER && (
        <button 
          onClick={() => setStep(AppState.VIEWER)} 
          className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-black text-[10px] uppercase tracking-wider"
        >
          Open Manuscript
        </button>
      )}
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="w-full bg-slate-950 text-white py-20 px-6 md:px-12 mt-auto no-print">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
      <div className="flex flex-col items-center md:items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">
            <i className="fas fa-feather"></i>
          </div>
          <span className="font-black text-2xl tracking-tighter serif-text">AiPen</span>
        </div>
        <p className="text-slate-500 text-sm font-medium max-w-xs text-center md:text-left leading-relaxed">
          The ultimate digital studio for long-form AI manuscript generation. Engineered by Sayed Mohsin Ali.
        </p>
      </div>
      
      <div className="flex gap-10 text-slate-500 text-xl">
        <a href="#" className="hover:text-white transition-colors"><i className="fab fa-github"></i></a>
        <a href="#" className="hover:text-white transition-colors"><i className="fab fa-linkedin"></i></a>
        <a href="#" className="hover:text-white transition-colors"><i className="fas fa-envelope"></i></a>
      </div>

      <div className="text-center md:text-right">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2">Developed By</div>
        <div className="text-2xl font-bold serif-text">Sayed Mohsin Ali</div>
        <div className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mt-1">SMA Elite Digital Architecture © 2025</div>
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
          setError("Generation failed.");
          setLoading(false);
      }
  }

  return (
      <div className="my-16 p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] text-center no-print group hover:border-blue-400 transition-colors">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mx-auto mb-6 group-hover:scale-110 transition-transform">
            <i className="fas fa-wand-magic-sparkles text-2xl"></i>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Insight Recommendation</div>
          <p className="text-lg text-slate-700 italic font-serif max-w-xl mx-auto mb-8">"{desc}"</p>
          
          <button 
              onClick={generate}
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 inline-flex items-center gap-3"
          >
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Rendering...</> : <><i className="fas fa-image"></i> Visualize Concept</>}
          </button>
          {error && <div className="text-red-500 text-xs mt-4 font-bold"><i className="fas fa-exclamation-triangle mr-2"></i> {error}</div>}
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
  const [genre, setGenre] = useState('Non-Fiction/Philosophy');
  const [length, setLength] = useState(150);
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

  const updateHistory = (book: Book, event: string) => {
    const newEvent: BookHistoryEvent = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      version: book.history.length + 1
    };
    
    const updatedBook = { 
      ...book, 
      history: [...book.history, newEvent] 
    };
    
    setCurrentBook(updatedBook);
    setProjects(prev => prev.map(p => p.id === updatedBook.id ? updatedBook : p));
    return updatedBook;
  };

  const startOutline = async () => {
    if (!title) {
      setError("Please define your masterpiece with a title.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const outline = await geminiService.generateOutline(title, genre, length);
      const wordCountGoal = length * 300; // Roughly 300 words per page
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        author: author || 'Anonymous Scholar',
        genre,
        targetLength: length,
        wordCountGoal,
        outline,
        covers: [],
        createdAt: new Date().toLocaleString(),
        history: [{ timestamp: new Date().toLocaleTimeString(), event: 'Initial architecture conceived.', version: 1 }]
      };
      
      setCurrentBook(newBook);
      setProjects(prev => [newBook, ...prev]);
      setStep(AppState.OUTLINE_EDITOR);
    } catch (err: any) {
      setError("Studio connection interrupted. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveOutlineChanges = () => {
    if (!currentBook) return;
    updateHistory(currentBook, "Outline refined and confirmed.");
    setStep(AppState.WRITING);
    startWriting();
  };

  const startWriting = async () => {
    if (!currentBook) return;
    setLoading(true);
    
    let workingBook = { ...currentBook };
    const updatedOutline = [...workingBook.outline];
    setProgress({ currentChapter: 0, totalChapters: updatedOutline.length, message: 'Calibrating literary engine...' });

    try {
      for (let i = 0; i < updatedOutline.length; i++) {
        setProgress({
          currentChapter: i + 1,
          totalChapters: updatedOutline.length,
          message: `Drafting Chapter ${i + 1}: ${updatedOutline[i].title}...`
        });
        
        updatedOutline[i].status = 'writing';
        const content = await geminiService.generateChapterContent(workingBook.title, workingBook.genre, updatedOutline[i], workingBook.targetLength);
        updatedOutline[i].content = content;
        updatedOutline[i].status = 'completed';
        updatedOutline[i].wordCount = content.split(/\s+/).length;
        
        workingBook = { ...workingBook, outline: [...updatedOutline] };
        setCurrentBook(workingBook);
        setProjects(prev => prev.map(p => p.id === workingBook.id ? workingBook : p));
      }
      
      setProgress({ ...progress, message: 'Designing bespoke cover concepts...' });
      const covers = await geminiService.generateCovers(workingBook.title, workingBook.genre);
      workingBook = { ...workingBook, covers, selectedCoverIndex: 0 };
      
      const finalBook = updateHistory(workingBook, "Full manuscript completion.");
      setCurrentBook(finalBook);
      setStep(AppState.VIEWER);
    } catch (err: any) {
      setError("AI engine encountered a creative block. Please check your connection.");
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
    const imageHtml = `\n\n<div class="my-16 text-center break-inside-avoid"><img src="${base64}" alt="${desc}" class="rounded-[48px] shadow-3xl mx-auto w-full max-w-4xl border border-white" /><p class="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest italic no-print">AI Visual Interpretation</p></div>\n\n`;
    
    chapter.content = (chapter.content || '').replace(regex, imageHtml);
    updatedOutline[chapterIndex] = chapter;
    
    const updatedBook = { 
      ...currentBook, 
      outline: updatedOutline,
    };
    
    updateHistory(updatedBook, `Injected visual data into Chapter ${chapterIndex + 1}.`);
  };

  const totalWords = useMemo(() => {
    return currentBook?.outline.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0;
  }, [currentBook]);

  const exportMarkdown = () => {
    if (!currentBook) return;
    const content = currentBook.outline.map(ch => `# ${ch.title}\n\n${ch.content}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBook.title.replace(/\s+/g, '_')}_manuscript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteProject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm("Permanent deletion cannot be undone. Proceed?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentBook?.id === id) setCurrentBook(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Header 
        setStep={setStep} 
        hasProjects={projects.length > 0} 
        currentStep={step} 
        activeProject={!!currentBook}
      />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        
        {error && (
          <div className="w-full max-w-3xl mb-12 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-3xl flex items-center justify-between shadow-sm no-print animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-circle-exclamation text-lg"></i>
              <span className="text-sm font-bold tracking-tight">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:rotate-90 transition-transform"><i className="fas fa-xmark"></i></button>
          </div>
        )}

        {/* Home / Creation Suite */}
        {step === AppState.HOME && (
          <div className="w-full grid lg:grid-cols-12 gap-16 items-start animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <i className="fas fa-sparkles"></i> Elite Manuscript Architect
                </div>
                <h2 className="text-6xl md:text-8xl font-black serif-text leading-[0.9] tracking-tighter">
                  Craft Your <br/> <span className="text-blue-600 italic">Legacy</span> Today.
                </h2>
                <p className="text-xl text-slate-500 font-medium serif-text max-w-xl leading-relaxed">
                  The most powerful AI studio for serious authors. Generate structured, deep, and visually rich books from 50 to 500 pages with one prompt.
                </p>
              </div>

              <div className="bg-white p-10 md:p-14 rounded-[60px] shadow-2xl border border-slate-50 space-y-8 relative overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Title of Masterpiece</label>
                    <input 
                      type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                      placeholder="The Echoes of Eternity"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold serif-text text-xl" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Author Name</label>
                    <input 
                      type="text" value={author} onChange={(e) => setAuthor(e.target.value)} 
                      placeholder="Sayed Mohsin Ali"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold serif-text text-xl" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Genre & Style</label>
                    <select 
                      value={genre} onChange={(e) => setGenre(e.target.value)} 
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold serif-text text-lg appearance-none cursor-pointer"
                    >
                      <option>Philosophy / Non-Fiction</option>
                      <option>Science Fiction / Epic</option>
                      <option>Business / Strategy</option>
                      <option>Mystery / Noir</option>
                      <option>Biography / History</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Scale: {length} Pages</label>
                      <span className="text-[10px] font-bold text-blue-600">~{length * 300} words</span>
                    </div>
                    <input 
                      type="range" min="50" max="500" step="10" value={length} onChange={(e) => setLength(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                    />
                  </div>
                </div>

                <button 
                  onClick={startOutline} disabled={loading}
                  className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 hover:shadow-2xl hover:scale-[1.02] transition-all disabled:bg-slate-200"
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-bolt mr-3"></i>}
                  {loading ? "Synthesizing Architecture..." : "Initialize Studio Engine"}
                </button>
              </div>

              {projects.length > 0 && (
                <div className="pt-12 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Recent Archives</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {projects.slice(0, 3).map(p => (
                      <div 
                        key={p.id} onClick={() => loadProject(p)}
                        className="p-6 bg-white border border-slate-100 rounded-3xl cursor-pointer hover:border-blue-400 hover:shadow-xl transition-all group"
                      >
                        <i className="fas fa-book-bookmark text-slate-200 group-hover:text-blue-500 mb-4 block transition-colors"></i>
                        <h4 className="font-bold serif-text line-clamp-1 group-hover:text-blue-900">{p.title}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">{p.genre}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 hidden lg:flex flex-col gap-8 sticky top-32">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-500/10 rounded-[60px] blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <img 
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800" 
                  className="w-full aspect-[4/5] object-cover rounded-[50px] shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-1000 border-8 border-white"
                  alt="Writing inspiration"
                />
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl shrink-0">
                  <i className="fas fa-medal"></i>
                </div>
                <div>
                  <h4 className="font-bold serif-text">Elite Standards</h4>
                  <p className="text-sm text-slate-400 mt-1">Our engine utilizes thinking-budget processing for superior logical flow and depth.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Outline Editor Step */}
        {step === AppState.OUTLINE_EDITOR && currentBook && (
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom-8 duration-700 space-y-12">
            <div className="text-center space-y-4">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Phase II: Directive Refinement</div>
              <h2 className="text-5xl font-black serif-text">Review Your Outline</h2>
              <p className="text-slate-500 serif-text text-xl">Confirm the logical flow of your {currentBook.targetLength}-page manuscript.</p>
            </div>

            <div className="space-y-4">
              {currentBook.outline.map((ch, idx) => (
                <div key={ch.id} className="group bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-8 items-start">
                  <div className="text-4xl font-black text-slate-100 group-hover:text-blue-50 transition-colors shrink-0">{idx + 1}</div>
                  <div className="flex-1 space-y-3">
                    <input 
                      className="w-full text-xl font-black serif-text bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900"
                      value={ch.title}
                      onChange={(e) => {
                        const newOutline = [...currentBook.outline];
                        newOutline[idx].title = e.target.value;
                        setCurrentBook({...currentBook, outline: newOutline});
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {ch.subsections.map((sub, sIdx) => (
                        <span key={sIdx} className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newOutline = currentBook.outline.filter((_, i) => i !== idx);
                      setCurrentBook({...currentBook, outline: newOutline});
                    }}
                    className="text-slate-200 hover:text-red-500 transition-colors pt-2"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button 
                onClick={saveOutlineChanges}
                className="bg-slate-900 text-white px-12 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-blue-600 shadow-2xl transition-all hover:scale-105"
              >
                Proceed to Manuscript Construction
              </button>
            </div>
          </div>
        )}

        {/* Writing Progress Step */}
        {step === AppState.WRITING && (
          <div className="w-full max-w-4xl py-20 text-center space-y-16 animate-in zoom-in-95 duration-1000">
            <div className="relative inline-block">
              <div className="w-48 h-48 border-[12px] border-slate-50 border-t-blue-600 rounded-full animate-spin shadow-2xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-feather-pointed text-4xl text-slate-200"></i>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-black serif-text">Writing Masterpiece...</h2>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 animate-pulse">
                  {progress.message}
                </div>
              </div>

              <div className="max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${(progress.currentChapter / progress.totalChapters) * 100}%` }}
                ></div>
              </div>

              <div className="text-slate-400 font-bold serif-text">
                Chapter {progress.currentChapter} of {progress.totalChapters}
              </div>
            </div>
          </div>
        )}

        {/* Manuscript Viewer Step */}
        {step === AppState.VIEWER && currentBook && (
          <div className="w-full animate-in fade-in duration-1000 flex flex-col items-center">
            {/* Sidebar Navigation */}
            <div className="hidden xl:flex fixed left-12 top-1/2 -translate-y-1/2 flex-col gap-4 z-40 no-print">
               <div className="bg-white p-3 rounded-full shadow-2xl border border-slate-100 flex flex-col gap-2">
                 <button 
                  disabled={activeChapterIndex === 0}
                  onClick={() => setActiveChapterIndex(p => p - 1)}
                  className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all disabled:opacity-0"
                 >
                   <i className="fas fa-chevron-up"></i>
                 </button>
                 <button 
                  disabled={activeChapterIndex === currentBook.outline.length - 1}
                  onClick={() => setActiveChapterIndex(p => p + 1)}
                  className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all disabled:opacity-0"
                 >
                   <i className="fas fa-chevron-down"></i>
                 </button>
               </div>
               <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-14 h-14 bg-blue-600 text-white shadow-2xl rounded-full flex items-center justify-center hover:scale-110 transition-all"
               >
                 <i className="fas fa-arrow-up"></i>
               </button>
            </div>

            <div className="w-full max-w-4xl space-y-8 mb-24">
               {/* Manuscript Stats Bar */}
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-slate-100 shadow-xl no-print">
                 <div className="flex gap-12">
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Words Written</div>
                       <div className="text-2xl font-black text-slate-900">{totalWords.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Scale Goal</div>
                       <div className="text-2xl font-black text-slate-900">{currentBook.targetLength} Pgs</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Chapters</div>
                       <div className="text-2xl font-black text-slate-900">{currentBook.outline.length}</div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={exportMarkdown}
                      className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <i className="fab fa-markdown"></i> Markdown
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
                    >
                      <i className="fas fa-file-pdf"></i> Export PDF
                    </button>
                 </div>
               </div>

               {/* The Manuscript */}
               <div className="book-page p-12 md:p-24 relative overflow-hidden flex flex-col rounded-[60px] min-h-[90vh] border border-slate-100">
                  {/* Watermark/Texture Overlay */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                  
                  <div className="relative z-10 flex-1 prose prose-slate max-w-none serif-text">
                    {activeChapterIndex === 0 && (
                      <div className="mb-32 text-center border-b border-slate-100 pb-24 space-y-12">
                         {currentBook.covers.length > 0 && (
                           <div className="mb-20 animate-in zoom-in-95 duration-1000">
                             <img 
                              src={currentBook.covers[currentBook.selectedCoverIndex || 0]} 
                              className="w-full max-w-sm mx-auto rounded-[32px] shadow-3xl border-8 border-white"
                              alt="Book Cover"
                             />
                             <div className="mt-6 flex justify-center gap-3 no-print">
                               {currentBook.covers.map((c, ci) => (
                                 <button 
                                  key={ci} onClick={() => setCurrentBook({...currentBook, selectedCoverIndex: ci})}
                                  className={`w-3 h-3 rounded-full transition-all ${currentBook.selectedCoverIndex === ci ? 'bg-blue-600 w-8' : 'bg-slate-200'}`}
                                 />
                               ))}
                             </div>
                           </div>
                         )}
                         <div className="text-[12px] font-black tracking-[0.6em] uppercase text-blue-600 mb-4">Original Manuscript</div>
                         <h1 className="text-6xl md:text-9xl font-black text-slate-950 leading-none tracking-tighter">{currentBook.title}</h1>
                         <div className="text-2xl md:text-4xl text-slate-400 italic font-serif">A work by {currentBook.author}</div>
                      </div>
                    )}

                    <div className="chapter-header mb-16 flex justify-between items-end no-print border-b border-slate-50 pb-6">
                       <div>
                         <h2 className="text-3xl font-black text-slate-900 tracking-tighter m-0">Chapter {activeChapterIndex + 1}</h2>
                         <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">{currentBook.outline[activeChapterIndex].title}</p>
                       </div>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{(currentBook.outline[activeChapterIndex].wordCount || 0).toLocaleString()} Tokens</span>
                    </div>

                    <div className="chapter-body text-xl md:text-2xl text-slate-800 leading-[1.8] space-y-8">
                      {(currentBook.outline[activeChapterIndex].content || '').split(/\[VISUAL:\s*(.*?)\s*\]/g).map((part, i) => {
                        if (i % 2 === 0) {
                          return <div key={i} className="drop-cap-container" dangerouslySetInnerHTML={{ __html: marked.parse(part) as string }} />;
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

                  {/* Page Numbering */}
                  <div className="mt-32 pt-12 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest no-print">
                    <div>{currentBook.title}</div>
                    <div>Page {activeChapterIndex + 1}</div>
                    <div>{currentBook.author}</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* History / Library Step */}
        {step === AppState.HISTORY && (
          <div className="w-full max-w-6xl py-12 animate-in slide-in-from-bottom-8 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="space-y-2">
                   <h2 className="text-5xl font-black serif-text">Manuscript Library</h2>
                   <p className="text-slate-400 text-lg serif-text italic">Your creative lineage, archived in high fidelity.</p>
                </div>
                <button 
                  onClick={() => setStep(AppState.HOME)}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                >
                  <i className="fas fa-plus mr-3"></i> Create New
                </button>
             </div>

             {projects.length === 0 ? (
               <div className="text-center py-40 bg-white rounded-[60px] border border-slate-100 shadow-sm">
                  <i className="fas fa-folder-open text-slate-100 text-7xl mb-8"></i>
                  <h3 className="text-3xl font-black text-slate-300 serif-text">Archive is Empty</h3>
                  <p className="text-slate-400 font-medium serif-text text-xl">Initialize your first studio session to begin your collection.</p>
               </div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map(project => (
                    <div 
                      key={project.id} 
                      onClick={() => loadProject(project)}
                      className="group bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                    >
                      <div className="absolute top-6 right-6 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={(e) => deleteProject(project.id, e)}
                          className="w-10 h-10 bg-red-50 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white shadow-sm transition-colors"
                         >
                           <i className="fas fa-trash-alt text-xs"></i>
                         </button>
                      </div>
                      
                      <div className="flex-1 space-y-6">
                         <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                            <i className="fas fa-scroll"></i>
                         </div>
                         <div>
                            <h3 className="text-2xl font-black text-slate-950 serif-text line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{project.title}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-3">{project.genre} • {project.author}</p>
                         </div>
                         <div className="pt-6 border-t border-slate-50 flex justify-between">
                            <div>
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Chapters</div>
                               <div className="text-lg font-black text-slate-900">{project.outline.length}</div>
                            </div>
                            <div className="text-right">
                               <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Scale</div>
                               <div className="text-lg font-black text-slate-900">{project.targetLength} Pgs</div>
                            </div>
                         </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-300">{new Date(project.createdAt).toLocaleDateString()}</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:translate-x-2 transition-transform">Launch Studio <i className="fas fa-chevron-right ml-1"></i></span>
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* Developer Page */}
        {step === AppState.DEVELOPER && (
          <div className="w-full max-w-5xl py-12 animate-in zoom-in-95 duration-700">
            <div className="bg-slate-900 text-white rounded-[60px] p-12 md:p-24 relative overflow-hidden shadow-3xl flex flex-col md:flex-row gap-12 md:gap-20 items-center">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
              <div className="w-64 h-64 md:w-96 md:h-96 shrink-0 relative">
                <div className="absolute -inset-4 bg-blue-600/20 blur-3xl rounded-full"></div>
                <img src="https://github.com/gforg5/Nano-Lens/blob/main/1769069098374.png?raw=true" className="w-full h-full object-cover rounded-[48px] relative z-10 border-4 border-slate-800 shadow-2xl" alt="Sayed Mohsin Ali" />
              </div>
              <div className="relative z-10 space-y-8 flex-1 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="text-5xl md:text-8xl font-black serif-text tracking-tighter">Sayed Mohsin Ali</h2>
                  <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Elite Digital Architect</div>
                </div>
                <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed serif-text italic">"Engineering the bridge between human imagination and synthetic intelligence."</p>
                <div className="flex justify-center md:justify-start gap-6">
                   <a href="#" className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors"><i className="fab fa-github"></i></a>
                   <a href="#" className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors"><i className="fab fa-linkedin"></i></a>
                   <a href="#" className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors"><i className="fas fa-envelope"></i></a>
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
