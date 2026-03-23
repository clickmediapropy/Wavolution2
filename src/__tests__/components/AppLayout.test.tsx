import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
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

  it("does not render footer", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
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

  it("shows Dashboard and Contacts nav links when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contacts/i })).toBeInTheDocument();
  });

  it("hides nav links when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: /contacts/i })).not.toBeInTheDocument();
  });

  it("renders sidebar with nav items when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    // Sidebar should include nav items
    expect(screen.getByRole("link", { name: /inbox/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /campaigns/i })).toBeInTheDocument();
  });

  it("does not render sidebar when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    // Should not have sidebar nav items
    expect(screen.queryByRole("link", { name: /inbox/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /campaigns/i })).not.toBeInTheDocument();
  });

  it("renders Collapse button in sidebar when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Collapse")).toBeInTheDocument();
  });

  it("renders Send nav link when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /send/i })).toBeInTheDocument();
  });
});
