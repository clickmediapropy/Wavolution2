import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ContactFormDialog } from "@/components/ContactFormDialog";

describe("ContactFormDialog", () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    error: "",
    isSubmitting: false,
  };

  describe("add mode (no contact prop)", () => {
    it("renders with 'Add Contact' title and empty fields", () => {
      render(<ContactFormDialog {...baseProps} />);

      expect(
        screen.getByRole("heading", { name: "Add Contact" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toHaveValue("");
      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByLabelText("Last Name")).toHaveValue("");
      expect(
        screen.getByRole("button", { name: /add contact/i }),
      ).toBeInTheDocument();
    });

    it("calls onSubmit without id field", () => {
      const onSubmit = vi.fn();
      render(<ContactFormDialog {...baseProps} onSubmit={onSubmit} />);

      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "+595981123456" },
      });
      fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "Carlos" },
      });
      fireEvent.change(screen.getByLabelText("Last Name"), {
        target: { value: "Lopez" },
      });
      fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        phone: "+595981123456",
        firstName: "Carlos",
        lastName: "Lopez",
      });
      // Verify no id property at all
      expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty("id");
    });

    it("shows 'Adding...' when submitting", () => {
      render(<ContactFormDialog {...baseProps} isSubmitting={true} />);

      expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
    });
  });

  describe("edit mode (with contact prop)", () => {
    const contact = { _id: "c1", phone: "+1234567890", firstName: "Alice", lastName: "Smith" };

    it("renders with 'Edit Contact' title and pre-filled fields", () => {
      render(<ContactFormDialog {...baseProps} contact={contact} />);

      expect(screen.getByText("Edit Contact")).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toHaveValue("+1234567890");
      expect(screen.getByLabelText("Name")).toHaveValue("Alice");
      expect(screen.getByLabelText("Last Name")).toHaveValue("Smith");
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument();
    });

    it("calls onSubmit with id from contact", () => {
      const onSubmit = vi.fn();
      render(
        <ContactFormDialog {...baseProps} onSubmit={onSubmit} contact={contact} />,
      );

      fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "Alice Updated" },
      });
      fireEvent.change(screen.getByLabelText("Last Name"), {
        target: { value: "Smith Updated" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        id: "c1",
        phone: "+1234567890",
        firstName: "Alice Updated",
        lastName: "Smith Updated",
      });
    });

    it("shows 'Saving...' when submitting", () => {
      render(
        <ContactFormDialog {...baseProps} isSubmitting={true} contact={contact} />,
      );

      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });

    it("handles contact with no name", () => {
      const noNameContact = { _id: "c2", phone: "+9876543210" };
      render(<ContactFormDialog {...baseProps} contact={noNameContact} />);

      expect(screen.getByLabelText(/phone/i)).toHaveValue("+9876543210");
      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByLabelText("Last Name")).toHaveValue("");
    });
  });

  describe("shared behavior", () => {
    it("does not render when isOpen is false", () => {
      render(<ContactFormDialog {...baseProps} isOpen={false} />);

      expect(screen.queryByText("Add Contact")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    });

    it("shows error when error prop is set", () => {
      render(
        <ContactFormDialog {...baseProps} error="Phone already exists" />,
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Phone already exists",
      );
    });

    it("shows phone format hint", () => {
      render(<ContactFormDialog {...baseProps} />);

      expect(
        screen.getByText(/format: \+country code \+ number/i),
      ).toBeInTheDocument();
    });

    it("calls onClose when cancel clicked", () => {
      const onClose = vi.fn();
      render(<ContactFormDialog {...baseProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when X button clicked", () => {
      const onClose = vi.fn();
      render(<ContactFormDialog {...baseProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole("button", { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
