import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { PipelinePage } from "@/pages/PipelinePage";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
}));

const mockStages = [
  {
    _id: "stage1",
    userId: "user1",
    name: "New Lead",
    color: "#10b981",
    position: 0,
  },
  {
    _id: "stage2",
    userId: "user1",
    name: "Qualified",
    color: "#3b82f6",
    position: 1,
  },
  {
    _id: "stage3",
    userId: "user1",
    name: "Won",
    color: "#f59e0b",
    position: 2,
  },
];

const mockContacts = [
  {
    _id: "c1",
    phone: "+1111111111",
    firstName: "Alice",
    lastName: "Smith",
    tags: ["hot", "demo"],
    engagementScore: 85,
    pipelineStageId: "stage1",
  },
  {
    _id: "c2",
    phone: "+2222222222",
    firstName: "Bob",
    lastName: "Jones",
    tags: [],
    engagementScore: 30,
    pipelineStageId: "stage2",
  },
  {
    _id: "c3",
    phone: "+3333333333",
    firstName: "Charlie",
    lastName: undefined,
    tags: ["new"],
    pipelineStageId: undefined, // unassigned
  },
];

function renderPipeline() {
  return render(
    <MemoryRouter>
      <PipelinePage />
    </MemoryRouter>,
  );
}

// PipelinePage calls useQuery twice:
// 1. pipeline.listStages
// 2. contacts.exportAll
function setupMock(
  stages = mockStages as unknown[] | undefined,
  contacts = mockContacts as unknown[] | undefined,
) {
  let callIndex = 0;
  mockUseQuery.mockImplementation(() => {
    const i = callIndex % 2;
    callIndex++;
    if (i === 0) return stages;
    if (i === 1) return contacts;
    return undefined;
  });
  mockUseMutation.mockReturnValue(vi.fn());
}

describe("PipelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  // --- Loading state ---

  it("shows loading spinner when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderPipeline();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  // --- Empty state ---

  it("shows empty state when no stages exist", () => {
    setupMock([], mockContacts);
    renderPipeline();
    expect(screen.getByText("No pipeline stages yet")).toBeInTheDocument();
    expect(screen.getByText("Create first stage")).toBeInTheDocument();
  });

  // --- Normal rendering ---

  it("renders the Pipeline heading", () => {
    renderPipeline();
    // The h1 uses text-h2 class but contains "Pipeline"
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
  });

  it("renders stage column headers", () => {
    renderPipeline();
    expect(screen.getByText("New Lead")).toBeInTheDocument();
    expect(screen.getByText("Qualified")).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
  });

  it("renders Unassigned column", () => {
    renderPipeline();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders contact names in correct stage columns", () => {
    renderPipeline();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders contact phone numbers", () => {
    renderPipeline();
    expect(screen.getByText("+1111111111")).toBeInTheDocument();
    expect(screen.getByText("+2222222222")).toBeInTheDocument();
  });

  it("renders contact tags", () => {
    renderPipeline();
    expect(screen.getByText("hot")).toBeInTheDocument();
    expect(screen.getByText("demo")).toBeInTheDocument();
    expect(screen.getByText("new")).toBeInTheDocument();
  });

  it("renders engagement score badges", () => {
    renderPipeline();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders stage contact counts in headers", () => {
    renderPipeline();
    // Each stage column header shows a count badge — look for count spans within the specific structure
    // New Lead: 1, Qualified: 1, Won: 0, Unassigned: 1
    // We check that count badges exist (the text-xs bg-zinc-800 spans)
    const countBadges = document.querySelectorAll(".bg-zinc-800.rounded-full");
    expect(countBadges.length).toBeGreaterThanOrEqual(3); // at least the stage columns
  });

  it("shows Add Stage button", () => {
    renderPipeline();
    expect(screen.getByText("Add Stage")).toBeInTheDocument();
  });

  it("shows summary text with total contacts and stages", () => {
    renderPipeline();
    expect(screen.getByText(/3 contacts across 3 stages/i)).toBeInTheDocument();
  });

  // --- Create stage dialog ---

  it("opens create stage dialog when Add Stage is clicked", () => {
    renderPipeline();
    fireEvent.click(screen.getByText("Add Stage"));
    expect(screen.getByText("New Pipeline Stage")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Stage name..."),
    ).toBeInTheDocument();
  });

  it("shows Create and Cancel buttons in dialog", () => {
    renderPipeline();
    fireEvent.click(screen.getByText("Add Stage"));
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("closes dialog when Cancel is clicked", () => {
    renderPipeline();
    fireEvent.click(screen.getByText("Add Stage"));
    expect(screen.getByText("New Pipeline Stage")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByText("New Pipeline Stage"),
    ).not.toBeInTheDocument();
  });

  it("disables Create button when stage name is empty", () => {
    renderPipeline();
    fireEvent.click(screen.getByText("Add Stage"));
    const createBtn = screen.getByText("Create");
    expect(createBtn).toBeDisabled();
  });

  it("enables Create button when stage name is entered", () => {
    renderPipeline();
    fireEvent.click(screen.getByText("Add Stage"));
    const input = screen.getByPlaceholderText("Stage name...");
    fireEvent.change(input, { target: { value: "Closed" } });
    const createBtn = screen.getByText("Create");
    expect(createBtn).not.toBeDisabled();
  });

  // --- Empty stage shows drop message ---

  it("shows 'Drop contacts here' for empty stages", () => {
    renderPipeline();
    const dropMessages = screen.getAllByText("Drop contacts here");
    // Won stage has 0 contacts
    expect(dropMessages.length).toBeGreaterThanOrEqual(1);
  });

  // --- Empty state create button ---

  it("opens create dialog from empty state", () => {
    setupMock([], mockContacts);
    renderPipeline();
    fireEvent.click(screen.getByText("Create first stage"));
    expect(screen.getByText("New Pipeline Stage")).toBeInTheDocument();
  });

  // --- Contact cards are draggable ---

  it("renders contact cards as draggable", () => {
    renderPipeline();
    const draggables = document.querySelectorAll("[draggable='true']");
    expect(draggables.length).toBe(3); // 3 contacts
  });
});
