import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";

const mockUseQuery = vi.fn();
const mockUsePaginatedQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DashboardPage calls useQuery 4 times in order:
    // 1. currentUser, 2. contacts.count, 3. messages.count, 4. campaigns.listByUser
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const i = callIndex++;
      if (i === 0) return { _id: "u1", whatsappConnected: true };
      if (i === 1) return 42; // contactCount
      if (i === 2) return 15; // messageCount
      if (i === 3) return [{ _id: "camp1" }]; // campaigns
      return null;
    });
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
  });

  it("renders page heading", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders connection status", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders quick actions with links", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Send Message")).toBeInTheDocument();
    expect(screen.getByText("New Campaign")).toBeInTheDocument();
    expect(screen.getByText("Manage Contacts")).toBeInTheDocument();
  });

  it("renders recent messages section", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Recent Messages")).toBeInTheDocument();
  });

  it("renders stat labels", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
    expect(screen.getByText("Messages Sent")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
  });
});
