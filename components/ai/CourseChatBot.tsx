"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Maximize2, Minimize2, Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { useAuth } from "@/components/auth/AuthContext";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    modelUsed?: string;
}

// Modern iMessage-style bubble
function MessageBubble({ msg }: { msg: Message }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = msg.role === 'assistant' && msg.content.length > 400;
    const displayContent = isLong && !expanded
        ? msg.content.slice(0, 400) + '...'
        : msg.content;

    return (
        <div className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[85%] px-4 py-3",
                msg.role === 'user'
                    ? "bg-blue-500 text-white rounded-[20px] rounded-br-[4px]"
                    : "bg-zinc-800/80 text-zinc-100 rounded-[20px] rounded-bl-[4px] border border-zinc-700/50"
            )}>
                <div className="text-[15px] leading-[1.6] [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:mb-3 [&>ol]:mb-3 [&>li]:mb-1.5">
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                </div>
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={cn(
                            "text-sm mt-2 hover:underline font-medium",
                            msg.role === 'user' ? "text-blue-200" : "text-blue-400"
                        )}
                    >
                        {expanded ? 'Show less' : 'Show more'}
                    </button>
                )}
                {msg.modelUsed && (
                    <div className={cn(
                        "mt-2 text-[11px] flex items-center gap-1.5",
                        msg.role === 'user' ? "text-blue-200/70" : "text-zinc-500"
                    )}>
                        <Sparkles className="w-3 h-3" />
                        {msg.modelUsed.includes('flash') ? 'Flash' : 'Pro'}
                    </div>
                )}
            </div>
        </div>
    );
}

interface CourseChatBotProps {
    course: any;
    onToggleSidebar: (isOpen: boolean) => void;
}

export function CourseChatBot({ course, onToggleSidebar }: CourseChatBotProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarMode, setIsSidebarMode] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: `Hi! I'm your AI tutor for **${course.title}**. Ask me anything about the lessons!` }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepMode, setIsDeepMode] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    course: { ...course },
                    mode: isDeepMode ? 'deep' : 'auto'
                }),
            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                modelUsed: data.modelUsed
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSidebar = () => {
        const newState = !isSidebarMode;
        setIsSidebarMode(newState);
        onToggleSidebar(newState);
    };

    return (
        <>
            {/* FAB Trigger */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-105 group"
                    >
                        <MessageCircle className="w-6 h-6 text-white" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-zinc-700">
                            Ask AI Tutor
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={isSidebarMode
                            ? { x: "100%" }
                            : { opacity: 0, y: 20, scale: 0.95 }
                        }
                        animate={isSidebarMode
                            ? { x: 0, top: 0, right: 0, bottom: 0, height: "100vh", width: "420px", borderRadius: 0 }
                            : { opacity: 1, y: 0, scale: 1, width: "400px", height: "600px", bottom: "24px", right: "24px", borderRadius: "20px" }
                        }
                        exit={isSidebarMode
                            ? { x: "100%" }
                            : { opacity: 0, y: 20, scale: 0.95 }
                        }
                        transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "fixed z-50 bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black/50 flex flex-col overflow-hidden",
                            isSidebarMode ? "border-l border-zinc-800" : "rounded-[20px]"
                        )}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-[15px]">AI Tutor</h3>
                                    <p className="text-[12px] text-zinc-500">Powered by Gemini</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => setIsDeepMode(!isDeepMode)}
                                    className={cn(
                                        "p-2.5 rounded-full transition-all",
                                        isDeepMode
                                            ? "bg-purple-500/20 text-purple-400"
                                            : "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                                    )}
                                    title="Deep Explain Mode"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2.5 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-300 transition-all"
                                >
                                    {isSidebarMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); if (isSidebarMode) toggleSidebar(); }}
                                    className="p-2.5 hover:bg-red-500/20 rounded-full text-zinc-500 hover:text-red-400 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950">
                            {messages.map((msg, idx) => (
                                <MessageBubble key={idx} msg={msg} />
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-[20px] rounded-bl-[4px] px-4 py-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                            <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isDeepMode ? "Ask for detailed explanation..." : "Ask a question..."}
                                    className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="p-2 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-full text-white transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-2 flex items-center justify-center text-[11px] text-zinc-600">
                                <span>{isDeepMode ? "Pro Mode" : "Flash Mode"} · RAG Enabled</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
