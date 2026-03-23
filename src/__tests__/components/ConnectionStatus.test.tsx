import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
});
