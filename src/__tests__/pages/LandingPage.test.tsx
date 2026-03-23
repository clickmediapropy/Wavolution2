import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";

describe("LandingPage", () => {
  it("renders hero heading", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/at Scale/)).toBeInTheDocument();
  });

  it("renders sign in CTA", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const signInLink = screen.getByText("Sign In");
    expect(signInLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("renders create account link", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const createLink = screen.getByText("Create Account");
    expect(createLink.closest("a")).toHaveAttribute("href", "/register");
  });

  it("renders value propositions", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Contact Management")).toBeInTheDocument();
    expect(screen.getByText("Direct Messaging")).toBeInTheDocument();
    expect(screen.getByText("Bulk Campaigns")).toBeInTheDocument();
  });
});
