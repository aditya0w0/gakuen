"use client";

import { useEffect } from "react";
import { animate } from "animejs";
import type { TargetsParam, AnimationParams } from "animejs";

/**
 * Hook to run AnimeJS animations
 * In animejs v4, animate() takes targets and parameters as separate arguments
 */
export const useAnime = (targets: TargetsParam, parameters: AnimationParams) => {
  useEffect(() => {
    // Safety check
    if (!targets || !parameters) {
      console.warn("useAnime: targets or parameters is undefined");
      return;
    }

    try {
      const animation = animate(targets, parameters);

      return () => {
        if (animation && typeof animation.pause === 'function') {
          animation.pause();
        }
      };
    } catch (error) {
      console.error("useAnime animation error:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
};

// Re-export animejs functions for convenience
export { animate, stagger, random } from "animejs";
