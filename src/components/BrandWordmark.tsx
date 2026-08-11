import styles from "./BrandWordmark.module.css";

type BrandWordmarkProps = {
  variant?: "dark" | "light";
  className?: string;
};

export default function BrandWordmark({
  variant = "dark",
  className,
}: BrandWordmarkProps) {
  return (
    <span
      data-ui="public.brand.wordmark"
      className={[
        styles.wordmark,
        variant === "light" ? styles.light : styles.dark,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      curify
    </span>
  );
}
