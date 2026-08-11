import { test, expect } from "../fixtures";

test.describe("public site footer", () => {
  test("login shows footer with placeholder # links", async ({ page, ui }) => {
    await page.goto("/login");
    await expect(ui("public.footer")).toBeVisible();
    await expect(ui("public.footer.link.home")).toHaveAttribute("href", "#");
    await expect(ui("public.footer.link.about")).toHaveAttribute("href", "#");
    await expect(ui("public.footer.link.privacy")).toHaveAttribute("href", "#");
  });
});
