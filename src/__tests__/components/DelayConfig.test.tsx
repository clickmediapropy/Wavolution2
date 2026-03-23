import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vite-plus/test";
import { DelayConfig } from "@/components/DelayConfig";

describe("DelayConfig", () => {
  it("renders label and preset buttons", () => {
    render(<DelayConfig value={5} onChange={vi.fn()} />);

    expect(screen.getByText("Delay Between Messages")).toBeInTheDocument();
    expect(screen.getByText("Fast")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Slow")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("displays current delay value badge", () => {
    render(<DelayConfig value={10} onChange={vi.fn()} />);

    expect(screen.getByText("10s")).toBeInTheDocument();
  });

  it("calls onChange when a preset button is clicked", () => {
    const onChange = vi.fn();
    render(<DelayConfig value={5} onChange={onChange} />);

    fireEvent.click(screen.getByText("Slow"));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("calls onChange when Fast preset is clicked", () => {
    const onChange = vi.fn();
    render(<DelayConfig value={5} onChange={onChange} />);

    fireEvent.click(screen.getByText("Fast"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("shows info text with current value", () => {
    render(<DelayConfig value={5} onChange={vi.fn()} />);

    expect(screen.getByText(/5 second/)).toBeInTheDocument();
    expect(screen.getByText(/delay between each/)).toBeInTheDocument();
  });

  it("shows custom slider when custom mode is selected", () => {
    // value=7 is not a preset, so custom mode is auto-selected
    render(<DelayConfig value={7} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Message delay in seconds")).toBeInTheDocument();
    expect(screen.getByLabelText("Delay seconds")).toBeInTheDocument();
  });

  it("clamps value to min/max bounds in custom mode", () => {
    const onChange = vi.fn();
    // value=7 activates custom mode
    render(<DelayConfig value={7} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Delay seconds"), {
      target: { value: "100" },
    });
    expect(onChange).toHaveBeenCalledWith(60); // MAX_DELAY

    fireEvent.change(screen.getByLabelText("Delay seconds"), {
      target: { value: "0" },
    });
    expect(onChange).toHaveBeenCalledWith(1); // MIN_DELAY
  });
});
