import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { UploadContactsPage } from "@/pages/UploadContactsPage";

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: () => [],
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}));

describe("UploadContactsPage", () => {
  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/contacts/upload"]}>
        <UploadContactsPage />
      </MemoryRouter>,
    );
  }

  it("renders page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /upload contacts/i })).toBeInTheDocument();
  });

  it("renders drag-drop zone with instructional text", () => {
    renderPage();
    expect(screen.getByText(/drag & drop your csv file here/i)).toBeInTheDocument();
  });

  it("renders 'or click to browse' text", () => {
    renderPage();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it("renders back to contacts link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /back to contacts/i })).toBeInTheDocument();
  });

  it("shows import button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("shows CSV format instructions", () => {
    renderPage();
    expect(screen.getByText(/CSV Format/i)).toBeInTheDocument();
  });

  it("has a hidden file input accepting csv", () => {
    renderPage();
    const fileInput = screen.getByLabelText(/csv file input/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", ".csv");
  });
});
