import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatsCard } from "@/components/StatsCard";
import { Users } from "lucide-react";

vi.mock("react-countup", () => ({
  default: ({ end }: { end: number }) => <span>{end}</span>,
}));

describe("StatsCard", () => {
  it("renders label and value", () => {
    render(
      <StatsCard
        icon={<Users data-testid="icon" />}
        iconBg="bg-blue-500/10"
        label="Total Contacts"
        value={42}
      />,
    );

    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
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
