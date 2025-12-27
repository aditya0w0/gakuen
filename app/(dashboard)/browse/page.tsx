"use client";

import { useState, useEffect } from "react";
import { Course } from "@/lib/constants/demo-data";
import { CourseCard } from "@/components/course/CourseCard";
import { Search, Compass } from "lucide-react";
import { AICourseSelector } from "@/components/ai/AICourseSelector";

export default function BrowsePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        fetch('/api/courses')
            .then(res => res.json())
            .then(data => {
                setCourses(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load courses", err);
                setIsLoading(false);
            });
    }, []);

    // Semantic Search Logic
    useEffect(() => {
        const performSearch = async () => {
            // If search is empty, just reset to all courses (filtering by category will still happen locally on the full list if we want, or we can just reset)
            if (!searchQuery.trim()) {
                if (courses.length > 0) {
                    // Reset to original order or just rely on the category filter below
                }
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch('/api/courses/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, allCourses: courses }),
                });
                const data = await res.json();

                // Update courses with the sorted/ranked list from ML
                // We keep the full course objects but ordered by relevance
                // Map back to full objects if needed, but the API returns enriched objects.
                // Actually the API returns simplified objects + score. We might need to merge or just use what we have.
                // Let's assume the API returns enough data or we map by ID. 
                // For simplicity/speed, let's just update the list.

                // Better approach: Store "searchResults" separate from "courses" (which is the full catalog)
                // But the UI iterates "filteredCourses".
                // Let's make "filteredCourses" derived from a new state "rankedCourses" if search is active.
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce
        const timeoutId = setTimeout(() => {
            if (searchQuery) performSearch();
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, courses]); // CAUTION: dependency on courses might loop if we update courses.

    // Better Architecture:
    // 1. courses = source of truth (full catalog)
    // 2. searchResults = null (no search) or array of courses (ranked)
    // 3. displayedCourses = (searchResults || courses).filter(category)

    const [searchResults, setSearchResults] = useState<Course[] | null>(null);

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

                // Map the ranked results (which might be simplified) back to full course objects if needed
                // OR just trust the API results if they match the interface.
                // The API sends back { ...c, score }. `c` comes from `searchData` which has `id, title, description, category, level`.
                // Missing: `lessons`, `author`, `thumbnail`. 
                // We need to merge!

                const mergedResults = results.map((r: any) => {
                    const original = courses.find(c => c.id === r.id);
                    return original ? { ...original, ...r } : r;
                });

                setSearchResults(mergedResults);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            performSearch();
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, courses]);

    // Extract unique categories
    const categories = ["All", ...Array.from(new Set(courses.map(c => c.category)))];

    const sourceList = searchResults || courses;

    const filteredCourses = sourceList.filter(course => {
        // Search is already handled by ML if searchResults exists.
        // We only apply Client-side Category filtering now.
        return selectedCategory === "All" || course.category === selectedCategory;
    });

    return (
        <div className="space-y-8 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-500/30">
                            <Compass className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Explore</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Browse Courses</h1>
                    <p className="text-zinc-400 max-w-xl text-lg">
                        Discover new skills and advance your career with our curated catalog.
                    </p>
                </div>

                {/* Search Bar - Compact */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search for skills, topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all hover:bg-zinc-900 shadow-xl"
                    />
                </div>
            </div>

            {/* AI Advisor Section - Prominent Placement */}
            <AICourseSelector courses={courses} />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 pb-4">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2">Filters:</span>
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${selectedCategory === category
                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                            : "bg-zinc-900/40 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="pb-20">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses.map((course, idx) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                index={idx}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                        <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center mb-4 border border-white/5">
                            <Search className="w-6 h-6 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No courses found</h3>
                        <p className="text-zinc-500 text-sm">
                            We couldn't find anything matching "{searchQuery}" in {selectedCategory}.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
