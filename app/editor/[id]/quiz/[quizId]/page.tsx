"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical, Check, ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react";
import type { Course, Quiz, QuizQuestion } from "@/lib/types";
import { authenticatedFetch } from "@/lib/api/authenticated-fetch";

// Generate unique ID
function generateId(): string {
    return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function QuizEditorPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;
    const quizId = params?.quizId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load course and quiz
    useEffect(() => {
        const loadCourse = async () => {
            try {
                const response = await authenticatedFetch(`/api/courses/${courseId}`);
                if (response.ok) {
                    const courseData = await response.json();
                    setCourse(courseData);

                    // Find or create quiz
                    const existingQuiz = courseData.quizzes?.find((q: Quiz) => q.id === quizId);
                    if (existingQuiz) {
                        setQuiz(existingQuiz);
                    } else {
                        // Create new quiz
                        const newQuiz: Quiz = {
                            id: quizId,
                            title: 'Untitled Quiz',
                            questions: [],
                            shuffleQuestions: false,
                        };
                        setQuiz(newQuiz);
                        setHasChanges(true);
                    }
                }
            } catch (error) {
                console.error('Failed to load course:', error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId && quizId) {
            loadCourse();
        }
    }, [courseId, quizId]);

    // Save quiz to course
    const saveQuiz = useCallback(async () => {
        if (!course || !quiz) return;

        setIsSaving(true);
        try {
            // Update quizzes array
            const existingQuizzes = course.quizzes || [];
            const quizIndex = existingQuizzes.findIndex(q => q.id === quiz.id);

            let updatedQuizzes: Quiz[];
            if (quizIndex >= 0) {
                updatedQuizzes = [...existingQuizzes];
                updatedQuizzes[quizIndex] = quiz;
            } else {
                updatedQuizzes = [...existingQuizzes, quiz];
            }

            const updatedCourse = { ...course, quizzes: updatedQuizzes };

            const response = await authenticatedFetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCourse),
            });

            if (response.ok) {
                setCourse(updatedCourse);
                setHasChanges(false);
                console.log('✅ Quiz saved');
            }
        } catch (error) {
            console.error('Failed to save quiz:', error);
        } finally {
            setIsSaving(false);
        }
    }, [course, quiz, courseId]);

    // Auto-save on changes
    useEffect(() => {
        if (hasChanges && quiz) {
            const timeout = setTimeout(() => {
                saveQuiz();
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [hasChanges, quiz, saveQuiz]);

    // Update quiz
    const updateQuiz = (updates: Partial<Quiz>) => {
        if (!quiz) return;
        setQuiz({ ...quiz, ...updates });
        setHasChanges(true);
    };

    // Add question
    const addQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: generateId(),
            text: '',
            options: ['', '', '', ''],
            correctIndex: 0,
        };
        updateQuiz({ questions: [...(quiz?.questions || []), newQuestion] });
        setExpandedQuestion(newQuestion.id);
    };

    // Update question
    const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
        if (!quiz) return;
        const updatedQuestions = quiz.questions.map(q =>
            q.id === questionId ? { ...q, ...updates } : q
        );
        updateQuiz({ questions: updatedQuestions });
    };

    // Delete question
    const deleteQuestion = (questionId: string) => {
        if (!quiz) return;
        updateQuiz({ questions: quiz.questions.filter(q => q.id !== questionId) });
    };

    // Update option
    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        if (!quiz) return;
        const question = quiz.questions.find(q => q.id === questionId);
        if (!question) return;

        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        updateQuestion(questionId, { options: newOptions });
    };

    // Move question
    const moveQuestion = (fromIndex: number, toIndex: number) => {
        if (!quiz || toIndex < 0 || toIndex >= quiz.questions.length) return;
        const newQuestions = [...quiz.questions];
        const [moved] = newQuestions.splice(fromIndex, 1);
        newQuestions.splice(toIndex, 0, moved);
        updateQuiz({ questions: newQuestions });
    };

    // Go back
    const handleBack = () => {
        router.push(`/editor/${courseId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                Quiz not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-zinc-400" />
                        </button>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">Quiz Editor</p>
                            <input
                                type="text"
                                value={quiz.title}
                                onChange={(e) => updateQuiz({ title: e.target.value })}
                                className="text-xl font-bold text-white bg-transparent border-none focus:outline-none"
                                placeholder="Quiz Title"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <span className="text-xs text-amber-500">Unsaved changes</span>
                        )}
                        <button
                            onClick={saveQuiz}
                            disabled={isSaving || !hasChanges}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Settings */}
                <div className="mb-8 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">Quiz Settings</h3>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={quiz.shuffleQuestions ?? false}
                                onChange={(e) => updateQuiz({ shuffleQuestions: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                            />
                            Shuffle questions
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={quiz.shuffleOptions ?? false}
                                onChange={(e) => updateQuiz({ shuffleOptions: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                            />
                            Shuffle options
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                            Time limit:
                            <input
                                type="number"
                                value={quiz.timeLimit || 0}
                                onChange={(e) => updateQuiz({ timeLimit: parseInt(e.target.value) || 0 })}
                                className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-indigo-500"
                                min={0}
                            />
                            min
                        </label>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">
                            Questions ({quiz.questions.length})
                        </h2>
                    </div>

                    {quiz.questions.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-700">
                            <p className="mb-4">No questions yet. Add your first question!</p>
                            <button
                                onClick={addQuestion}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                Add Question
                            </button>
                        </div>
                    ) : (
                        <>
                            {quiz.questions.map((question, index) => (
                                <div
                                    key={question.id}
                                    className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
                                >
                                    {/* Question Header */}
                                    <div
                                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                                        onClick={() => setExpandedQuestion(
                                            expandedQuestion === question.id ? null : question.id
                                        )}
                                    >
                                        <GripVertical size={16} className="text-zinc-500 cursor-grab" />
                                        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-medium flex items-center justify-center text-sm">
                                            {index + 1}
                                        </span>
                                        <span className="flex-1 text-zinc-300 truncate">
                                            {question.text || 'Untitled question'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveQuestion(index, index - 1); }}
                                                disabled={index === 0}
                                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveQuestion(index, index + 1); }}
                                                disabled={index === quiz.questions.length - 1}
                                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
                                                className="p-1 text-zinc-500 hover:text-red-400"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Question Editor (Expanded) */}
                                    {expandedQuestion === question.id && (
                                        <div className="p-4 pt-0 space-y-4 border-t border-zinc-800">
                                            {/* Question Text */}
                                            <textarea
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                                placeholder="Enter your question..."
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                                                rows={2}
                                            />

                                            {/* Options */}
                                            <div className="space-y-2">
                                                {question.options.map((option, optIndex) => (
                                                    <div key={optIndex} className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => updateQuestion(question.id, { correctIndex: optIndex })}
                                                            className={`
                                                                w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                                                ${question.correctIndex === optIndex
                                                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                                                    : 'border-zinc-600 hover:border-zinc-500 text-zinc-500'}
                                                            `}
                                                        >
                                                            {question.correctIndex === optIndex && <Check size={16} />}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                                            placeholder={`Option ${optIndex + 1}`}
                                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Explanation */}
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1 block">Explanation (shown after answer)</label>
                                                <textarea
                                                    value={question.explanation || ''}
                                                    onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                                                    placeholder="Explain why this answer is correct..."
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Question Button */}
                            <button
                                onClick={addQuestion}
                                className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-indigo-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Add Question
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
