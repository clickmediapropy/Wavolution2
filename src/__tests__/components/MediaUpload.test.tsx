import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MediaUpload } from "@/components/MediaUpload";

const mockGenerateUploadUrl = vi.fn().mockResolvedValue("https://upload.url");

vi.mock("convex/react", () => ({
  useMutation: () => mockGenerateUploadUrl,
}));

describe("MediaUpload", () => {
  const mockOnUpload = vi.fn();
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ storageId: "storage-123" }),
    });
    // Mock URL.createObjectURL / revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => "blob:test-thumbnail-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders drop zone with drag-drop prompt", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);
    expect(
      screen.getByText(/drag & drop files here or click to browse/i),
    ).toBeInTheDocument();
  });

  it("renders file input (hidden)", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);
    expect(screen.getByLabelText(/attach media/i)).toBeInTheDocument();
  });

  it("shows file name after selection and auto-uploads", async () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();

    // Auto-upload should trigger
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          storageId: "storage-123",
          mediaType: "image",
          fileName: "photo.jpg",
        }),
      );
    });
  });

  it("shows error for oversized files (>16MB)", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 17 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it("allows removing selected file", async () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(screen.queryByText("photo.jpg")).not.toBeInTheDocument();
  });

  it("shows image thumbnail for image files", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["img"], "cat.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    const thumbnail = screen.getByRole("img", { name: /thumbnail/i });
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute("src", "blob:test-thumbnail-url");
  });

  it("cleans up object URL on file removal", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["img"], "cat.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-thumbnail-url");
  });

  it("adds visual feedback on drag-over", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByRole("button");
    fireEvent.dragEnter(dropZone);

    expect(dropZone.className).toContain("border-emerald-500");
  });

  it("handles file drop and triggers upload", async () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByRole("button");
    const file = new File(["test"], "doc.pdf", {
      type: "application/pdf",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByText("doc.pdf")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          storageId: "storage-123",
          mediaType: "document",
          fileName: "doc.pdf",
        }),
      );
    });
  });
});
