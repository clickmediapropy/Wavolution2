import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";

vi.mock("convex/react", () => ({
  useQuery: () => null,
}));

describe("DashboardPage", () => {
  it("renders page heading", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders welcome text", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
