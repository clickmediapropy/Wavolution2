import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditContactDialog } from "@/components/EditContactDialog";

const mockContact = {
  _id: "c1" as any,
  _creationTime: 1000,
  userId: "u1" as any,
  phone: "+1234567890",
  name: "Alice",
  status: "pending",
};

describe("EditContactDialog", () => {
  const defaultProps = {
    isOpen: true,
    contact: mockContact,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    error: "",
    isSubmitting: false,
  };

  it("pre-fills form with contact data", () => {
    render(<EditContactDialog {...defaultProps} />);

    expect(screen.getByLabelText(/phone/i)).toHaveValue("+1234567890");
    expect(screen.getByLabelText(/name/i)).toHaveValue("Alice");
  });

  it("does not render when isOpen is false", () => {
    render(<EditContactDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });

  it("calls onSubmit with updated data", () => {
    const onSubmit = vi.fn();
    render(<EditContactDialog {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Alice Updated" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      id: "c1",
      phone: "+1234567890",
      name: "Alice Updated",
    });
  });

  it("calls onClose when cancel clicked", () => {
    const onClose = vi.fn();
    render(<EditContactDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error state when error prop is set", () => {
    render(<EditContactDialog {...defaultProps} error="Phone already exists" />);

    expect(screen.getByText("Phone already exists")).toBeInTheDocument();
  });
});
