import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { RegisterPage } from "@/pages/RegisterPage";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock auth hooks
const mockSignIn = vi.fn();
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn, signOut: vi.fn() }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it("renders name, email, password, and confirm password inputs", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
  });

  it("renders Create Account button", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows error when passwords don't match", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls signIn with signUp flow and name on form submit", async () => {
    mockSignIn.mockResolvedValue({ signingIn: true });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("password", {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        flow: "signUp",
      });
    });
  });

  it("shows error message on registration failure", async () => {
    mockSignIn.mockRejectedValue(new Error("Email already in use"));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /^show password$/i });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /^hide password$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^hide password$/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles confirm password visibility", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const confirmInput = screen.getByLabelText(/^confirm password$/i);
    expect(confirmInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /^show confirm password$/i });
    fireEvent.click(toggleButton);

    expect(confirmInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /^hide confirm password$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^hide confirm password$/i }));
    expect(confirmInput).toHaveAttribute("type", "password");
  });

  it("has link to login page", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /sign in|log in|already have/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
