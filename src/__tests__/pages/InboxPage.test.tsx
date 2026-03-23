import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { InboxPage } from "@/pages/InboxPage";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
  useAction: () => vi.fn(),
}));

vi.mock("react-countup", () => ({
  useCountUp: ({
    ref,
    end,
  }: {
    ref: { current: HTMLElement | null };
    end: number;
  }) => {
    queueMicrotask(() => {
      if (ref.current) ref.current.textContent = String(end);
    });
  },
}));

const mockConversations = [
  {
    _id: "conv1",
    phone: "+1234567890",
    contactName: "John Doe",
    lastMessageText: "Hey, I'm interested in your product",
    lastMessageAt: Date.now() - 60000,
    lastMessageDirection: "inbound",
    unreadCount: 2,
    hasBeenInteracted: false,
    isArchived: false,
    status: "human",
  },
  {
    _id: "conv2",
    phone: "+0987654321",
    contactName: "Jane Smith",
    lastMessageText: "Thanks for the info!",
    lastMessageAt: Date.now() - 120000,
    lastMessageDirection: "inbound",
    unreadCount: 0,
    hasBeenInteracted: true,
    isArchived: false,
    status: "bot",
  },
];

function renderInbox(path = "/inbox") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/inbox/:conversationId" element={<InboxPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("InboxPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // InboxPage calls useQuery multiple times:
    // 1. conversations.list → array of conversations
    // 2. conversations.get → skip (no conversationId selected)
    // 3. conversations.getMessages → skip (no conversationId selected)
    let callIndex = 0;
    mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
      const i = callIndex++;
      if (i === 0) return mockConversations; // conversations.list
      if (args === "skip") return undefined; // skipped queries
      return undefined;
    });
    mockUseMutation.mockReturnValue(vi.fn());
  });

  it("renders the inbox heading", () => {
    renderInbox();
    expect(
      screen.getByRole("heading", { name: /inbox/i }),
    ).toBeInTheDocument();
  });

  it("renders conversation list with contact names", () => {
    renderInbox();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("shows unread badge for conversations with unread messages", () => {
    renderInbox();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows message preview text", () => {
    renderInbox();
    expect(
      screen.getByText(/interested in your product/i),
    ).toBeInTheDocument();
  });

  it("shows empty state when no conversations", () => {
    mockUseQuery.mockReturnValue([]);
    renderInbox();
    expect(screen.getByText(/no conversations/i)).toBeInTheDocument();
  });

  it("shows loading state when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderInbox();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows select conversation prompt when no conversation selected", () => {
    let callIndex = 0;
    mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
      const i = callIndex++;
      if (i === 0) return mockConversations;
      if (args === "skip") return undefined;
      return undefined;
    });
    renderInbox();
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it("shows bot indicator for bot-mode conversations", () => {
    renderInbox();
    // Jane Smith's conversation is in bot mode — should show bot icon
    // The Bot icon is rendered as an SVG, check for its presence via aria or class
    const botIcons = document.querySelectorAll(".text-violet-400");
    expect(botIcons.length).toBeGreaterThan(0);
  });
});
