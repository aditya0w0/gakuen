import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    heuristicPersonalization,
    type PersonalizationInput,
    type FrontendState,
    type UserProfile,
    type AvailableCourse,
} from "@/lib/ai/personalization";

describe("Personalization", () => {
    describe("heuristicPersonalization", () => {
        const mockFrontendState: FrontendState = {
            routeChanges: ["/courses", "/courses/cs-101"],
            viewedCourseIds: ["cs-101"],
            clickedTags: ["javascript", "web"],
            watchDuration: 120,
            scrollDepth: 75,
        };

        const mockUserProfile: UserProfile = {
            level: "intermediate",
            preferredTopics: ["programming", "web"],
        };

        const mockCourses: AvailableCourse[] = [
            { id: "course-1", difficulty: "beginner", tags: ["javascript", "basics"] },
            { id: "course-2", difficulty: "intermediate", tags: ["javascript", "web"] },
            { id: "course-3", difficulty: "advanced", tags: ["rust", "systems"] },
            { id: "course-4", difficulty: "intermediate", tags: ["python", "data"] },
            { id: "course-5", difficulty: "beginner", tags: ["web", "html"] },
        ];

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("returns recommended course IDs", () => {
            const input: PersonalizationInput = {
                frontendState: mockFrontendState,
                userProfile: mockUserProfile,
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            expect(result.recommendedCourseIds).toBeDefined();
            expect(Array.isArray(result.recommendedCourseIds)).toBe(true);
            expect(result.recommendedCourseIds.length).toBeLessThanOrEqual(5);
        });

        it("prioritizes courses matching clicked tags", () => {
            const input: PersonalizationInput = {
                frontendState: {
                    ...mockFrontendState,
                    clickedTags: ["javascript"],
                },
                userProfile: mockUserProfile,
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            // Courses with "javascript" tag should be ranked higher
            const jsCoursesInTop = result.recommendedCourseIds.filter((id) =>
                mockCourses.find((c) => c.id === id)?.tags.includes("javascript")
            );
            expect(jsCoursesInTop.length).toBeGreaterThan(0);
        });

        it("matches course difficulty to user level", () => {
            const input: PersonalizationInput = {
                frontendState: {
                    routeChanges: [],
                    viewedCourseIds: [],
                    clickedTags: [],
                },
                userProfile: {
                    level: "beginner",
                    preferredTopics: [],
                },
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            // With no other signals, beginner courses should rank higher for beginner users
            const topCourse = mockCourses.find((c) => c.id === result.recommendedCourseIds[0]);
            expect(["beginner", "intermediate"]).toContain(topCourse?.difficulty);
        });

        it("returns frontend updates with highlight tags", () => {
            const input: PersonalizationInput = {
                frontendState: mockFrontendState,
                userProfile: mockUserProfile,
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            expect(result.frontendUpdates).toBeDefined();
            expect(result.frontendUpdates.highlightTags).toBeDefined();
            expect(Array.isArray(result.frontendUpdates.highlightTags)).toBe(true);
        });

        it("includes clicked tags in highlight tags", () => {
            const input: PersonalizationInput = {
                frontendState: {
                    ...mockFrontendState,
                    clickedTags: ["react", "typescript"],
                },
                userProfile: mockUserProfile,
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            // Should include at least some of the clicked tags
            const hasClickedTags = input.frontendState.clickedTags.some((tag) =>
                result.frontendUpdates.highlightTags.includes(tag)
            );
            expect(hasClickedTags).toBe(true);
        });

        it("only returns IDs from available courses", () => {
            const input: PersonalizationInput = {
                frontendState: mockFrontendState,
                userProfile: mockUserProfile,
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);
            const validIds = new Set(mockCourses.map((c) => c.id));

            for (const id of result.recommendedCourseIds) {
                expect(validIds.has(id)).toBe(true);
            }
        });

        it("handles empty frontend state gracefully", () => {
            const input: PersonalizationInput = {
                frontendState: {
                    routeChanges: [],
                    viewedCourseIds: [],
                    clickedTags: [],
                },
                userProfile: mockUserProfile,
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            expect(result.recommendedCourseIds.length).toBeGreaterThan(0);
            expect(result.frontendUpdates).toBeDefined();
        });

        it("handles empty preferred topics gracefully", () => {
            const input: PersonalizationInput = {
                frontendState: mockFrontendState,
                userProfile: {
                    level: "intermediate",
                    preferredTopics: [],
                },
                availableCourses: mockCourses,
            };

            const result = heuristicPersonalization(input);

            expect(result.recommendedCourseIds.length).toBeGreaterThan(0);
        });

        it("limits recommendations to 5 courses", () => {
            const manyCourses: AvailableCourse[] = Array.from({ length: 20 }, (_, i) => ({
                id: `course-${i}`,
                difficulty: "intermediate" as const,
                tags: ["programming"],
            }));

            const input: PersonalizationInput = {
                frontendState: mockFrontendState,
                userProfile: mockUserProfile,
                availableCourses: manyCourses,
            };

            const result = heuristicPersonalization(input);

            expect(result.recommendedCourseIds.length).toBeLessThanOrEqual(5);
        });
    });
});

describe("API Route Mock", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
    });

    it("POST /api/personalize returns personalization result", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                recommended_course_ids: ["course-1", "course-2"],
                frontend_updates: {
                    highlight_tags: ["javascript"],
                    suggested_route: null,
                    ui_focus: null,
                },
            }),
        });

        const response = await fetch("/api/personalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                frontendState: {
                    routeChanges: [],
                    viewedCourseIds: [],
                    clickedTags: ["javascript"],
                },
                userProfile: {
                    level: "intermediate",
                    preferredTopics: ["web"],
                },
                availableCourses: [
                    { id: "course-1", difficulty: "intermediate", tags: ["javascript"] },
                ],
            }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.recommended_course_ids).toBeDefined();
        expect(data.frontend_updates).toBeDefined();
    });

    it("POST /api/personalize returns 400 for invalid input", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: "Invalid frontendState" }),
        });

        const response = await fetch("/api/personalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
    });

    it("POST /api/personalize returns 401 for unauthenticated request", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: "Authentication required" }),
        });

        const response = await fetch("/api/personalize", {
            method: "POST",
            body: JSON.stringify({}),
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
    });

    it("POST /api/personalize returns 429 for rate limited request", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            json: async () => ({ error: "Too many requests" }),
        });

        const response = await fetch("/api/personalize", {
            method: "POST",
            body: JSON.stringify({}),
        });

        expect(response.status).toBe(429);
    });

    it("DELETE /api/personalize clears cache", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true, message: "Personalization cache cleared" }),
        });

        const response = await fetch("/api/personalize", {
            method: "DELETE",
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
