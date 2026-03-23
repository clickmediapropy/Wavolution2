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

  it("renders hamburger menu toggle button when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    const toggleButton = screen.getByTestId("mobile-menu-toggle");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-label", "Toggle navigation menu");
  });

  it("does not render hamburger menu toggle when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("mobile-menu-toggle")).not.toBeInTheDocument();
  });

  it("toggles mobile nav panel on hamburger click", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    // Mobile panel should not be visible initially
    expect(screen.queryByTestId("mobile-nav-panel")).not.toBeInTheDocument();

    // Click hamburger to open
    fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
    expect(screen.getByTestId("mobile-nav-panel")).toBeInTheDocument();

    // Click hamburger again to close
    fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
    expect(screen.queryByTestId("mobile-nav-panel")).not.toBeInTheDocument();
  });

  it("closes mobile nav panel when a nav link is clicked", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    // Open the mobile panel
    fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
    expect(screen.getByTestId("mobile-nav-panel")).toBeInTheDocument();

    // Click a nav link inside the mobile panel
    const mobilePanel = screen.getByTestId("mobile-nav-panel");
    const mobileLinks = mobilePanel.querySelectorAll("a");
    expect(mobileLinks.length).toBeGreaterThan(0);
    fireEvent.click(mobileLinks[0]!);

    // Panel should close
    expect(screen.queryByTestId("mobile-nav-panel")).not.toBeInTheDocument();
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
