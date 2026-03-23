import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { BulkCampaignPage } from "@/pages/BulkCampaignPage";

const mockUsePaginatedQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
  useAction: () => vi.fn(),
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
}));

describe("BulkCampaignPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", phone: "+111", name: "Alice", status: "pending" },
        { _id: "c2", phone: "+222", name: "Bob", status: "sent" },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUseMutation.mockReturnValue(vi.fn());
    // listConnected returns one instance
    mockUseQuery.mockReturnValue([
      { _id: "inst1", name: "hub_test", whatsappConnected: true },
    ]);
  });

  it("renders page heading", () => {
    render(
      <MemoryRouter>
        <BulkCampaignPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /new campaign/i }),
    ).toBeInTheDocument();
  });

  it("renders step indicator with 3 steps", () => {
    render(
      <MemoryRouter>
        <BulkCampaignPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Recipients")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("starts on recipients step", () => {
    render(
      <MemoryRouter>
        <BulkCampaignPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("All Contacts")).toBeInTheDocument();
    expect(screen.getByText("Pending Only")).toBeInTheDocument();
    expect(screen.getByText("Manual Selection")).toBeInTheDocument();
  });

  it("navigates to message step when clicking Next", () => {
    render(
      <MemoryRouter>
        <BulkCampaignPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByLabelText("Campaign Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Message template")).toBeInTheDocument();
  });

  it("Back button is disabled on first step", () => {
    render(
      <MemoryRouter>
        <BulkCampaignPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("shows loading spinner while contacts load", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      isLoading: true,
      loadMore: vi.fn(),
    });

    render(
      <MemoryRouter>
        <BulkCampaignPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
