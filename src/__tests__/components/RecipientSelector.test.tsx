import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecipientSelector } from "@/components/RecipientSelector";

const mockContacts = [
  { _id: "c1", _creationTime: 1, userId: "u1" as any, phone: "+111", name: "Alice", status: "pending" },
  { _id: "c2", _creationTime: 2, userId: "u1" as any, phone: "+222", name: "Bob", status: "sent" },
  { _id: "c3", _creationTime: 3, userId: "u1" as any, phone: "+333", name: "Carol", status: "pending" },
] as any[];

describe("RecipientSelector", () => {
  it("renders three recipient type options", () => {
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="all"
        onRecipientTypeChange={vi.fn()}
        selectedContactIds={[]}
        onSelectedContactIdsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("All Contacts")).toBeInTheDocument();
    expect(screen.getByText("Pending Only")).toBeInTheDocument();
    expect(screen.getByText("Manual Selection")).toBeInTheDocument();
  });

  it("shows correct count for 'all' type", () => {
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="all"
        onRecipientTypeChange={vi.fn()}
        selectedContactIds={[]}
        onSelectedContactIdsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/recipients selected/)).toBeInTheDocument();
  });

  it("shows correct count for 'pending' type", () => {
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="pending"
        onRecipientTypeChange={vi.fn()}
        selectedContactIds={[]}
        onSelectedContactIdsChange={vi.fn()}
      />,
    );

    // Alice and Carol are pending
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onRecipientTypeChange when clicking an option", () => {
    const onChange = vi.fn();
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="all"
        onRecipientTypeChange={onChange}
        selectedContactIds={[]}
        onSelectedContactIdsChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Manual Selection"));
    expect(onChange).toHaveBeenCalledWith("manual");
  });

  it("shows checkbox list when manual type is selected", () => {
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="manual"
        onRecipientTypeChange={vi.fn()}
        selectedContactIds={[]}
        onSelectedContactIdsChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Search contacts")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("does not show checkbox list for non-manual types", () => {
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="all"
        onRecipientTypeChange={vi.fn()}
        selectedContactIds={[]}
        onSelectedContactIdsChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("toggles contact selection", () => {
    const onSelect = vi.fn();
    render(
      <RecipientSelector
        contacts={mockContacts}
        recipientType="manual"
        onRecipientTypeChange={vi.fn()}
        selectedContactIds={[]}
        onSelectedContactIdsChange={onSelect}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]!);
    expect(onSelect).toHaveBeenCalledWith(["c1"]);
  });
});
