import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardPage } from "@/pages/DashboardPage";

describe("DashboardPage", () => {
  it("renders page heading", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders welcome text", () => {
    render(<DashboardPage />);

    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
