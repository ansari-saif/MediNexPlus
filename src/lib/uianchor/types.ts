import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import type { UIAnchorId } from "./ids.generated";

/**
 * Stable UIAnchor identity.
 * Prefer generated UIAnchorId literals; string kept for dynamic uiPrefix templates.
 */
export type UiId = UIAnchorId | (string & {});

export type { UIAnchorId };

export type WithUiId<T> = T & {
  /** Stable UIAnchor identity → data-ui */
  ui: UiId;
};

export type AnchorButtonProps = WithUiId<ButtonHTMLAttributes<HTMLButtonElement>>;

export type AnchorInputProps = WithUiId<InputHTMLAttributes<HTMLInputElement>>;

export type AnchorSelectProps = WithUiId<SelectHTMLAttributes<HTMLSelectElement>>;

export type AnchorLinkProps = WithUiId<AnchorHTMLAttributes<HTMLAnchorElement>>;
