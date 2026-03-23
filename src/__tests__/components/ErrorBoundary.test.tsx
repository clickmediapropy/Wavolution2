import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <p>Child rendered</p>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error from React error boundary
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when no error", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingChild shouldThrow={false} />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText("Child rendered")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // Error details are in a collapsible section — click to expand
    fireEvent.click(screen.getByText(/error details/i));
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it("renders retry button", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
