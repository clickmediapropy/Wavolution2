import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CampaignStatusPage } from "@/pages/CampaignStatusPage";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: () => vi.fn(),
}));

function renderWithRoute(campaignId: string) {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}`]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignStatusPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CampaignStatusPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while data loads", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderWithRoute("campaign123");

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows not found message for null campaign", () => {
    mockUseQuery.mockReturnValue(null);
    renderWithRoute("campaign123");

    expect(
      screen.getByRole("heading", { name: /campaign not found/i }),
    ).toBeInTheDocument();
  });

  it("renders campaign name and stats", () => {
    mockUseQuery.mockReturnValue({
      _id: "campaign123",
      name: "March Promo",
      status: "running",
      recipientType: "all",
      total: 100,
      processed: 40,
      sent: 35,
      failed: 5,
      delay: 5000,
      messageTemplate: "Hello {name}!",
      hasMedia: false,
      startedAt: Date.now(),
    });
    renderWithRoute("campaign123");

    expect(
      screen.getByRole("heading", { name: /march promo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument(); // sent
    expect(screen.getByText("5")).toBeInTheDocument(); // failed
    expect(screen.getByText("60")).toBeInTheDocument(); // remaining
    expect(screen.getByText("100")).toBeInTheDocument(); // total
  });

  it("shows pause and stop buttons for running campaigns", () => {
    mockUseQuery.mockReturnValue({
      _id: "campaign123",
      name: "Test Campaign",
      status: "running",
      recipientType: "all",
      total: 50,
      processed: 10,
      sent: 8,
      failed: 2,
      delay: 3000,
      messageTemplate: "Hi!",
      hasMedia: false,
      startedAt: Date.now(),
    });
    renderWithRoute("campaign123");

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("does not show stop button for completed campaigns", () => {
    mockUseQuery.mockReturnValue({
      _id: "campaign123",
      name: "Done Campaign",
      status: "completed",
      recipientType: "all",
      total: 50,
      processed: 50,
      sent: 48,
      failed: 2,
      delay: 3000,
      messageTemplate: "Hi!",
      hasMedia: false,
      startedAt: Date.now() - 60000,
      completedAt: Date.now(),
    });
    renderWithRoute("campaign123");

    expect(
      screen.queryByRole("button", { name: /stop campaign/i }),
    ).not.toBeInTheDocument();
  });

  it("shows resume and stop buttons for paused campaigns", () => {
    mockUseQuery.mockReturnValue({
      _id: "campaign123",
      name: "Paused Campaign",
      status: "paused",
      recipientType: "all",
      total: 50,
      processed: 10,
      sent: 8,
      failed: 2,
      delay: 3000,
      messageTemplate: "Hi!",
      hasMedia: false,
      startedAt: Date.now(),
    });
    renderWithRoute("campaign123");

    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("shows estimated completion time for running campaigns", () => {
    mockUseQuery.mockReturnValue({
      _id: "campaign123",
      name: "ETA Test",
      status: "running",
      recipientType: "all",
      total: 100,
      processed: 50,
      sent: 45,
      failed: 5,
      delay: 5000,
      messageTemplate: "Hi!",
      hasMedia: false,
      startedAt: Date.now(),
    });
    renderWithRoute("campaign123");

    expect(screen.getAllByText(/remaining/i).length).toBeGreaterThan(0);
  });

  it("shows progress bar with correct percentage", () => {
    mockUseQuery.mockReturnValue({
      _id: "campaign123",
      name: "Half Done",
      status: "running",
      recipientType: "all",
      total: 100,
      processed: 50,
      sent: 40,
      failed: 10,
      delay: 5000,
      messageTemplate: "Test",
      hasMedia: false,
      startedAt: Date.now(),
    });
    renderWithRoute("campaign123");

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });
});
