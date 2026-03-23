import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
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

  it("renders count badge with total count", () => {
    mockUseQuery.mockReturnValue(42);
    renderPage();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders count badge as 0 when count is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderPage();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders filter chips for all statuses", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pending/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sent/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /failed/i })).toBeInTheDocument();
  });

  it("filters contacts by status when chip clicked", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1111111111", firstName: "Alice", status: "pending" },
        { _id: "c2", _creationTime: 900, userId: "u1", phone: "+2222222222", firstName: "Bob", status: "sent" },
      ],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });

    renderPage();
    // Both mobile and desktop views render in jsdom
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);

    // Click "pending" filter chip
    fireEvent.click(screen.getByRole("button", { name: /pending/i }));
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("renders contacts when data exists", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1234567890", firstName: "Alice", status: "pending" },
      ],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });

    renderPage();
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("+1234567890").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Load more when more contacts available", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1234567890", firstName: "Alice", status: "pending" },
      ],
      status: "CanLoadMore",
      loadMore: vi.fn(),
      isLoading: false,
    });

    renderPage();
    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
  });
});
