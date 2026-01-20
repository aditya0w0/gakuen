"use client";

import { Node, mergeAttributes, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { HelpCircle, ExternalLink, Settings } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// Generate unique ID
function generateId(): string {
    return `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Quiz Node View Component - Shows as a card with link to dedicated editor
function QuizNodeView({ node, updateAttributes, selected }: NodeViewProps) {
    const router = useRouter();
    const params = useParams();
    const courseId = params?.id as string;

    const attrs = node.attrs as {
        quizId: string;
        title: string;
        questionCount: number;
        passingScore: number;
        timeLimit: number;
    };

    const { quizId, title, questionCount, passingScore, timeLimit } = attrs;

    const handleEditQuiz = () => {
        if (courseId && quizId) {
            router.push(`/editor/${courseId}/quiz/${quizId}`);
        }
    };

    return (
        <NodeViewWrapper className="my-4">
            <div className={`
                relative rounded-xl overflow-hidden
                bg-gradient-to-br from-indigo-950/50 to-zinc-900
                border ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-800'}
                transition-all hover:border-indigo-500/50
            `}>
                {/* Header */}
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="p-3 bg-indigo-500/20 rounded-xl shrink-0">
                            <HelpCircle size={24} className="text-indigo-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">Quiz</span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => updateAttributes({ title: e.target.value })}
                                placeholder="Quiz Title"
                                className="w-full text-lg font-semibold text-white bg-transparent border-none focus:outline-none placeholder-zinc-500"
                            />

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                                <span>{questionCount} questions</span>
                                <span>•</span>
                                <span>{passingScore}% to pass</span>
                                {timeLimit > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>{timeLimit} min</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={handleEditQuiz}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                        >
                            <ExternalLink size={16} />
                            Edit Quiz
                        </button>
                    </div>
                </div>

                {/* Settings Bar */}
                <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Settings size={14} />
                        <span>Settings:</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                            Pass:
                            <input
                                type="number"
                                value={passingScore}
                                onChange={(e) => updateAttributes({ passingScore: parseInt(e.target.value) || 75 })}
                                className="w-12 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-indigo-500"
                                min={0}
                                max={100}
                            />
                            %
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                            Time:
                            <input
                                type="number"
                                value={timeLimit}
                                onChange={(e) => updateAttributes({ timeLimit: parseInt(e.target.value) || 0 })}
                                className="w-12 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-indigo-500"
                                min={0}
                            />
                            min
                        </label>
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
}

// Custom Quiz Extension
export const CustomQuiz = Node.create({
    name: 'customQuiz',

    group: 'block',

    draggable: true,

    atom: true,

    addAttributes() {
        return {
            quizId: {
                default: () => generateId(),
            },
            title: {
                default: 'Untitled Quiz',
            },
            questionCount: {
                default: 0,
            },
            passingScore: {
                default: 75,
            },
            timeLimit: {
                default: 5,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-quiz]',
                getAttrs: (dom: HTMLElement) => ({
                    quizId: dom.getAttribute('data-quiz-id'),
                    title: dom.getAttribute('data-quiz-title'),
                    questionCount: parseInt(dom.getAttribute('data-quiz-count') || '0'),
                    passingScore: parseInt(dom.getAttribute('data-quiz-passing') || '75'),
                    timeLimit: parseInt(dom.getAttribute('data-quiz-time') || '5'),
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-quiz': 'true' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(QuizNodeView);
    },
});

export default CustomQuiz;
