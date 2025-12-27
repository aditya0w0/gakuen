"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to server terminal
        logger.error('React Error Boundary caught error', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n'),
            componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
        }, 'ErrorBoundary');

        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { error } = this.state;

            // Extract useful error info
            const errorMessage = error?.message || 'Something went wrong';
            const isHookError = errorMessage.includes('Hooks');
            const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');

            // Create user-friendly message
            let friendlyMessage = 'An unexpected error occurred. Please try refreshing the page.';
            let suggestion = '';

            if (isHookError) {
                friendlyMessage = 'A React component encountered an internal error.';
                suggestion = 'This is usually caused by a code issue. Try refreshing or going home.';
            } else if (isNetworkError) {
                friendlyMessage = 'Unable to connect to the server.';
                suggestion = 'Check your internet connection and try again.';
            }

            return (
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
                        {/* Icon */}
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Oops! Something broke
                        </h1>

                        {/* Message */}
                        <p className="text-zinc-400 mb-2">
                            {friendlyMessage}
                        </p>

                        {suggestion && (
                            <p className="text-sm text-zinc-500 mb-6">
                                {suggestion}
                            </p>
                        )}

                        {/* Error details (collapsed by default) */}
                        <details className="mb-6 text-left">
                            <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors">
                                Technical details
                            </summary>
                            <pre className="mt-2 p-3 bg-zinc-800 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                                {errorMessage}
                            </pre>
                        </details>

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleHome}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <Home size={16} />
                                Go Home
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
