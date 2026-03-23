import { render, screen, fireEvent } from "@testing-library/react";
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

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

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
    contactTypingAt: undefined,
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
    contactTypingAt: undefined,
  },
];

const mockMessages = [
  {
    _id: "msg1",
    _creationTime: Date.now() - 60000,
    direction: "incoming",
    message: "Hello there!",
    status: "delivered",
    sentBy: "human",
    isNote: false,
  },
  {
    _id: "msg2",
    _creationTime: Date.now() - 30000,
    direction: "outgoing",
    message: "Hi! How can I help?",
    status: "sent",
    sentBy: "human",
    isNote: false,
  },
];

const mockSelectedConversation = {
  _id: "conv1",
  phone: "+1234567890",
  contactName: "John Doe",
  status: "human",
  contactTypingAt: undefined,
};

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
    // 4. quickReplies.list → quick replies
    let callIndex = 0;
    mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
      const i = callIndex % 4;
      callIndex++;
      if (i === 0) return mockConversations; // conversations.list
      if (args === "skip") return undefined; // skipped queries
      if (i === 3) return []; // quickReplies.list
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
      if (i === 3) return [];
      if (args === "skip") return undefined;
      return undefined;
    });
    renderInbox();
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it("shows bot indicator for bot-mode conversations", () => {
    renderInbox();
    const botIcons = document.querySelectorAll(".text-violet-400");
    expect(botIcons.length).toBeGreaterThan(0);
  });

  // --- Bulk selection tests ---

  it("renders selection checkboxes for each conversation", () => {
    renderInbox();
    // Each conversation has a Square (unchecked) icon
    const checkboxIcons = document.querySelectorAll(".text-zinc-600");
    expect(checkboxIcons.length).toBeGreaterThan(0);
  });

  it("shows bulk action bar when conversations are selected", () => {
    renderInbox();
    // Find Square SVG icons used as checkboxes (lucide renders: svg.lucide.lucide-square)
    const squareIcons = document.querySelectorAll("svg.lucide-square");
    expect(squareIcons.length).toBeGreaterThan(0);
    // Click the parent div (the onClick handler is on the wrapper div)
    fireEvent.click(squareIcons[0].parentElement!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByText("Archive All")).toBeInTheDocument();
    expect(screen.getByText("Mark Read")).toBeInTheDocument();
  });

  it("clears selection when clear button is clicked in bulk bar", () => {
    renderInbox();
    const squareIcons = document.querySelectorAll("svg.lucide-square");
    fireEvent.click(squareIcons[0].parentElement!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    const clearBtn = screen.getByTitle("Clear selection");
    fireEvent.click(clearBtn);
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  // --- Typing indicator tests ---

  it("shows typing indicator for conversations with recent typing", () => {
    const typingConversations = [
      {
        ...mockConversations[0],
        contactTypingAt: Date.now(), // typing right now
      },
      mockConversations[1],
    ];
    let callIndex = 0;
    mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
      const i = callIndex++;
      if (i === 0) return typingConversations;
      if (i === 3) return [];
      if (args === "skip") return undefined;
      return undefined;
    });
    renderInbox();
    expect(screen.getByText("typing")).toBeInTheDocument();
  });

  it("does not show typing indicator for old typing timestamps", () => {
    const oldTypingConversations = [
      {
        ...mockConversations[0],
        contactTypingAt: Date.now() - 60000, // 60s ago, stale
      },
      mockConversations[1],
    ];
    let callIndex = 0;
    mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
      const i = callIndex++;
      if (i === 0) return oldTypingConversations;
      if (i === 3) return [];
      if (args === "skip") return undefined;
      return undefined;
    });
    renderInbox();
    expect(screen.queryByText("typing")).not.toBeInTheDocument();
  });

  // --- Internal notes tests ---

  describe("with a conversation selected", () => {
    function setupConvSelectedMocks(
      msgs = mockMessages,
      conv = mockSelectedConversation,
      qr: unknown[] = [],
    ) {
      // Track which query we're on per render cycle (4 queries per render)
      let callIndex = 0;
      mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
        const i = callIndex % 4;
        callIndex++;
        if (i === 0) return mockConversations;
        if (i === 1) return conv;
        if (i === 2) return msgs;
        if (i === 3) return qr;
        return undefined;
      });
    }

    beforeEach(() => {
      setupConvSelectedMocks();
    });

    it("renders message thread with messages", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByText("Hello there!")).toBeInTheDocument();
      expect(screen.getByText("Hi! How can I help?")).toBeInTheDocument();
    });

    it("renders note toggle button", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByLabelText("Switch to note")).toBeInTheDocument();
    });

    it("switches to note mode when note toggle is clicked", () => {
      renderInbox("/inbox/conv1");
      const noteToggle = screen.getByLabelText("Switch to note");
      fireEvent.click(noteToggle);
      expect(
        screen.getByText(/internal note mode/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/write an internal note/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Save note")).toBeInTheDocument();
    });

    it("switches back to message mode", () => {
      renderInbox("/inbox/conv1");
      const noteToggle = screen.getByLabelText("Switch to note");
      fireEvent.click(noteToggle);
      expect(
        screen.getByText(/internal note mode/i),
      ).toBeInTheDocument();
      // Click again to switch back
      const messageToggle = screen.getByLabelText("Switch to message");
      fireEvent.click(messageToggle);
      expect(
        screen.queryByText(/internal note mode/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/type a message/i),
      ).toBeInTheDocument();
    });

    it("renders note messages with special styling", () => {
      const messagesWithNote = [
        ...mockMessages,
        {
          _id: "note1",
          _creationTime: Date.now() - 10000,
          direction: "outgoing",
          message: "Internal reminder: follow up tomorrow",
          status: "delivered",
          sentBy: "human",
          isNote: true,
        },
      ];
      setupConvSelectedMocks(messagesWithNote);
      renderInbox("/inbox/conv1");
      expect(
        screen.getByText("Internal reminder: follow up tomorrow"),
      ).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    // --- Quick replies tests ---

    it("renders quick replies button", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByLabelText("Quick replies")).toBeInTheDocument();
    });

    it("opens quick replies popover when clicked", () => {
      renderInbox("/inbox/conv1");
      const qrButton = screen.getByLabelText("Quick replies");
      fireEvent.click(qrButton);
      expect(screen.getByText("Quick Replies")).toBeInTheDocument();
    });

    it("shows 'no quick replies yet' when list is empty", () => {
      renderInbox("/inbox/conv1");
      const qrButton = screen.getByLabelText("Quick replies");
      fireEvent.click(qrButton);
      expect(screen.getByText(/no quick replies yet/i)).toBeInTheDocument();
    });

    it("shows quick reply items when available", () => {
      const quickReplies = [
        { _id: "qr1", shortcut: "/greeting", text: "Hello! How can I help?" },
        { _id: "qr2", shortcut: "/closing", text: "Thanks for contacting us!" },
      ];
      setupConvSelectedMocks(mockMessages, mockSelectedConversation, quickReplies);
      renderInbox("/inbox/conv1");
      const qrButton = screen.getByLabelText("Quick replies");
      fireEvent.click(qrButton);
      expect(screen.getByText("/greeting")).toBeInTheDocument();
      expect(screen.getByText("/closing")).toBeInTheDocument();
    });

    it("fills message input when quick reply is selected", () => {
      const quickReplies = [
        { _id: "qr1", shortcut: "/greeting", text: "Hello! How can I help?" },
      ];
      setupConvSelectedMocks(mockMessages, mockSelectedConversation, quickReplies);
      renderInbox("/inbox/conv1");
      const qrButton = screen.getByLabelText("Quick replies");
      fireEvent.click(qrButton);
      fireEvent.click(screen.getByText("/greeting"));
      const textarea = screen.getByPlaceholderText(/type a message/i);
      expect(textarea).toHaveValue("Hello! How can I help?");
    });

    // --- Media message tests ---

    it("renders media icon indicator for image messages", () => {
      const messagesWithMedia = [
        {
          _id: "media1",
          _creationTime: Date.now() - 5000,
          direction: "incoming",
          message: "Check this out",
          status: "delivered",
          sentBy: "human",
          isNote: false,
          mediaStorageId: "storage123",
          mediaType: "image",
        },
      ];
      // MediaPreview adds a 5th useQuery call per cycle for storage.getFileUrl
      let callIndex = 0;
      mockUseQuery.mockImplementation((_ref: unknown, args: unknown) => {
        const i = callIndex % 5;
        callIndex++;
        if (i === 0) return mockConversations;
        if (i === 1) return mockSelectedConversation;
        if (i === 2) return messagesWithMedia;
        if (i === 3) return [];
        if (i === 4) return null; // storage.getFileUrl
        return undefined;
      });
      renderInbox("/inbox/conv1");
      expect(screen.getByText("Check this out")).toBeInTheDocument();
    });

    // --- Generate with AI tests ---

    it("renders Generate with AI button", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByLabelText("Generate with AI")).toBeInTheDocument();
    });

    it("opens AI modal when Generate with AI is clicked", () => {
      renderInbox("/inbox/conv1");
      fireEvent.click(screen.getByLabelText("Generate with AI"));
      expect(
        screen.getByRole("heading", { name: /generate with ai/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/describe what you want to say/i),
      ).toBeInTheDocument();
    });

    it("closes AI modal when Cancel is clicked", () => {
      renderInbox("/inbox/conv1");
      fireEvent.click(screen.getByLabelText("Generate with AI"));
      fireEvent.click(screen.getByText("Cancel"));
      expect(
        screen.queryByRole("heading", { name: /generate with ai/i }),
      ).not.toBeInTheDocument();
    });

    // --- Chat header actions ---

    it("renders archive button", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByTitle("Archive")).toBeInTheDocument();
    });

    it("renders mark unread button", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByTitle("Mark unread")).toBeInTheDocument();
    });

    it("renders bot/human mode toggle", () => {
      renderInbox("/inbox/conv1");
      // John Doe is in human mode
      expect(screen.getByText("Manual")).toBeInTheDocument();
    });

    it("shows send message button", () => {
      renderInbox("/inbox/conv1");
      expect(screen.getByLabelText("Send message")).toBeInTheDocument();
    });

    it("disables send button when input is empty", () => {
      renderInbox("/inbox/conv1");
      const sendBtn = screen.getByLabelText("Send message");
      expect(sendBtn).toBeDisabled();
    });
  });
});
