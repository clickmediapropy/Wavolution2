import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import { MessagePreview } from "@/components/MessagePreview";

describe("MessagePreview", () => {
  it("shows placeholder when message is empty", () => {
    render(<MessagePreview message="" />);
    expect(
      screen.getByText("Your message preview will appear here"),
    ).toBeInTheDocument();
  });

  it("renders message text in bubble", () => {
    render(<MessagePreview message="Hello there!" />);
    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(
      screen.queryByText("Your message preview will appear here"),
    ).not.toBeInTheDocument();
  });

  it("shows contact name when provided", () => {
    render(<MessagePreview message="Hi" contactName="Alice" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows default contact name when not provided", () => {
    render(<MessagePreview message="Hi" />);
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });
});
