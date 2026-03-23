import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vite-plus/test";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

describe("DeleteConfirmDialog", () => {
  const defaultProps = {
    isOpen: true,
    count: 3,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isDeleting: false,
  };

  it("shows confirmation message with contact count", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /3 contact/i }),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    render(<DeleteConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/3 contact/i)).not.toBeInTheDocument();
  });

  it("shows singular text for 1 contact", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={1} />);

    expect(
      screen.getByRole("heading", { name: /1 contact/i }),
    ).toBeInTheDocument();
  });

  it("shows bulk warning when count > 5", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={8} />);

    expect(
      screen.getByText(/you are about to delete 8 contacts/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/large batch operation/i)).toBeInTheDocument();
  });

  it("does not show bulk warning when count <= 5", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={3} />);

    expect(
      screen.queryByText(/large batch operation/i),
    ).not.toBeInTheDocument();
  });

  it("disables delete button when count > 5 and DELETE not typed", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={10} isOpen={true} />);
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    expect(deleteBtn).toBeDisabled();
  });

  it("enables delete button after typing DELETE for bulk deletes", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={10} isOpen={true} />);
    const input = screen.getByPlaceholderText(/type "DELETE"/i);
    fireEvent.change(input, { target: { value: "DELETE" } });
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    expect(deleteBtn).not.toBeDisabled();
  });

  it("does not require typing for count <= 5", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={3} isOpen={true} />);
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    expect(deleteBtn).not.toBeDisabled();
    expect(
      screen.queryByPlaceholderText(/type "DELETE"/i),
    ).not.toBeInTheDocument();
  });
});
