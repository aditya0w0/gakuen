"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Quiz } from "@/lib/types";
import { useCourse } from "@/lib/hooks/useCourse";
import { ArrowLeft, Loader2, Clock, ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentQuizPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;
    const quizId = params?.quizId as string;

    const { course, isLoading } = useCourse(courseId);
    const [quiz, setQuiz] = useState<Quiz | null>(null);

    // Quiz state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number | null>>({});
    const [submitted, setSubmitted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [questions, setQuestions] = useState<Quiz['questions']>([]);

    const passingScore = 75;

    // Find quiz in course
    useEffect(() => {
        if (course?.quizzes) {
            const found = course.quizzes.find(q => q.id === quizId);
            if (found) {
                setQuiz(found);
                // Shuffle questions if needed
                const qs = found.shuffleQuestions
                    ? [...found.questions].sort(() => Math.random() - 0.5)
                    : found.questions;
                setQuestions(qs);
                setTimeRemaining(found.timeLimit ? found.timeLimit * 60 : null);
            }
        }
    }, [course, quizId]);

    // Timer
    useEffect(() => {
        if (timeRemaining === null || submitted) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining, submitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentIndex];

    const selectAnswer = (optionIndex: number) => {
        if (submitted || !currentQuestion) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    };

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        }
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctIndex) correct++;
        });
        return Math.round((correct / questions.length) * 100);
    };

    const handleSubmit = () => {
        const score = calculateScore();
        const passed = score >= passingScore;
        setSubmitted(true);
        setShowResults(true);

        // Save attempt
        const key = `quiz_attempts_${courseId}_${quizId}`;
        const stored = localStorage.getItem(key);
        let attempts = [];
        try { attempts = stored ? JSON.parse(stored) : []; } catch { attempts = []; }
        const newAttempts = [{ date: new Date().toISOString(), score, passed }, ...attempts].slice(0, 10);
        localStorage.setItem(key, JSON.stringify(newAttempts));
    };

    const handleRetry = () => {
        setCurrentIndex(0);
        setAnswers({});
        setSubmitted(false);
        setShowResults(false);
        setTimeRemaining(quiz?.timeLimit ? quiz.timeLimit * 60 : null);
    };

    const handleBack = () => router.back();

    const answeredCount = Object.keys(answers).filter(k => answers[k] !== null).length;
    const score = submitted ? calculateScore() : 0;
    const passed = score >= passingScore;

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-teal-500" size={32} />
            </div>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white">
                <p className="text-zinc-500 mb-4">Quiz tidak ditemukan</p>
                <button onClick={handleBack} className="flex items-center gap-2 text-teal-400 hover:text-teal-300">
                    <ArrowLeft size={18} /> Kembali
                </button>
            </div>
        );
    }

    // Results Screen
    if (showResults) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-8">
                <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center mb-6",
                    passed ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                    {passed ? <Check size={64} className="text-green-500" /> : <X size={64} className="text-red-500" />}
                </div>

                <h2 className={cn("text-3xl font-bold mb-2", passed ? "text-green-500" : "text-red-500")}>
                    {passed ? "Lulus!" : "Belum Lulus"}
                </h2>

                <p className="text-5xl font-bold text-white mb-4">{score}%</p>

                <p className="text-zinc-400 mb-8 text-center max-w-md">
                    {passed
                        ? `Selamat! Anda berhasil melewati quiz dengan nilai di atas ${passingScore}%.`
                        : `Nilai minimum kelulusan adalah ${passingScore}%. Silakan coba lagi.`
                    }
                </p>

                <div className="flex gap-4">
                    {!passed && (
                        <button onClick={handleRetry} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                            <RotateCcw size={18} /> Coba Lagi
                        </button>
                    )}
                    <button onClick={handleBack} className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
                        Kembali ke Materi
                    </button>
                </div>
            </div>
        );
    }

    // Quiz Playing Screen - Full viewport
    return (
        <div className="fixed inset-0 bg-zinc-950 flex flex-col">
            {/* Header */}
            <header className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-zinc-400" />
                    </button>
                    <div>
                        <p className="text-xs text-zinc-500">Quiz</p>
                        <h1 className="text-lg font-semibold text-white">{quiz.title}</h1>
                    </div>
                </div>

                {timeRemaining !== null && (
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        timeRemaining < 60 ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-300"
                    )}>
                        <Clock size={18} />
                        <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                    </div>
                )}
            </header>

            {/* Main Content - fills remaining space */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Question Grid */}
                <aside className="w-72 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto hidden lg:block">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">
                        Soal kategori: {quiz.category || quiz.title}
                    </h3>

                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {questions.map((q, index) => {
                            const isAnswered = answers[q.id] !== undefined;
                            const isCurrent = index === currentIndex;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => goToQuestion(index)}
                                    className={cn(
                                        "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                                        isCurrent
                                            ? "bg-teal-600 text-white ring-2 ring-teal-400"
                                            : isAnswered
                                                ? "bg-zinc-700 text-white"
                                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                        <div className="flex justify-between text-sm text-zinc-400 mb-2">
                            <span>Dijawab</span>
                            <span>{answeredCount} / {questions.length}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                        </div>
                    </div>
                </aside>

                {/* Question Area - takes remaining width */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Question Header */}
                    <div className="flex-shrink-0 p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <span className="text-sm text-zinc-500">
                            Pertanyaan {currentIndex + 1} dari {questions.length}
                        </span>
                    </div>

                    {/* Question Content - scrollable */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-2xl mx-auto">
                            <p className="text-xl text-white mb-8">
                                {currentQuestion?.text || "Question text"}
                            </p>

                            <div className="space-y-3">
                                {currentQuestion?.options.map((option, index) => {
                                    const isSelected = answers[currentQuestion.id] === index;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => selectAnswer(index)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                                                isSelected
                                                    ? "border-teal-500 bg-teal-500/10 text-white"
                                                    : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                                isSelected ? "border-teal-500 bg-teal-500" : "border-zinc-600"
                                            )}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                            </div>
                                            <span className="text-lg">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
                        <button
                            onClick={() => goToQuestion(currentIndex - 1)}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} /> Sebelumnya
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={answeredCount < questions.length}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                Selesai
                            </button>
                        ) : (
                            <button
                                onClick={() => goToQuestion(currentIndex + 1)}
                                className="flex items-center gap-2 px-4 py-2 text-teal-400 hover:text-teal-300 transition-colors"
                            >
                                Selanjutnya <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
