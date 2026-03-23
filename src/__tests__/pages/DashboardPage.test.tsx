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

// Mock react-countup used by StatsCard
vi.mock("react-countup", () => ({
  useCountUp: ({ ref, end }: { ref: { current: HTMLElement | null }; end: number }) => {
    queueMicrotask(() => {
      if (ref.current) ref.current.textContent = String(end);
    });
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DashboardPage calls useQuery 4 times:
    // 1. contacts.count, 2. messages.count, 3. campaigns.listByUser, 4. instances.count
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const i = callIndex++;
      if (i === 0) return 42; // contactCount
      if (i === 1) return 15; // messageCount
      if (i === 2) return [{ _id: "camp1" }]; // campaigns
      if (i === 3) return { total: 3, connected: 2 }; // instances.count
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
