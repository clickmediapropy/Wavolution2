import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ContactDetailPage } from "@/pages/ContactDetailPage";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
  useAction: () => vi.fn(),
}));

const mockDetail = {
  contact: {
    _id: "contact1",
    _creationTime: Date.now() - 86400000,
    userId: "user1",
    phone: "+5551234567",
    firstName: "Maria",
    lastName: "Garcia",
    status: "sent",
    tags: ["vip", "customer"],
    engagementScore: 72,
    lastMessageAt: Date.now() - 3600000,
    customFields: {
      company: "Acme Corp",
      role: "CTO",
    },
    pipelineStageId: "stage1",
    aiSummary: "Interested customer who has been asking about enterprise pricing.",
  },
  conversation: {
    _id: "conv1",
    phone: "+5551234567",
    status: "human",
  },
  messages: [
    {
      _id: "msg1",
      _creationTime: Date.now() - 7200000,
      message: "Hi, I'd like to know about pricing",
      direction: "incoming",
      status: "delivered",
      sentBy: "contact",
    },
    {
      _id: "msg2",
      _creationTime: Date.now() - 3600000,
      message: "Sure! Our plans start at $99/mo",
      direction: "outgoing",
      status: "sent",
      sentBy: "human",
    },
    {
      _id: "msg3",
      _creationTime: Date.now() - 1800000,
      message: "Internal: Follow up with enterprise plan details",
      direction: "outgoing",
      status: "sent",
      sentBy: "human",
      isNote: true,
    },
  ],
  pipelineStage: {
    _id: "stage1",
    name: "Qualified",
    color: "#3b82f6",
  },
};

function renderContactDetail(id = "contact1") {
  return render(
    <MemoryRouter initialEntries={[`/contacts/${id}`]}>
      <Routes>
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ContactDetailPage", () => {
  const mockMutationFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(mockDetail);
    mockUseMutation.mockReturnValue(mockMutationFn);
    mockMutationFn.mockResolvedValue(undefined);
  });

  // --- Loading state ---

  it("shows loading spinner when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderContactDetail();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  // --- Not found state ---

  it("shows not found when contact is null", () => {
    mockUseQuery.mockReturnValue(null);
    renderContactDetail();
    expect(screen.getByText("Contact not found")).toBeInTheDocument();
    expect(screen.getByText("Back to contacts")).toBeInTheDocument();
  });

  // --- Basic rendering ---

  it("renders contact name", () => {
    renderContactDetail();
    expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
  });

  it("renders contact phone number", () => {
    renderContactDetail();
    expect(screen.getByText("+5551234567")).toBeInTheDocument();
  });

  it("renders back to contacts link", () => {
    renderContactDetail();
    const backLinks = screen.getAllByText("Back to contacts");
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
  });

  // --- Tags ---

  it("renders contact tags", () => {
    renderContactDetail();
    expect(screen.getByText("vip")).toBeInTheDocument();
    expect(screen.getByText("customer")).toBeInTheDocument();
  });

  it("renders Tags section heading", () => {
    renderContactDetail();
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  it("renders Add tag button", () => {
    renderContactDetail();
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("shows tag input when Add is clicked", () => {
    renderContactDetail();
    fireEvent.click(screen.getByText("Add"));
    expect(
      screen.getByPlaceholderText("Tag name..."),
    ).toBeInTheDocument();
  });

  // --- Custom fields ---

  it("renders custom fields", () => {
    renderContactDetail();
    expect(screen.getByText("Custom Fields")).toBeInTheDocument();
    expect(screen.getByText("company")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("role")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
  });

  // --- Engagement score ---

  it("renders engagement score", () => {
    renderContactDetail();
    expect(screen.getByText("Engagement Score")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  // --- Pipeline stage ---

  it("renders pipeline stage name", () => {
    renderContactDetail();
    expect(screen.getByText("Pipeline Stage")).toBeInTheDocument();
    expect(screen.getByText("Qualified")).toBeInTheDocument();
  });

  // --- AI Summary ---

  it("renders AI summary", () => {
    renderContactDetail();
    expect(screen.getByText("AI Summary")).toBeInTheDocument();
    expect(
      screen.getByText(/interested customer who has been asking/i),
    ).toBeInTheDocument();
  });

  // --- Conversation history ---

  it("renders conversation history heading", () => {
    renderContactDetail();
    expect(screen.getByText("Conversation History")).toBeInTheDocument();
  });

  it("renders message count", () => {
    renderContactDetail();
    expect(screen.getByText("3 messages")).toBeInTheDocument();
  });

  it("renders messages in conversation", () => {
    renderContactDetail();
    expect(
      screen.getByText("Hi, I'd like to know about pricing"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sure! Our plans start at $99/mo"),
    ).toBeInTheDocument();
  });

  it("renders internal notes in conversation", () => {
    renderContactDetail();
    expect(
      screen.getByText(/follow up with enterprise plan details/i),
    ).toBeInTheDocument();
  });

  it("renders Open in Inbox link", () => {
    renderContactDetail();
    expect(screen.getByText("Open in Inbox")).toBeInTheDocument();
  });

  it("renders open full inbox link", () => {
    renderContactDetail();
    expect(screen.getByText("Open full inbox")).toBeInTheDocument();
  });

  // --- Without optional data ---

  it("renders dash for missing engagement score", () => {
    const detailNoScore = {
      ...mockDetail,
      contact: {
        ...mockDetail.contact,
        engagementScore: undefined,
      },
    };
    mockUseQuery.mockReturnValue(detailNoScore);
    renderContactDetail();
    // Should show "—" for missing engagement score
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("does not render pipeline stage when missing", () => {
    const detailNoStage = {
      ...mockDetail,
      pipelineStage: undefined,
    };
    mockUseQuery.mockReturnValue(detailNoStage);
    renderContactDetail();
    expect(screen.queryByText("Pipeline Stage")).not.toBeInTheDocument();
  });

  it("does not render AI summary when missing", () => {
    const detailNoSummary = {
      ...mockDetail,
      contact: {
        ...mockDetail.contact,
        aiSummary: undefined,
      },
    };
    mockUseQuery.mockReturnValue(detailNoSummary);
    renderContactDetail();
    expect(screen.queryByText("AI Summary")).not.toBeInTheDocument();
  });

  it("does not render custom fields section when empty", () => {
    const detailNoFields = {
      ...mockDetail,
      contact: {
        ...mockDetail.contact,
        customFields: {},
      },
    };
    mockUseQuery.mockReturnValue(detailNoFields);
    renderContactDetail();
    expect(screen.queryByText("Custom Fields")).not.toBeInTheDocument();
  });

  it("shows empty messages state when no messages", () => {
    const detailNoMessages = {
      ...mockDetail,
      messages: [],
    };
    mockUseQuery.mockReturnValue(detailNoMessages);
    renderContactDetail();
    expect(
      screen.getByText("No messages yet with this contact"),
    ).toBeInTheDocument();
  });
});
