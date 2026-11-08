"use client";

export type ConceptProgress = {
  best: number;
  last: number;
  mastered: boolean;
  tries: number;
  updatedAt: string;
};

export type ProgressMap = Record<string, ConceptProgress>;

const KEY = "math3-progress-v1";

export function loadProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* 저장 불가 환경(시크릿 모드 등)에서는 이번 세션 동안만 유지 */
  }
}
