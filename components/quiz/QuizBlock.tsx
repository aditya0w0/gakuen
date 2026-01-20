"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Quiz } from "@/lib/types";
import { HelpCircle, Clock, Target, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizAttempt {
    date: string;
    score: number;
    passed: boolean;
}

interface QuizBlockProps {
    quizId: string;
    courseId: string;
    quiz: Quiz | null;
    passingScore?: number;
    timeLimit?: number;
}

export function QuizBlock({ quizId, courseId, quiz, passingScore = 75, timeLimit = 5 }: QuizBlockProps) {
    const router = useRouter();
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

    // Load attempts from localStorage
    useEffect(() => {
        const key = `quiz_attempts_${courseId}_${quizId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                setAttempts(JSON.parse(stored));
            } catch {
                // Invalid JSON, ignore
            }
        }
    }, [courseId, quizId]);

    // Navigate to dedicated quiz page (outside dashboard layout)
    const handleStart = () => {
        router.push(`/quiz/${courseId}/${quizId}`);
    };

    // If no quiz data, show placeholder
    if (!quiz) {
        return (
            <div className="my-6 p-8 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                <HelpCircle size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-500">Quiz tidak ditemukan</p>
            </div>
        );
    }

    // Info page (Dicoding style)
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
    const hasPassed = attempts.some(a => a.passed);

    return (
        <div className="my-6 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-teal-500/20 rounded-xl">
                        <HelpCircle size={24} className="text-teal-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">Quiz</p>
                        <h3 className="text-xl font-bold text-white">{quiz.title}</h3>
                    </div>
                </div>

                {/* Rules Section */}
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-zinc-300 mb-3">Aturan</h4>
                    <p className="text-sm text-zinc-400 mb-4">
                        Kuis ini bertujuan untuk menguji pengetahuan Anda tentang materi yang telah dipelajari.
                    </p>
                    <ul className="space-y-2 text-sm text-zinc-400">
                        <li className="flex items-center gap-2">
                            <Target size={16} className="text-teal-400" />
                            Syarat nilai kelulusan: {passingScore}%
                        </li>
                        <li className="flex items-center gap-2">
                            <Clock size={16} className="text-teal-400" />
                            Durasi ujian: {timeLimit || quiz.timeLimit || 5} menit
                        </li>
                        <li className="flex items-center gap-2">
                            <HelpCircle size={16} className="text-teal-400" />
                            Jumlah soal: {quiz.questions.length} pertanyaan
                        </li>
                    </ul>
                </div>

                {/* Best Score Badge */}
                {bestScore !== null && (
                    <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                        hasPassed ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-400"
                    )}>
                        {hasPassed ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        Nilai terbaik: {bestScore}%
                    </div>
                )}
            </div>

            {/* Start Button */}
            <div className="p-6 flex justify-end">
                <button
                    onClick={handleStart}
                    className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors"
                >
                    Mulai
                </button>
            </div>

            {/* Attempt History */}
            {attempts.length > 0 && (
                <div className="px-6 pb-6">
                    <h4 className="font-medium text-zinc-400 mb-3">Riwayat</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                                    <th className="pb-2 pr-4">Tanggal</th>
                                    <th className="pb-2 pr-4">Persentase</th>
                                    <th className="pb-2 pr-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.slice(0, 5).map((attempt, index) => (
                                    <tr key={index} className="border-b border-zinc-800/50">
                                        <td className="py-3 pr-4 text-zinc-300">
                                            {new Date(attempt.date).toLocaleString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-3 pr-4 text-zinc-300">{attempt.score}%</td>
                                        <td className="py-3 pr-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium",
                                                attempt.passed
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-red-500/20 text-red-400"
                                            )}>
                                                {attempt.passed ? "Lulus" : "Tidak Lulus"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuizBlock;
