import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AnonymousRoute } from "@/components/AnonymousRoute";

// Mock useConvexAuth
const mockUseConvexAuth = vi.fn();
vi.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
}));

describe("AnonymousRoute", () => {
  it("renders children when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter>
        <AnonymousRoute>
          <div>public content</div>
        </AnonymousRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("public content")).toBeInTheDocument();
  });

  it("redirects to dashboard when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AnonymousRoute>
          <div>public content</div>
        </AnonymousRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("public content")).not.toBeInTheDocument();
  });

  it("shows loading state while auth is loading", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    render(
      <MemoryRouter>
        <AnonymousRoute>
          <div>public content</div>
        </AnonymousRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("public content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
