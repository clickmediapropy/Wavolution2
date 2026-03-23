import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DelayConfig } from "@/components/DelayConfig";

describe("DelayConfig", () => {
  it("renders slider and numeric input", () => {
    render(<DelayConfig value={5} onChange={vi.fn()} />);

    expect(
      screen.getByLabelText("Message delay in seconds"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Delay seconds")).toBeInTheDocument();
  });

  it("displays current delay value", () => {
    render(<DelayConfig value={10} onChange={vi.fn()} />);

    const numInput = screen.getByLabelText("Delay seconds") as HTMLInputElement;
    expect(numInput.value).toBe("10");
  });

  it("calls onChange when slider changes", () => {
    const onChange = vi.fn();
    render(<DelayConfig value={5} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Message delay in seconds"), {
      target: { value: "15" },
    });
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it("calls onChange when numeric input changes", () => {
    const onChange = vi.fn();
    render(<DelayConfig value={5} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Delay seconds"), {
      target: { value: "20" },
    });
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("clamps value to min/max bounds", () => {
    const onChange = vi.fn();
    render(<DelayConfig value={5} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Delay seconds"), {
      target: { value: "100" },
    });
    expect(onChange).toHaveBeenCalledWith(60); // MAX_DELAY

    fireEvent.change(screen.getByLabelText("Delay seconds"), {
      target: { value: "0" },
    });
    expect(onChange).toHaveBeenCalledWith(1); // MIN_DELAY
  });

  it("shows descriptive text with current value", () => {
    render(<DelayConfig value={5} onChange={vi.fn()} />);

    expect(screen.getByText(/wait 5 seconds/i)).toBeInTheDocument();
  });

  it("handles singular 'second' for value of 1", () => {
    render(<DelayConfig value={1} onChange={vi.fn()} />);

    expect(screen.getByText(/wait 1 second between/i)).toBeInTheDocument();
  });
});
