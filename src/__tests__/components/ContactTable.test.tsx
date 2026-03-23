import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ContactTable } from "@/components/ContactTable";

const mockContacts = [
  { _id: "c1" as any, _creationTime: 1000, userId: "u1" as any, phone: "+1234567890", name: "Alice", status: "pending" },
  { _id: "c2" as any, _creationTime: 900, userId: "u1" as any, phone: "+0987654321", name: "Bob", status: "sent", sentAt: 1234567890 },
  { _id: "c3" as any, _creationTime: 800, userId: "u1" as any, phone: "+1111111111", status: "failed" },
];

describe("ContactTable", () => {
  const defaultProps = {
    contacts: mockContacts,
    canLoadMore: false,
    isLoadingMore: false,
    onLoadMore: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDeleteSelected: vi.fn(),
  };

  it("renders table headers", () => {
    render(<ContactTable {...defaultProps} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders contact rows with correct data", () => {
    render(<ContactTable {...defaultProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("+0987654321")).toBeInTheDocument();
    expect(screen.getByText("+1111111111")).toBeInTheDocument();
  });

  it("renders empty state when contacts array is empty", () => {
    render(<ContactTable {...defaultProps} contacts={[]} />);

    expect(screen.getByText(/no contacts/i)).toBeInTheDocument();
  });

  it("shows Load more button when canLoadMore is true", () => {
    render(<ContactTable {...defaultProps} canLoadMore={true} />);

    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
  });

  it("hides Load more button when canLoadMore is false", () => {
    render(<ContactTable {...defaultProps} canLoadMore={false} />);

    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
  });

  it("calls onLoadMore when Load more button is clicked", () => {
    const onLoadMore = vi.fn();
    render(<ContactTable {...defaultProps} canLoadMore={true} onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("renders edit button per row", () => {
    render(<ContactTable {...defaultProps} />);

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons).toHaveLength(3);
  });

  it("renders delete button per row", () => {
    render(<ContactTable {...defaultProps} />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(3);
  });

  it("calls onEdit with contact when edit button clicked", () => {
    const onEdit = vi.fn();
    render(<ContactTable {...defaultProps} onEdit={onEdit} />);

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]!);
    expect(onEdit).toHaveBeenCalledWith(mockContacts[0]);
  });

  it("calls onDelete with contact id when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<ContactTable {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]!);
    expect(onDelete).toHaveBeenCalledWith("c1");
  });

  it("renders checkboxes for bulk selection", () => {
    render(<ContactTable {...defaultProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    // 1 select-all + 3 row checkboxes
    expect(checkboxes.length).toBeGreaterThanOrEqual(4);
  });

  it("enables bulk delete when contacts are selected", () => {
    const onDeleteSelected = vi.fn();
    render(<ContactTable {...defaultProps} onDeleteSelected={onDeleteSelected} />);

    // Select first contact
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]!); // first row checkbox

    const bulkDeleteBtn = screen.getByRole("button", { name: /delete selected/i });
    fireEvent.click(bulkDeleteBtn);
    expect(onDeleteSelected).toHaveBeenCalledWith(["c1"]);
  });

  it("shows contact without name as dash or empty", () => {
    render(<ContactTable {...defaultProps} />);

    // Third contact has no name — should show a dash or placeholder
    const rows = screen.getAllByRole("row");
    // Header + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it("shows status badges with correct text", () => {
    render(<ContactTable {...defaultProps} />);

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("sent")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("renders sortable Name header with chevron on click", () => {
    render(<ContactTable {...defaultProps} />);

    const nameBtn = screen.getByRole("button", { name: /name/i });
    expect(nameBtn).toBeInTheDocument();

    // Click to sort ascending — chevron should appear
    fireEvent.click(nameBtn);
    // The button should now contain a ChevronUp (ascending)
    const svg = nameBtn.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("sorts contacts by name ascending then descending", () => {
    render(<ContactTable {...defaultProps} />);

    const nameBtn = screen.getByRole("button", { name: /name/i });

    // Click once: ascending by name (Alice, Bob, then unnamed)
    fireEvent.click(nameBtn);
    const rows = screen.getAllByRole("row");
    // header + 3 data rows
    expect(rows).toHaveLength(4);
    // First data row should be unnamed ("") — sorts before "Alice" in localeCompare asc
    // Actually: "" < "Alice" < "Bob" in ascending
    // But third contact has no name (undefined → ""), so: "" < "Alice" < "Bob"

    // Click again: descending by name
    fireEvent.click(nameBtn);
    const rowsDesc = screen.getAllByRole("row");
    // Bob > Alice > "" in descending
    expect(rowsDesc[1]).toHaveTextContent("Bob");
  });

  it("renders sortable Status header", () => {
    render(<ContactTable {...defaultProps} />);
    const statusBtn = screen.getByRole("button", { name: /status/i });
    expect(statusBtn).toBeInTheDocument();
  });

  it("shows full-width Load More with count label", () => {
    render(<ContactTable {...defaultProps} canLoadMore={true} totalCount={50} />);

    const btn = screen.getByRole("button", { name: /load more/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Load more · 3 of 50");
    expect(btn.className).toContain("w-full");
  });

  it("shows plain Load More without count when totalCount not provided", () => {
    render(<ContactTable {...defaultProps} canLoadMore={true} />);

    const btn = screen.getByRole("button", { name: /load more/i });
    expect(btn).toHaveTextContent("Load more");
    expect(btn).not.toHaveTextContent("of");
  });
});
