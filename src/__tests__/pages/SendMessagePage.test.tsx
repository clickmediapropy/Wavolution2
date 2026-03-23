import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { SendMessagePage } from "@/pages/SendMessagePage";

const mockUseQuery = vi.fn();
const mockUsePaginatedQuery = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
}));

describe("SendMessagePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // listConnected returns one connected instance
    mockUseQuery.mockReturnValue([
      {
        _id: "inst1",
        name: "hub_abc12345",
        whatsappConnected: true,
        whatsappNumber: "+5491100000000",
      },
    ]);
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", phone: "+5491112345678", name: "Alice" },
        { _id: "c2", phone: "+5491187654321", name: "Bob" },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
  });

  it("renders page heading", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("renders searchable combobox for contact selection", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders message textarea", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders send button disabled when no input", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows loading when instances query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders message preview panel", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Your message preview will appear here"),
    ).toBeInTheDocument();
  });
});
