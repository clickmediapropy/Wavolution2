import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import { StepIndicator } from "@/components/StepIndicator";

const steps = [
  { label: "Create Instance" },
  { label: "Scan QR Code" },
  { label: "Start Messaging" },
];

describe("StepIndicator", () => {
  it("renders all step labels", () => {
    render(<StepIndicator steps={steps} currentStep={0} />);

    expect(screen.getByText("Create Instance")).toBeInTheDocument();
    expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
    expect(screen.getByText("Start Messaging")).toBeInTheDocument();
  });

  it("marks the current step with aria-current='step'", () => {
    render(<StepIndicator steps={steps} currentStep={1} />);

    const items = screen.getAllByRole("listitem");
    expect(items[1]).toHaveAttribute("aria-current", "step");
  });

  it("does not set aria-current on inactive steps", () => {
    render(<StepIndicator steps={steps} currentStep={1} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  it("shows checkmark on completed steps", () => {
    render(<StepIndicator steps={steps} currentStep={2} />);

    // Steps 0 and 1 are completed — they should show a checkmark (Completed label)
    const completedIcons = screen.getAllByLabelText("Completed");
    expect(completedIcons).toHaveLength(2);
  });

  it("shows step numbers on non-completed steps", () => {
    render(<StepIndicator steps={steps} currentStep={0} />);

    // Step 1 = "1", Step 2 = "2", Step 3 = "3"
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
