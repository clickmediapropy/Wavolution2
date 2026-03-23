import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QuickActions } from "@/components/QuickActions";

describe("QuickActions", () => {
  it("renders all action links", () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );

    expect(screen.getByText("Send Message")).toBeInTheDocument();
    expect(screen.getByText("New Campaign")).toBeInTheDocument();
    expect(screen.getByText("Manage Contacts")).toBeInTheDocument();
    expect(screen.getByText("Import CSV")).toBeInTheDocument();
  });

  it("links point to correct routes", () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );

    expect(screen.getByText("Send Message").closest("a")).toHaveAttribute(
      "href",
      "/send",
    );
    expect(screen.getByText("New Campaign").closest("a")).toHaveAttribute(
      "href",
      "/campaigns/new",
    );
    expect(screen.getByText("Manage Contacts").closest("a")).toHaveAttribute(
      "href",
      "/contacts",
    );
  });

  it("renders heading", () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });
});
