import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecentMessages } from "@/components/RecentMessages";

const mockUsePaginatedQuery = vi.fn();

vi.mock("convex/react", () => ({
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
}));

describe("RecentMessages", () => {
  it("shows empty state when no messages", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });

    render(<RecentMessages />);

    expect(screen.getByText("No messages sent yet")).toBeInTheDocument();
  });

  it("renders message list", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "m1",
          _creationTime: Date.now(),
          phone: "+111222333",
          message: "Hello!",
          status: "sent",
        },
        {
          _id: "m2",
          _creationTime: Date.now(),
          phone: "+444555666",
          message: "Test msg",
          status: "failed",
        },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });

    render(<RecentMessages />);

    expect(screen.getByText("+111222333")).toBeInTheDocument();
    expect(screen.getByText("+444555666")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("renders section heading", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });

    render(<RecentMessages />);

    expect(screen.getByText("Recent Messages")).toBeInTheDocument();
  });
});
