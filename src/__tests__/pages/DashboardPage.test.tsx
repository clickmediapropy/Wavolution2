import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";

const mockUseQuery = vi.fn();
const mockUsePaginatedQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  usePaginatedQuery: (...args: unknown[]) => mockUsePaginatedQuery(...args),
}));

// Mock react-countup used by StatsCard
vi.mock("react-countup", () => ({
  useCountUp: ({ ref, end }: { ref: { current: HTMLElement | null }; end: number }) => {
    queueMicrotask(() => {
      if (ref.current) ref.current.textContent = String(end);
    });
  },
}));

const mockDashboardStats = {
  deliveryRate: 95.5, openRate: 72.3, failureRate: 4.5,
  avgResponseMinutes: 45, totalSent: 100, totalDelivered: 95,
  totalRead: 72, totalFailed: 5, totalIncoming: 30,
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DashboardPage (9 queries) + OnboardingProgress child (4 queries) = 13 useQuery calls
    // Order:
    // 0: contacts.count → 42
    // 1: contacts.countThisWeek → 5
    // 2: campaigns.listByUser → [{ _id: "camp1", status: "running" }]
    // 3: instances.count → { total: 3, connected: 2 }
    // 4: offers.stats → {}
    // 5: verticals.list → []
    // 6: messages.dashboardStats → stats object
    // 7: messages.dailyCounts → []
    // 8: messages.contactDailyCounts → []
    // 9: instances.count (OnboardingProgress) → { total: 3, connected: 2 }
    // 10: contacts.count (OnboardingProgress) → 42
    // 11: campaigns.listByUser (OnboardingProgress) → [...]
    // 12: instances.list (OnboardingProgress) → [{ _id: "i1", whatsappConnected: true }]
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const i = callIndex % 13;
      callIndex++;
      if (i === 0 || i === 10) return 42; // contacts.count
      if (i === 1) return 5; // contacts.countThisWeek
      if (i === 2 || i === 11) return [{ _id: "camp1", status: "running" }]; // campaigns.listByUser
      if (i === 3 || i === 9) return { total: 3, connected: 2 }; // instances.count
      if (i === 4) return { totalActive: 1, totalInactive: 0, totalLive: 1, totalRevenue: 0, totalConversions: 0 }; // offers.stats
      if (i === 5) return []; // verticals.list
      if (i === 6) return mockDashboardStats; // messages.dashboardStats
      if (i === 7) return [1, 3, 5, 2, 4, 6, 3]; // messages.dailyCounts
      if (i === 8) return [2, 1, 3, 0, 1, 4, 2]; // messages.contactDailyCounts
      if (i === 12) return [{ _id: "i1", whatsappConnected: true, connectionStatus: "open" }]; // instances.list
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

    expect(screen.getByText("All systems operational")).toBeInTheDocument();
  });

  it("renders quick actions with links", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getAllByText("Send Message").length).toBeGreaterThan(0);
    expect(screen.getByText("New Campaign")).toBeInTheDocument();
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

    expect(screen.getByText("Total Leads")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Active Offers")).toBeInTheDocument();
  });

  it("renders real Quick Stats data", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Delivery Rate")).toBeInTheDocument();
    expect(screen.getByText("Open Rate")).toBeInTheDocument();
    expect(screen.getByText("Avg. Response")).toBeInTheDocument();
    expect(screen.getByText("Failure Rate")).toBeInTheDocument();
    expect(screen.getByText("95.5%")).toBeInTheDocument();
    expect(screen.getByText("72.3%")).toBeInTheDocument();
    expect(screen.getByText("45m")).toBeInTheDocument();
    expect(screen.getByText("4.5%")).toBeInTheDocument();
  });
});
