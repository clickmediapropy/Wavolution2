import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

describe("AppLayout", () => {
  it("renders navbar with app name", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>child content</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Message Hub")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>test child content</div>
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("test child content")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>child</div>
        </AppLayout>
      </MemoryRouter>
    );

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent("Message Hub");
  });
});
