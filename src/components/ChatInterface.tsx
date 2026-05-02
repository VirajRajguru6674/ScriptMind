import { useState, useRef, useEffect } from "react";
import { ArrowUp, User, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import API_BASE_URL from "@/lib/api";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    notes: string;
    videoTitle?: string;
    embedded?: boolean;
    promptToSend?: string | null;
    onPromptSent?: () => void;
}

export function ChatInterface({ notes, videoTitle, embedded = false, promptToSend, onPromptSent }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hi! I've analyzed the video notes for **"${videoTitle || 'this video'}"**. I can help clarify any points or answer questions about the content. What would you like to know?`
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const sendPrompt = async (promptText: string) => {
        if (!promptText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: promptText
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
                    context: notes,
                    videoTitle
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I encountered an error while processing your request. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (promptToSend && promptToSend.trim()) {
            sendPrompt(promptToSend);
            onPromptSent?.();
        }
    }, [promptToSend]);

    const handleSend = async () => {
        await sendPrompt(input);
    };

    return (
        <div className={`flex flex-col animate-fade-in overflow-hidden relative ${embedded ? 'h-full' : 'h-[700px] mt-6 bg-card rounded-2xl border border-border/50'}`}>
            
            <ScrollArea ref={scrollAreaRef} className="flex-1 relative z-10 w-full">
                <div className="pb-32 pt-6 space-y-6">
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className={`w-full px-4 sm:px-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] sm:max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                
                                {/* Avatar */}
                                <div className="shrink-0 mt-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                </div>
                                
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`text-[10px] font-black uppercase tracking-[0.1em] mb-1.5 px-1 ${msg.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {msg.role === 'user' ? 'You' : 'Assistant'}
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm border transition-colors ${
                                        msg.role === 'user' 
                                            ? 'bg-primary/10 text-foreground border-primary/20 rounded-tr-none font-medium' 
                                            : 'bg-secondary/40 text-foreground border-border/50 rounded-tl-none'
                                    }`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/5 dark:prose-pre:bg-white/5 prose-pre:border-none">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="w-full px-4 sm:px-6 flex justify-start">
                             <div className="flex gap-3 flex-row">
                                <div className="shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center animate-pulse">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start pt-1">
                                    <div className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider px-1">Assistant</div>
                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-secondary/30 rounded-2xl">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Simple Pinned Input Area */}
            <div className="shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-md p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="relative flex items-center bg-secondary/30 rounded-xl border border-border/50 focus-within:border-primary/50 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about this video..."
                            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm text-foreground h-12 px-4 placeholder:text-muted-foreground"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="h-9 w-9 rounded-lg mr-1.5 transition-all"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-center mt-2 text-[10px] text-muted-foreground">
                        ScriptMind AI may provide inaccurate info.
                    </p>
                </form>
            </div>
        </div>
    );
}
