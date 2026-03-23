import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { WhatsAppGuard } from "@/components/WhatsAppGuard";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

function ProtectedContent() {
  return <p>Protected content</p>;
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/send"]}>
      <Routes>
        <Route
          path="/send"
          element={
            <WhatsAppGuard>
              <ProtectedContent />
            </WhatsAppGuard>
          }
        />
        <Route path="/whatsapp" element={<p>WhatsApp Page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WhatsAppGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading while instances query is loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    renderGuard();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to /whatsapp when no connected instances", () => {
    mockUseQuery.mockReturnValue([]);
    renderGuard();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(screen.getByText("WhatsApp Page")).toBeInTheDocument();
  });

  it("renders children when connected instances exist", () => {
    mockUseQuery.mockReturnValue([
      { _id: "inst1", name: "hub_abc", whatsappConnected: true },
    ]);
    renderGuard();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects when instances array is empty", () => {
    mockUseQuery.mockReturnValue([]);
    renderGuard();
    expect(screen.getByText("WhatsApp Page")).toBeInTheDocument();
  });
});
