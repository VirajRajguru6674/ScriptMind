import { useState, useRef, useEffect } from "react";
import { ArrowUp, User, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

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
            const response = await fetch('http://localhost:3001/api/chat', {
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
        <div className={`flex flex-col animate-fade-in overflow-hidden relative ${embedded ? 'h-full' : 'h-[700px] mt-6 bg-[#212121] rounded-2xl border border-white/5'}`}>
            
            <ScrollArea ref={scrollAreaRef} className="flex-1 relative z-10 w-full scroll-smooth">
                <div className="pb-40 pt-8 space-y-8"> {/* Increased spacing between messages for Claude feel */}
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className="w-full px-4 sm:px-8 flex justify-center"
                        >
                            {/* Claude Style: Both User and AI are left-aligned within the center column */}
                            <div className="w-full max-w-3xl flex gap-4 sm:gap-6">
                                
                                {/* Avatar */}
                                <div className="shrink-0 mt-0.5">
                                    {msg.role === 'user' ? (
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shadow-sm">
                                            <User className="w-4 h-4 text-slate-200" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-xl bg-[#D97757] flex items-center justify-center shadow-sm">
                                            {/* Claude's signature peach/orange color with a star/sparkle icon */}
                                            <Sparkles className="w-4 h-4 text-white fill-white/20" />
                                        </div>
                                    )}
                                </div>

                                {/* Content and Name */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="text-[13px] font-bold text-slate-200 mb-1.5 tracking-wide">
                                        {msg.role === 'user' ? 'You' : 'ScriptMind'}
                                    </div>
                                    <div className="text-[15px] sm:text-base text-slate-200 leading-[1.75] font-normal">
                                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none [&_strong]:text-white [&_strong]:font-semibold [&_p]:mb-5 last:[&_p]:mb-0 [&_code]:text-[#D97757] [&_code]:bg-[#D97757]/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[13px] [&_pre]:bg-[#1a1a1a] [&_pre]:border [&_pre]:border-white/10 [&_pre]:rounded-xl [&_li]:mb-2">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="w-full px-4 sm:px-8 flex justify-center">
                            <div className="max-w-3xl w-full flex gap-4 sm:gap-6">
                                <div className="shrink-0 mt-0.5">
                                    <div className="w-8 h-8 rounded-xl bg-[#D97757] flex items-center justify-center shadow-sm opacity-80">
                                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="text-[13px] font-bold text-slate-200 mb-1.5 tracking-wide">
                                        ScriptMind
                                    </div>
                                    <div className="pt-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* ChatGPT Style Floating Input Area */}
            <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none z-20 flex justify-center">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="w-full max-w-3xl pointer-events-auto"
                >
                    <div className="relative flex items-center bg-[#2f2f2f] rounded-[1.5rem] shadow-md border border-white/5 pr-2 pl-2 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message ScriptMind..."
                            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[15px] text-white h-14 pl-4 placeholder:text-slate-400 w-full"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className={`shrink-0 h-8 w-8 rounded-full transition-colors ml-2 ${
                                input.trim() && !isLoading 
                                    ? 'bg-white text-black hover:bg-slate-200' 
                                    : 'bg-white/10 text-white/50 hover:bg-white/10'
                            }`}
                        >
                            <ArrowUp className="h-4 w-4 stroke-[3]" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[11px] text-slate-500">ScriptMind can make mistakes. Check important info.</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
