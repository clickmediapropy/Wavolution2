import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaUpload } from "@/components/MediaUpload";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue("https://upload.url"),
}));

describe("MediaUpload", () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders file input", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);
    expect(screen.getByLabelText(/attach media/i)).toBeInTheDocument();
  });

  it("shows accepted file types hint", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);
    expect(screen.getByText(/images, videos, audio, documents/i)).toBeInTheDocument();
  });

  it("shows file name after selection", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
  });

  it("shows error for oversized files (>16MB)", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 17 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it("allows removing selected file", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(screen.queryByText("photo.jpg")).not.toBeInTheDocument();
  });
});
