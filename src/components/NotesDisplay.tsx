import {
  Copy, Download, Loader2, Printer, ChevronLeft, ChevronRight,
  MessageSquare, FileText, Sparkles, List, Key,
  BrainCircuit, ArrowLeft, CheckCircle2, XCircle, Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { ChatInterface } from "./ChatInterface";
import { Flashcard } from "./Flashcard";
import { Mermaid } from "./Mermaid";
import { GenerationLoader } from "./GenerationLoader";
import API_BASE_URL from "@/lib/api";
import { cn } from "@/lib/utils";

interface NotesDisplayProps {
  notes: string;
  isLoading: boolean;
  videoTitle?: string;
}

export type NotesDisplayHandle = {
  triggerTool: (type: ToolType) => void;
  triggerQuickPrompt: (prompt: string) => void;
  copyNotes: () => void;
  downloadNotes: () => void;
  printNotes: () => void;
};

type ToolType = 'flashcards' | 'quiz' | 'summary' | 'key_terms' | 'eli5' | 'mind_map' | null;

export const NotesDisplay = forwardRef<NotesDisplayHandle, NotesDisplayProps>(function NotesDisplay({ notes, isLoading, videoTitle }, ref) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'notes' | 'chat' | 'tools'>('notes');
  const [pages, setPages] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Tool State
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [toolContent, setToolContent] = useState<any>(null);
  const [isLoadingTool, setIsLoadingTool] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (notes) {
      const paragraphs = notes.split(/\n\n+/);
      const newPages: string[] = [];
      let currentChunk = "";
      const CHARS_PER_PAGE = 2000;

      for (const p of paragraphs) {
        if ((currentChunk.length + p.length) > CHARS_PER_PAGE) {
          if (currentChunk) newPages.push(currentChunk);
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + p;
        }
      }
      if (currentChunk) newPages.push(currentChunk);
      setPages(newPages.length > 0 ? newPages : [notes]);
      setCurrentPage(1);
    } else {
      setPages([]);
    }
  }, [notes]);

  const totalPages = pages.length;
  const currentContent = pages[currentPage - 1] || "";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(notes);
    toast({ title: "Copied!", description: "Full notes copied to clipboard" });
  };

  const downloadAsTxt = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle || "notes"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Notes saved as text file" });
  };

  const printNotes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${videoTitle || 'Notes'}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
              h1, h2, h3 { color: #1a1a1a; }
              p { line-height: 1.6; color: #333; }
              pre { background: #f4f4f4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${videoTitle || 'Notes'}</h1>
            <pre>${notes}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const generateToolContent = async (type: ToolType) => {
    if (!type) return;
    setActiveTool(type);
    setIsLoadingTool(true);
    setToolContent(null);
    setQuizAnswers({});
    setShowQuizResults(false);
    setCurrentQuizIndex(0);
    setCurrentCardIndex(0);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/tools`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          toolType: type,
          notes: notes,
          videoTitle: videoTitle || ''
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');
      const data = await response.json();
      if (data.result) {
        setToolContent(data.result);
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error("Tool generation failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate content. Please try again.",
      });
      setActiveTool(null);
    } finally {
      setIsLoadingTool(false);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerTool: (type: ToolType) => {
      if (type) {
        setActiveTab('tools');
        generateToolContent(type);
      }
    },
    triggerQuickPrompt: (prompt: string) => {
      setActiveTab('chat');
      setPendingChatPrompt(prompt);
    },
    copyNotes: copyToClipboard,
    downloadNotes: downloadAsTxt,
    printNotes: printNotes,
  }), [notes, videoTitle]);

  const renderToolView = () => {
    if (isLoadingTool) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating content with AI...</p>
        </div>
      );
    }

    if (!toolContent) return null;

    switch (activeTool) {
      case 'summary':
      case 'eli5':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none p-6 animate-fade-in">
            <ReactMarkdown>{toolContent}</ReactMarkdown>
          </div>
        );

      case 'key_terms':
        return (
          <div className="grid gap-4 p-6 animate-fade-in">
            {Array.isArray(toolContent) && toolContent.map((item: any, idx: number) => (
              <div key={idx} className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                <h4 className="font-bold text-primary mb-1">{item.term}</h4>
                <p className="text-sm text-muted-foreground">{item.definition}</p>
              </div>
            ))}
          </div>
        );

      case 'flashcards':
        if (!Array.isArray(toolContent) || toolContent.length === 0) return null;
        const currentCard = toolContent[currentCardIndex];
        return (
          <div className="p-6 space-y-6 animate-fade-in flex flex-col items-center">
            <div className="w-full max-w-md">
              <Flashcard
                key={currentCardIndex}
                id={currentCardIndex}
                front={currentCard.front}
                back={currentCard.back}
              />
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between w-full max-w-md border-t border-border/40 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentCardIndex(p => Math.max(0, p - 1))}
                disabled={currentCardIndex === 0}
                className="font-semibold text-xs rounded-xl"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <span className="text-xs font-bold text-muted-foreground/60">
                Card {currentCardIndex + 1} of {toolContent.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentCardIndex(p => Math.min(toolContent.length - 1, p + 1))}
                disabled={currentCardIndex === toolContent.length - 1}
                className="font-semibold text-xs rounded-xl"
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'quiz':
        if (!Array.isArray(toolContent) || toolContent.length === 0) return null;

        const correctCount = toolContent.filter((q: any, idx: number) => quizAnswers[idx] === q.correctIndex).length;
        const totalCount = toolContent.length;
        const scorePercentage = Math.round((correctCount / totalCount) * 100) || 0;
        const isCurrentQuestionAnswered = quizAnswers[currentQuizIndex] !== undefined;

        if (showQuizResults) {
          return (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="bg-secondary/20 border border-border/50 rounded-xl p-6 text-center animate-in zoom-in-95 duration-300">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">Your Result</p>
                <div className="text-5xl font-black text-foreground tabular-nums tracking-tight mb-2">{scorePercentage}%</div>
                <p className="text-lg font-medium text-foreground mb-1">You scored {correctCount} out of {totalCount}</p>
                <p className="text-sm text-muted-foreground">
                  {scorePercentage === 100 ? 'Perfect! You mastered this topic. 🏆' :
                    scorePercentage >= 70 ? 'Great job! 👏' : 'Keep reviewing the notes! 💪'}
                </p>
              </div>

              {/* Review Section */}
              <div className="space-y-6">
                <h3 className="font-bold text-lg text-foreground border-b border-border/40 pb-2">Review Questions</h3>
                {toolContent.map((q: any, idx: number) => {
                  const isCorrect = quizAnswers[idx] === q.correctIndex;
                  return (
                    <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} space-y-2`}>
                      <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                        <span>{idx + 1}. {q.question}</span>
                        {isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Your Answer: <strong className={isCorrect ? 'text-green-500' : 'text-red-500'}>{q.options[quizAnswers[idx]]}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-xs text-muted-foreground">
                          Correct Answer: <strong className="text-green-500">{q.options[q.correctIndex]}</strong>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button className="w-full" variant="secondary" onClick={() => { setQuizAnswers({}); setShowQuizResults(false); setCurrentQuizIndex(0); }}>
                Take Quiz Again
              </Button>
            </div>
          );
        }

        const q = toolContent[currentQuizIndex];

        return (
          <div className="p-6 space-y-6 animate-fade-in">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <span>Question {currentQuizIndex + 1} of {totalCount}</span>
                <span>{Math.round(((currentQuizIndex) / totalCount) * 100)}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentQuizIndex) / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-xl text-foreground leading-snug">{currentQuizIndex + 1}. {q.question}</h3>
              
              <div className="space-y-2">
                {q.options.map((option: string, optIdx: number) => {
                  const isSelected = quizAnswers[currentQuizIndex] === optIdx;
                  let btnClass = "w-full justify-start text-left h-auto py-3 px-4 border-border/50 hover:bg-secondary/10";
                  if (isSelected) {
                    btnClass = "w-full justify-start text-left h-auto py-3 px-4 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20";
                  }

                  return (
                    <Button
                      key={optIdx}
                      variant="outline"
                      className={btnClass}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [currentQuizIndex]: optIdx }))}
                    >
                      <span className="mr-2 opacity-50">{String.fromCharCode(65 + optIdx)}.</span>
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-border/40 pt-4 gap-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentQuizIndex(p => Math.max(0, p - 1))}
                disabled={currentQuizIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              {currentQuizIndex < totalCount - 1 ? (
                <Button
                  onClick={() => setCurrentQuizIndex(p => Math.min(totalCount - 1, p + 1))}
                  disabled={!isCurrentQuestionAnswered}
                >
                  Next Question <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowQuizResults(true)}
                  disabled={!isCurrentQuestionAnswered}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Submit & View Score
                </Button>
              )}
            </div>
          </div>
        );

      case 'mind_map':
        return (
          <div className="p-6 animate-fade-in">
            <Mermaid chart={toolContent} />
          </div>
        );

      default:
        return <div>Unknown tool content</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full bg-card animate-fade-in shadow-inner">
        <GenerationLoader />
      </div>
    );
  }

  if (!notes) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card text-card-foreground">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border/40 px-4 sm:px-6 py-3 bg-card/80 backdrop-blur-md sticky top-0 z-10 gap-3">
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5",
              activeTab === 'notes'
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
            )}
          >
            <FileText className="h-3.5 w-3.5" /> Notes
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5",
              activeTab === 'chat'
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" /> AI Chat
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={cn(
              "text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5",
              activeTab === 'tools'
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Tools
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {activeTab === 'notes' && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={downloadAsTxt} className="h-8 w-8"><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={printNotes} className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'notes' ? (
        <div className="flex-1 overflow-y-auto p-8" ref={contentRef}>
          <article className="markdown-content prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <ReactMarkdown>{currentContent}</ReactMarkdown>
          </article>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
              <Button variant="ghost" onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); contentRef.current?.scrollTo(0, 0); }} disabled={currentPage === 1}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
              <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
              <Button variant="ghost" onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); contentRef.current?.scrollTo(0, 0); }} disabled={currentPage === totalPages}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          )}
        </div>
      ) : activeTab === 'chat' ? (
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            notes={notes}
            videoTitle={videoTitle}
            embedded={true}
            promptToSend={pendingChatPrompt}
            onPromptSent={() => setPendingChatPrompt(null)}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-8">
          {activeTool ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setActiveTool(null)} className="h-8 w-8 rounded-xl shrink-0 hover:bg-white/10">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-base font-bold capitalize text-foreground">{activeTool.replace('_', ' ')}</h2>
                </div>
                {renderToolView()}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-6">Choose a Study Tool</p>
              {[
                { type: 'flashcards', icon: <FileText className="w-4 h-4" />, title: 'Flashcards', desc: '10 interactive cards for active recall & retention.', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
                { type: 'quiz', icon: <Sparkles className="w-4 h-4" />, title: 'Quiz Me', desc: '10 multiple-choice questions to test your knowledge.', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
                { type: 'summary', icon: <List className="w-4 h-4" />, title: 'Summary', desc: 'Concise bullet-point breakdown of key insights.', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                { type: 'key_terms', icon: <Key className="w-4 h-4" />, title: 'Key Terms', desc: '10 essential definitions and concepts explained.', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
                { type: 'eli5', icon: <BrainCircuit className="w-4 h-4" />, title: 'Explain Simply', desc: 'Complex ideas explained in plain, simple language.', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },
                { type: 'mind_map', icon: <Network className="w-4 h-4" />, title: 'Mind Map', desc: 'Visual diagram connecting all core concepts.', color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' }
              ].map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => generateToolContent(tool.type as ToolType)}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 text-left"
                >
                  <div className={`shrink-0 w-10 h-10 rounded-xl ${tool.bg} border flex items-center justify-center ${tool.color} transition-transform group-hover:scale-110`}>
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${tool.color} mb-0.5`}>{tool.title}</div>
                    <div className="text-xs text-slate-500 leading-snug">{tool.desc}</div>
                  </div>
                  <ChevronRight className="shrink-0 w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
