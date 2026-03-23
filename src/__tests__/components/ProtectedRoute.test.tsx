import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock useConvexAuth
const mockUseConvexAuth = vi.fn();
vi.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
}));

describe("ProtectedRoute", () => {
  it("renders children when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute>
          <div>protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("shows loading state while auth is loading", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
