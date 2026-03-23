import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vite-plus/test";
import { MessageTemplateEditor } from "@/components/MessageTemplateEditor";

describe("MessageTemplateEditor", () => {
  it("renders textarea with placeholder", () => {
    render(<MessageTemplateEditor value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Message template")).toBeInTheDocument();
  });

  it("shows insert token buttons", () => {
    render(<MessageTemplateEditor value="" onChange={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /insert name token/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert phone token/i }),
    ).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<MessageTemplateEditor value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Message template"), {
      target: { value: "Hello" },
    });
    expect(onChange).toHaveBeenCalledWith("Hello");
  });

  it("inserts name token on button click", () => {
    const onChange = vi.fn();
    render(<MessageTemplateEditor value="Hi " onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: /insert name token/i }),
    );
    // Token is inserted at cursor position (defaults to end)
    expect(onChange).toHaveBeenCalled();
    const call = onChange.mock.calls[0]![0];
    expect(call).toContain("{name}");
  });

  it("shows helper text about placeholders", () => {
    render(<MessageTemplateEditor value="" onChange={vi.fn()} />);

    expect(screen.getByText(/placeholders/)).toBeInTheDocument();
  });
});
