import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DashboardPage calls useQuery 11 times:
    // 1. contacts.count, 2. contacts.countThisWeek, 3. messages.count,
    // 4. messages.countToday, 5. campaigns.listByUser, 6. instances.count,
    // 7. messages.dashboardStats, 8. messages.dailyCounts,
    // 9. messages.contactDailyCounts, 10. messages.successRate,
    // 11. instances.lastDisconnection
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const i = callIndex++;
      if (i === 0) return 42;                                         // contacts.count
      if (i === 1) return 5;                                          // contacts.countThisWeek
      if (i === 2) return 15;                                         // messages.count
      if (i === 3) return 3;                                          // messages.countToday
      if (i === 4) return [{ _id: "camp1", status: "running" }];     // campaigns.listByUser
      if (i === 5) return { total: 3, connected: 2 };                // instances.count
      if (i === 6) return {                                           // messages.dashboardStats
        deliveryRate: 95.5, openRate: 72.3, failureRate: 4.5,
        avgResponseMinutes: 45, totalSent: 100, totalDelivered: 95,
        totalRead: 72, totalFailed: 5, totalIncoming: 30,
      };
      if (i === 7) return [1, 3, 5, 2, 4, 6, 3];                    // messages.dailyCounts
      if (i === 8) return [2, 1, 3, 0, 1, 4, 2];                    // messages.contactDailyCounts
      if (i === 9) return 96;                                         // messages.successRate
      if (i === 10) return null;                                      // instances.lastDisconnection
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
    expect(screen.getAllByText("Send Message").length).toBeGreaterThan(0);
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
    expect(screen.getByText("Active Campaigns")).toBeInTheDocument();
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
