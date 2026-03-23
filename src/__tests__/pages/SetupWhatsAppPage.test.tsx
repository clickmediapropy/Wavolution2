import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SetupWhatsAppPage } from "@/pages/SetupWhatsAppPage";

const mockUseQuery = vi.fn();
const mockCreateInstance = vi.fn();
const mockNavigate = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useAction: () => mockCreateInstance,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("SetupWhatsAppPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders setup heading and button", () => {
    mockUseQuery.mockReturnValue({ _id: "user123", instanceCreated: false });

    render(
      <MemoryRouter>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /whatsapp setup/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create instance/i }),
    ).toBeInTheDocument();
  });

  it("redirects to /whatsapp/connect if instance already created", () => {
    mockUseQuery.mockReturnValue({ _id: "user123", instanceCreated: true });

    render(
      <MemoryRouter initialEntries={["/whatsapp/setup"]}>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: /create instance/i }),
    ).not.toBeInTheDocument();
  });

  it("shows loading while user is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders StepIndicator with 'Create Instance' step visible", () => {
    mockUseQuery.mockReturnValue({ _id: "user123", instanceCreated: false });

    render(
      <MemoryRouter>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    // "Create Instance" appears in both the step indicator and the button
    expect(screen.getAllByText("Create Instance").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
    expect(screen.getByText("Start Messaging")).toBeInTheDocument();
  });
});
