import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vite-plus/test";
import { StatsCard } from "@/components/StatsCard";
import { Users } from "lucide-react";

// Mock the named export (useCountUp) — mirrors real import path, no default export mock
vi.mock("react-countup", () => ({
  useCountUp: ({ ref, end }: { ref: { current: HTMLElement | null }; end: number }) => {
    // Use queueMicrotask so ref.current is attached before we write
    queueMicrotask(() => {
      if (ref.current) ref.current.textContent = String(end);
    });
  },
}));

describe("StatsCard", () => {
  it("renders label and value", async () => {
    render(
      <StatsCard
        icon={<Users data-testid="icon" />}
        iconBg="bg-blue-500/10"
        label="Total Contacts"
        value={42}
      />,
    );

    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
    // useCountUp writes to the ref async via queueMicrotask
    await screen.findByText("42");
  });

  it("renders string values", () => {
    render(
      <StatsCard
        icon={<Users />}
        iconBg="bg-blue-500/10"
        label="Status"
        value="..."
      />,
    );

    expect(screen.getByText("...")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(
      <StatsCard
        icon={<Users data-testid="stats-icon" />}
        iconBg="bg-blue-500/10"
        label="Test"
        value={0}
      />,
    );

    expect(screen.getByTestId("stats-icon")).toBeInTheDocument();
  });
});
