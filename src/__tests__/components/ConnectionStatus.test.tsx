import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ConnectionStatus } from "@/components/ConnectionStatus";

describe("ConnectionStatus", () => {
  it("shows 'Connected' when connected", () => {
    render(<ConnectionStatus connected={true} />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows 'Disconnected' when not connected", () => {
    render(<ConnectionStatus connected={false} />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("shows WhatsApp label", () => {
    render(<ConnectionStatus connected={true} />);

    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
  });

  it("wraps card in a link when href is provided", () => {
    render(
      <MemoryRouter>
        <ConnectionStatus connected={true} href="/whatsapp" />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/whatsapp");
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("does not render a link when href is not provided", () => {
    render(<ConnectionStatus connected={true} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
