import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
    mockUseQuery.mockReturnValue({
      _id: "user123",
      instanceCreated: true,
      whatsappConnected: true,
      evolutionInstanceName: "hub_abc12345",
    });
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

  it("renders contact selector", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/select contact/i)).toBeInTheDocument();
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

  it("shows loading when user is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
