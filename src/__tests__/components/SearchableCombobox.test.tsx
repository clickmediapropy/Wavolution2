import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/SearchableCombobox";

const options: ComboboxOption[] = [
  { value: "1", label: "Alice" },
  { value: "2", label: "Bob" },
  { value: "3", label: "Charlie" },
];

function renderCombobox(props: Partial<React.ComponentProps<typeof SearchableCombobox>> = {}) {
  const onChange = props.onChange ?? (() => {});
  return render(
    <SearchableCombobox
      options={options}
      value=""
      onChange={onChange}
      placeholder="Search contacts..."
      {...props}
    />,
  );
}

describe("SearchableCombobox", () => {
  it("renders with placeholder text", () => {
    renderCombobox();
    expect(screen.getByPlaceholderText("Search contacts...")).toBeInTheDocument();
  });

  it("has role=combobox attribute", () => {
    renderCombobox();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows options on focus", () => {
    renderCombobox();
    fireEvent.focus(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters options when typing", () => {
    renderCombobox();
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("selects option on click", () => {
    const onChange = vi.fn();
    renderCombobox({ onChange });
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByText("Bob"));
    expect(onChange).toHaveBeenCalledWith("2");
  });
});
