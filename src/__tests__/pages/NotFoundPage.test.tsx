import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "@/pages/NotFoundPage";

describe("NotFoundPage", () => {
  it("renders 404 heading", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /404/i }),
    ).toBeInTheDocument();
  });

  it("renders friendly message", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/this page doesn't exist/i),
    ).toBeInTheDocument();
  });

  it("renders Go Home link", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const link = screen.getByText("Go Home");
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });
});
