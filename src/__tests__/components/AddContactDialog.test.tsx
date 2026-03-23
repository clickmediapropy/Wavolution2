import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddContactDialog } from "@/components/AddContactDialog";

describe("AddContactDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    error: "",
    isSubmitting: false,
  };

  it("renders form with phone and name inputs when open", () => {
    render(<AddContactDialog {...defaultProps} />);

    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add contact/i })).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<AddContactDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });

  it("calls onSubmit with phone and name on form submit", () => {
    const onSubmit = vi.fn();
    render(<AddContactDialog {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "+1234567890" } });
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

    expect(onSubmit).toHaveBeenCalledWith({ phone: "+1234567890", name: "Alice" });
  });

  it("shows error state when error prop is set", () => {
    render(<AddContactDialog {...defaultProps} error="Phone already exists" />);

    expect(screen.getByText("Phone already exists")).toBeInTheDocument();
  });

  it("calls onClose when cancel clicked", () => {
    const onClose = vi.fn();
    render(<AddContactDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables submit button when isSubmitting is true", () => {
    render(<AddContactDialog {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
  });
});
