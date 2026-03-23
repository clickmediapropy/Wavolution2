import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
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

  it("renders Get Started CTA linking to register", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const getStartedLink = screen.getByText("Get Started Free");
    expect(getStartedLink.closest("a")).toHaveAttribute("href", "/register");
  });

  it("renders Watch Demo link to login", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const demoLink = screen.getByText("Watch Demo");
    expect(demoLink.closest("a")).toHaveAttribute("href", "/login");
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
