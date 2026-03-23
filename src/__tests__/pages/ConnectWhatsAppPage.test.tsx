import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ConnectWhatsAppPage } from "@/pages/ConnectWhatsAppPage";

const mockUseQuery = vi.fn();
const mockAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useAction: () => mockAction,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("ConnectWhatsAppPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAction.mockResolvedValue({ base64: null });
  });

  it("shows loading while user is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to setup if no instance created", () => {
    mockUseQuery.mockReturnValue({ instanceCreated: false });

    render(
      <MemoryRouter initialEntries={["/whatsapp/connect"]}>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: /scan qr code/i }),
    ).not.toBeInTheDocument();
  });

  it("renders QR code heading when instance exists", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: false,
      evolutionInstanceName: "hub_abc12345",
    });

    render(
      <MemoryRouter>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /scan qr code/i }),
    ).toBeInTheDocument();
  });

  it("redirects to /send when already connected", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: true,
      evolutionInstanceName: "hub_abc12345",
    });

    render(
      <MemoryRouter initialEntries={["/whatsapp/connect"]}>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: /scan qr code/i }),
    ).not.toBeInTheDocument();
  });
});
