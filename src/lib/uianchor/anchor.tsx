"use client";

import { forwardRef } from "react";
import type { UiId } from "./types";
import { assertValidUiId } from "./validate";

// The `ui` prop is the UIAnchor identity (mapped to data-ui in DOM).
// Native HTML `id` is kept separate for a11y/labels.
// Deviation from original proposal: proposal used `id` for contract;
// we use `ui` to avoid clobbering HTML `id`.

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "data-ui"> & {
  ui: UiId;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function AnchorButton(
  { ui, ...props },
  ref
) {
  assertValidUiId(ui);
  return <button {...props} ref={ref} data-ui={ui} />;
});
Button.displayName = "Anchor.Button";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "data-ui"> & {
  ui: UiId;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function AnchorInput(
  { ui, ...props },
  ref
) {
  assertValidUiId(ui);
  return <input {...props} ref={ref} data-ui={ui} />;
});
Input.displayName = "Anchor.Input";

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "data-ui"> & {
  ui: UiId;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function AnchorSelect(
  { ui, ...props },
  ref
) {
  assertValidUiId(ui);
  return <select {...props} ref={ref} data-ui={ui} />;
});
Select.displayName = "Anchor.Select";

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "data-ui" | "href"> & {
  ui: UiId;
  href: string;
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function AnchorLink(
  { ui, href, ...props },
  ref
) {
  assertValidUiId(ui);
  return <a {...props} ref={ref} href={href} data-ui={ui} />;
});
Link.displayName = "Anchor.Link";

export const Anchor = {
  Button,
  Input,
  Select,
  Link,
};