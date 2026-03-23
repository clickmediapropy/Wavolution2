import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vite-plus/test";

// IntersectionObserver polyfill for jsdom (needed by framer-motion viewport features)
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  } as unknown as typeof globalThis.IntersectionObserver;
}

// Global framer-motion mock — renders children as plain HTML elements
vi.mock("framer-motion", () => {
  const framerMotionProps = new Set([
    "animate", "initial", "exit", "transition", "variants",
    "whileHover", "whileTap", "whileFocus", "whileInView", "whileDrag",
    "layout", "layoutId", "layoutDependency", "layoutScroll",
    "drag", "dragConstraints", "dragElastic", "dragMomentum",
    "dragTransition", "dragSnapToOrigin", "dragPropagation",
    "onDrag", "onDragEnd", "onDragStart", "onAnimationStart",
    "onAnimationComplete", "onLayoutAnimationStart", "onLayoutAnimationComplete",
  ]);

  // Cache component functions so React sees stable references and preserves state
  const componentCache = new Map<string | symbol, React.FC<any>>();

  const motionHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (!componentCache.has(prop)) {
        const Component: React.FC<any> = ({ children, ...rest }) => {
          const htmlProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(rest)) {
            if (!framerMotionProps.has(key)) {
              htmlProps[key] = value;
            }
          }
          return React.createElement(String(prop), htmlProps, children);
        };
        Component.displayName = `motion.${String(prop)}`;
        componentCache.set(prop, Component);
      }
      return componentCache.get(prop)!;
    },
  };

  return {
    motion: new Proxy({}, motionHandler),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => true,
  };
});

// Global localStorage mock for jsdom
if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.getItem !== "function") {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const key in store) delete store[key]; }),
      get length() { return Object.keys(store).length; },
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    },
    writable: true,
  });
}
