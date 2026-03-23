import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { UploadContactsPage } from "@/pages/UploadContactsPage";

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useMutation: () => vi.fn(),
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

  it("renders file input accepting csv", () => {
    renderPage();
    const fileInput = screen.getByLabelText(/csv file/i) || screen.getByText(/choose/i);
    expect(fileInput).toBeInTheDocument();
  });

  it("renders back to contacts link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /back to contacts/i })).toBeInTheDocument();
  });

  it("shows upload button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("shows CSV format instructions", () => {
    renderPage();
    expect(screen.getByText(/CSV Format/i)).toBeInTheDocument();
  });
});
