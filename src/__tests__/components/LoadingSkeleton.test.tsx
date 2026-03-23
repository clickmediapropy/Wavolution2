import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import {
  SkeletonCard,
  SkeletonTable,
  SkeletonPage,
} from "@/components/LoadingSkeleton";

describe("SkeletonCard", () => {
  it("renders without crashing", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SkeletonTable", () => {
  it("renders 5 skeleton rows", () => {
    const { container } = render(<SkeletonTable />);
    // Header + 5 rows = 6 children
    const rows = container.querySelectorAll("[aria-hidden='true']");
    expect(rows.length).toBeGreaterThan(5);
  });
});

describe("SkeletonPage", () => {
  it("renders with loading role", () => {
    render(<SkeletonPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has accessible label", () => {
    render(<SkeletonPage />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});
