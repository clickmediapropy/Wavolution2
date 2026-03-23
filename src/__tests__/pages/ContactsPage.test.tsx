import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ContactsPage } from "@/pages/ContactsPage";

// Mock Convex hooks
const mockUsePaginatedQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
  useMutation: () => mockUseMutation(),
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}));

describe("ContactsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });
    mockUseMutation.mockReturnValue(vi.fn());
    mockUseQuery.mockReturnValue(undefined);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsPage />
      </MemoryRouter>,
    );
  }

  it("renders page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /contacts/i })).toBeInTheDocument();
  });

  it("renders Add Contact button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /add contact/i })).toBeInTheDocument();
  });

  it("renders Upload CSV link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /upload csv/i })).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderPage();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("shows empty state when no contacts", () => {
    renderPage();
    expect(screen.getByText(/no contacts/i)).toBeInTheDocument();
  });

  it("renders contacts when data exists", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1234567890", name: "Alice", status: "pending" },
      ],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });

    renderPage();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
  });

  it("shows Load more when more contacts available", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1234567890", name: "Alice", status: "pending" },
      ],
      status: "CanLoadMore",
      loadMore: vi.fn(),
      isLoading: false,
    });

    renderPage();
    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
  });
});
