"use client";

import { useState, useEffect, useCallback } from "react";
import { Quiz, QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";

interface QuizPlayerProps {
    quiz: Quiz;
    courseId: string;
    onComplete: (passed: boolean, score: number) => void;
    onBack?: () => void;
    passingScore?: number;
}

interface QuizState {
    currentIndex: number;
    answers: Record<string, number | null>; // questionId -> selected option index
    submitted: boolean;
    showResults: boolean;
    timeRemaining: number | null; // in seconds
}

export function QuizPlayer({ quiz, courseId, onComplete, onBack, passingScore = 75 }: QuizPlayerProps) {
    const [state, setState] = useState<QuizState>({
        currentIndex: 0,
        answers: {},
        submitted: false,
        showResults: false,
        timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null,
    });

    // Shuffle questions if enabled
    const [questions] = useState<QuizQuestion[]>(() => {
        if (quiz.shuffleQuestions) {
            return [...quiz.questions].sort(() => Math.random() - 0.5);
        }
        return quiz.questions;
    });

    const currentQuestion = questions[state.currentIndex];

    // Timer countdown
    useEffect(() => {
        if (state.timeRemaining === null || state.submitted) return;

        const interval = setInterval(() => {
            setState(prev => {
                if (prev.timeRemaining === null) return prev;
                if (prev.timeRemaining <= 1) {
                    // Time's up - auto submit
                    clearInterval(interval);
                    return { ...prev, timeRemaining: 0, submitted: true, showResults: true };
                }
                return { ...prev, timeRemaining: prev.timeRemaining - 1 };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [state.timeRemaining, state.submitted]);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Select answer
    const selectAnswer = (optionIndex: number) => {
        if (state.submitted) return;
        setState(prev => ({
            ...prev,
            answers: { ...prev.answers, [currentQuestion.id]: optionIndex }
        }));
    };

    // Navigate questions
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setState(prev => ({ ...prev, currentIndex: index }));
        }
    };

    // Calculate score
    const calculateScore = useCallback(() => {
        let correct = 0;
        questions.forEach(q => {
            if (state.answers[q.id] === q.correctIndex) {
                correct++;
            }
        });
        return Math.round((correct / questions.length) * 100);
    }, [questions, state.answers]);

    // Submit quiz
    const handleSubmit = () => {
        const score = calculateScore();
        const passed = score >= passingScore;
        setState(prev => ({ ...prev, submitted: true, showResults: true }));
        onComplete(passed, score);
    };

    // Retry quiz
    const handleRetry = () => {
        setState({
            currentIndex: 0,
            answers: {},
            submitted: false,
            showResults: false,
            timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null,
        });
    };

    // Get answered count
    const answeredCount = Object.keys(state.answers).filter(k => state.answers[k] !== null).length;
    const score = state.submitted ? calculateScore() : 0;
    const passed = score >= passingScore;

    // Results view
    if (state.showResults) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
                <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center mb-6",
                    passed ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                    {passed ? (
                        <Check size={64} className="text-green-500" />
                    ) : (
                        <X size={64} className="text-red-500" />
                    )}
                </div>

                <h2 className={cn(
                    "text-3xl font-bold mb-2",
                    passed ? "text-green-500" : "text-red-500"
                )}>
                    {passed ? "Lulus!" : "Belum Lulus"}
                </h2>

                <p className="text-5xl font-bold text-white mb-4">{score}%</p>

                <p className="text-zinc-400 mb-8">
                    {passed
                        ? `Selamat! Anda berhasil melewati quiz dengan nilai di atas ${passingScore}%.`
                        : `Nilai minimum kelulusan adalah ${passingScore}%. Silakan coba lagi.`
                    }
                </p>

                <div className="flex gap-4">
                    {!passed && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            <RotateCcw size={18} />
                            Coba Lagi
                        </button>
                    )}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
                        >
                            Lanjutkan
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[500px] flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
            {/* Left: Question Navigation */}
            <div className="lg:w-64 flex-shrink-0">
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">
                        Soal kategori: {quiz.category || quiz.title}
                    </h3>

                    {/* Question Grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, index) => {
                            const isAnswered = state.answers[q.id] !== undefined;
                            const isCurrent = index === state.currentIndex;

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

                    {/* Progress */}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex justify-between text-sm text-zinc-400 mb-2">
                            <span>Dijawab</span>
                            <span>{answeredCount} / {questions.length}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal-500 transition-all"
                                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Timer */}
                    {state.timeRemaining !== null && (
                        <div className={cn(
                            "mt-4 flex items-center justify-center gap-2 p-3 rounded-lg",
                            state.timeRemaining < 60 ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-300"
                        )}>
                            <Clock size={18} />
                            <span className="font-mono text-lg">{formatTime(state.timeRemaining)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Question Content */}
            <div className="flex-1 flex flex-col">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex-1 flex flex-col">
                    {/* Question Header */}
                    <div className="p-4 border-b border-zinc-800">
                        <span className="text-sm text-zinc-500">
                            Pertanyaan {state.currentIndex + 1} dari {questions.length}
                        </span>
                    </div>

                    {/* Question Text */}
                    <div className="p-6 flex-1">
                        <p className="text-lg text-white mb-6">
                            {currentQuestion?.text || "Question text"}
                        </p>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion?.options.map((option, index) => {
                                const isSelected = state.answers[currentQuestion.id] === index;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => selectAnswer(index)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                                            isSelected
                                                ? "border-teal-500 bg-teal-500/10 text-white"
                                                : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            isSelected
                                                ? "border-teal-500 bg-teal-500"
                                                : "border-zinc-600"
                                        )}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                        <button
                            onClick={() => goToQuestion(state.currentIndex - 1)}
                            disabled={state.currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                            Sebelumnya
                        </button>

                        {state.currentIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={answeredCount < questions.length}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                Selesai
                            </button>
                        ) : (
                            <button
                                onClick={() => goToQuestion(state.currentIndex + 1)}
                                className="flex items-center gap-2 px-4 py-2 text-teal-400 hover:text-teal-300 transition-colors"
                            >
                                Selanjutnya
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuizPlayer;
