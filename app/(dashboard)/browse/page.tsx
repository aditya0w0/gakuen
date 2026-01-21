"use client";

import { useState, useEffect } from "react";
import { Course } from "@/lib/types";
import { CourseCard } from "@/components/course/CourseCard";
import { Search, Compass, Sparkles } from "lucide-react";
import { AICourseSelector } from "@/components/ai/AICourseSelector";
import { RecommendedCourses } from "@/components/course/RecommendedCourses";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";


// Container stagger variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Item variants
const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
} as const;

export default function BrowsePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchResults, setSearchResults] = useState<Course[] | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetch('/api/courses', { next: { revalidate: 60 } })
            .then(res => res.json())
            .then(data => {
                // DEFENSIVE: Ensure data is an array
                setCourses(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load courses", err);
                setCourses([]);
                setIsLoading(false);
            });
    }, []);

    // Semantic Search with debounce
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults(null);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch('/api/courses/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, allCourses: courses }),
                });
                const results = await res.json();

                // DEFENSIVE: Ensure results is an array
                if (!Array.isArray(results)) {
                    console.warn('Search API returned non-array:', results);
                    setSearchResults(null);
                    return;
                }

                const mergedResults = results.map((r: { id: string;[key: string]: unknown }) => {
                    const original = courses.find(c => c.id === r.id);
                    return original ? { ...original, ...r } : r;
                });

                setSearchResults(mergedResults);
            } catch (error) {
                console.error("Search failed", error);
                setSearchResults(null);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            performSearch();
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, courses]);

    const categories = ["All", ...Array.from(new Set(courses.map(c => c.category)))];
    const sourceList = searchResults || courses;
    const filteredCourses = sourceList.filter(course => {
        return selectedCategory === "All" || course.category === selectedCategory;
    });

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 min-h-screen"
        >
            {/* Header Section */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-white/5 pb-8"
            >
                <div>
                    <motion.div
                        className="flex items-center gap-3 mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.1 }}
                    >
                        <motion.div
                            className="p-2 bg-indigo-500/20 rounded-xl backdrop-blur-md border border-indigo-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.browsePage.explore}</span>
                    </motion.div>
                    <motion.h1
                        className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.2 }}
                    >
                        {t.browsePage.title}
                    </motion.h1>
                    <motion.p
                        className="text-neutral-600 dark:text-zinc-400 max-w-xl text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {t.browsePage.description}
                    </motion.p>
                </div>

                {/* Search Bar */}
                <motion.div
                    className="relative w-full md:w-96"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring" as const, stiffness: 300, damping: 30, delay: 0.3 }}
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t.browsePage.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-white/10 rounded-full py-3.5 pl-12 pr-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all hover:bg-neutral-50 dark:hover:bg-zinc-900 shadow-lg dark:shadow-xl"
                    />
                    {searchQuery && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* AI Advisor Section */}
            <motion.div variants={itemVariants}>
                <AICourseSelector courses={courses} />
            </motion.div>

            {/* Category Filters */}
            <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-2 pb-4"
            >
                <span className="text-xs font-semibold text-neutral-500 dark:text-zinc-500 uppercase tracking-wider mr-2">{t.browsePage.filters}:</span>
                {categories.map((category, index) => (
                    <motion.button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${selectedCategory === category
                            ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-lg"
                            : "bg-white dark:bg-zinc-900/40 text-neutral-600 dark:text-zinc-400 border-neutral-200 dark:border-white/5 hover:border-neutral-400 dark:hover:border-white/20 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                    >
                        {category}
                    </motion.button>
                ))}
            </motion.div>

            {/* AI Recommendations Section */}
            <RecommendedCourses limit={4} className="mb-8" />

            {/* Content Grid */}
            <div className="pb-20">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-4"
                        >
                            <motion.div
                                className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="text-neutral-500 dark:text-zinc-500 text-sm">{t.browsePage.findingCourses}</p>
                        </motion.div>
                    ) : filteredCourses.length > 0 ? (
                        <motion.div
                            key="grid"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredCourses.map((course, idx) => (
                                <motion.div
                                    key={course.id}
                                    variants={itemVariants}
                                    layout
                                    whileHover={{ y: -6 }}
                                    transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
                                >
                                    <CourseCard course={course} index={idx} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-neutral-200 dark:border-white/5 rounded-3xl bg-neutral-50 dark:bg-white/[0.02]"
                        >
                            <motion.div
                                className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-zinc-900/50 flex items-center justify-center mb-4 border border-neutral-200 dark:border-white/5"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Search className="w-6 h-6 text-neutral-400 dark:text-zinc-600" />
                            </motion.div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">{t.browsePage.noResults}</h3>
                            <p className="text-neutral-500 dark:text-zinc-500 text-sm">
                                We couldn't find anything matching "{searchQuery}" in {selectedCategory}.
                            </p>
                            <motion.button
                                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                            >
                                {t.browsePage.clearFilters}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
