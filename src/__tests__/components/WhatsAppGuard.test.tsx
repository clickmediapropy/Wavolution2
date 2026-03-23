import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { WhatsAppGuard } from "@/components/WhatsAppGuard";

const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

describe("WhatsAppGuard", () => {
  it("shows loading while user data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to /whatsapp/setup when no instance created", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: false,
      whatsappConnected: false,
    });

    render(
      <MemoryRouter initialEntries={["/send"]}>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
  });

  it("redirects to /whatsapp/connect when instance created but not connected", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: false,
    });

    render(
      <MemoryRouter initialEntries={["/send"]}>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
  });

  it("renders children when WhatsApp is connected", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: true,
    });

    render(
      <MemoryRouter>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("messaging content")).toBeInTheDocument();
  });

  it("treats null user as needing setup", () => {
    mockUseQuery.mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/send"]}>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
  });
});
