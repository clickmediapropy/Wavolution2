import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

// Mock auth hooks
const mockUseConvexAuth = vi.fn();
const mockSignOut = vi.fn();
vi.mock("convex/react", () => ({
  useConvexAuth: () => mockUseConvexAuth(),
}));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: mockSignOut }),
}));

describe("AppLayout", () => {
  beforeEach(() => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockSignOut.mockReset();
  });

  it("renders navbar with app name", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>child content</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Message Hub")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>test child content</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("test child content")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent("Message Hub");
  });

  it("shows logout button when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /log\s?out|sign\s?out/i })).toBeInTheDocument();
  });

  it("calls signOut on logout click", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /log\s?out|sign\s?out/i }));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("hides logout button when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /log\s?out|sign\s?out/i })).not.toBeInTheDocument();
  });
});
