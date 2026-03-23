import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { BotConfigPage } from "@/pages/BotConfigPage";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
}));

const mockInstances = [
  {
    _id: "inst1",
    _creationTime: Date.now(),
    userId: "user1",
    name: "my-instance",
    apiKey: "key123",
    whatsappConnected: true,
    whatsappNumber: "+1234567890",
    connectionStatus: "open",
    botEnabled: true,
    botSystemPrompt: "You are a helpful assistant.",
  },
  {
    _id: "inst2",
    _creationTime: Date.now(),
    userId: "user1",
    name: "second-instance",
    apiKey: "key456",
    whatsappConnected: false,
    connectionStatus: "close",
    botEnabled: false,
    botSystemPrompt: "",
  },
];

function renderBotConfig() {
  return render(
    <MemoryRouter>
      <BotConfigPage />
    </MemoryRouter>,
  );
}

describe("BotConfigPage", () => {
  const mockMutationFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(mockInstances);
    mockUseMutation.mockReturnValue(mockMutationFn);
    mockMutationFn.mockResolvedValue(undefined);
  });

  it("renders the page heading", () => {
    renderBotConfig();
    expect(
      screen.getByRole("heading", { name: /bot configuration/i }),
    ).toBeInTheDocument();
  });

  it("renders the info banner about bot behavior", () => {
    renderBotConfig();
    expect(
      screen.getByText(/incoming messages are automatically replied/i),
    ).toBeInTheDocument();
  });

  it("renders instance cards with names", () => {
    renderBotConfig();
    expect(screen.getByText("my-instance")).toBeInTheDocument();
    expect(screen.getByText("second-instance")).toBeInTheDocument();
  });

  it("shows connected status for connected instances", () => {
    renderBotConfig();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("shows whatsapp number when available", () => {
    renderBotConfig();
    expect(screen.getByText(/\+1234567890/)).toBeInTheDocument();
  });

  it("shows Active label for enabled bots", () => {
    renderBotConfig();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("renders toggle buttons with correct aria labels", () => {
    renderBotConfig();
    expect(screen.getByLabelText("Disable bot")).toBeInTheDocument();
    expect(screen.getByLabelText("Enable bot")).toBeInTheDocument();
  });

  it("renders system prompt textarea with existing value", () => {
    renderBotConfig();
    const textareas = screen.getAllByPlaceholderText(
      /you are a helpful customer service agent/i,
    );
    expect(textareas[0]).toHaveValue("You are a helpful assistant.");
  });

  it("renders goals section with coming soon label", () => {
    renderBotConfig();
    const comingSoonLabels = screen.getAllByText("Coming soon");
    expect(comingSoonLabels.length).toBeGreaterThanOrEqual(2); // one per instance card
    const goalsHeadings = screen.getAllByText("Goals");
    expect(goalsHeadings.length).toBeGreaterThanOrEqual(1);
  });

  it("renders knowledge base section with coming soon label", () => {
    renderBotConfig();
    const kbHeadings = screen.getAllByText("Knowledge Base");
    expect(kbHeadings.length).toBeGreaterThanOrEqual(1);
    const uploadTexts = screen.getAllByText(/upload documents and text content/i);
    expect(uploadTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders goal names in the goals section", () => {
    renderBotConfig();
    // Each instance card has the same goal list, so use getAllByText
    expect(screen.getAllByText("Human Handover").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Auto Follow-up").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Manage Tags").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Update Lead Score").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Send Notification").length).toBeGreaterThanOrEqual(1);
  });

  it("calls toggle mutation when bot toggle is clicked", async () => {
    renderBotConfig();
    const disableBtn = screen.getByLabelText("Disable bot");
    fireEvent.click(disableBtn);
    expect(mockMutationFn).toHaveBeenCalledWith({
      id: "inst1",
      botEnabled: false,
    });
  });

  it("shows save button when system prompt is edited", () => {
    renderBotConfig();
    const textareas = screen.getAllByPlaceholderText(
      /you are a helpful customer service agent/i,
    );
    fireEvent.change(textareas[0], { target: { value: "New prompt" } });
    expect(screen.getByText("Save Settings")).toBeInTheDocument();
  });

  it("shows empty state when no instances", () => {
    mockUseQuery.mockReturnValue([]);
    renderBotConfig();
    expect(
      screen.getByRole("heading", { name: /no instances yet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/create a whatsapp instance first/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Go to WhatsApp Instances")).toBeInTheDocument();
  });

  it("shows loading spinner when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderBotConfig();
    // The Loader2 component renders as an SVG with animate-spin class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders temperature slider", () => {
    renderBotConfig();
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/temperature/i).length).toBeGreaterThan(0);
  });

  it("renders welcome message input", () => {
    renderBotConfig();
    const inputs = screen.getAllByPlaceholderText(
      /hello! how can i help you today/i,
    );
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders fallback message input", () => {
    renderBotConfig();
    const inputs = screen.getAllByPlaceholderText(
      /i'm sorry, i couldn't understand/i,
    );
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });
});
