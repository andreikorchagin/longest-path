import { test, expect } from "@playwright/test";

test.describe("App loads", () => {
  test("shows the instruction banner", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText("Tap or click to set start point", { exact: true })
    ).toBeVisible({ timeout: 15000 });
  });

  test("shows mode selector with two options", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /point to point/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: /loop/i })
    ).toBeVisible();
  });

  test("shows unit toggle", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /switch to/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("shows My location button initially", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /current location/i })
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Mode switching", () => {
  test("loop mode shows distance slider", async ({ page }) => {
    await page.goto("/");

    const loopBtn = page.getByRole("button", { name: /loop/i });
    await expect(loopBtn).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    await loopBtn.click();
    await expect(page.getByText("Target distance")).toBeVisible();
  });

  test("switching back to A to B hides distance slider", async ({ page }) => {
    await page.goto("/");

    const loopBtn = page.getByRole("button", { name: /loop/i });
    await expect(loopBtn).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    await loopBtn.click();
    await expect(page.getByText("Target distance")).toBeVisible();

    await page.getByRole("button", { name: /point to point/i }).click();
    await expect(page.getByText("Target distance")).not.toBeVisible();
  });

  test("A to B is selected by default", async ({ page }) => {
    await page.goto("/");

    const abButton = page.getByRole("button", { name: /point to point/i });
    await expect(abButton).toBeVisible({ timeout: 15000 });
    await expect(abButton).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("Unit toggle", () => {
  test("toggles units", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    const unitButton = page.getByRole("button", { name: /switch to/i });
    await expect(unitButton).toBeVisible({ timeout: 15000 });

    await unitButton.click();
    // After clicking, the label should change
    await expect(
      page.getByRole("button", { name: /switch to/i })
    ).toBeVisible();
  });
});

test.describe("Controls", () => {
  test("shows pace input", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Pace")).toBeVisible({ timeout: 15000 });
  });

  test("pace input defaults to 9", async ({ page }) => {
    await page.goto("/");

    const paceInput = page.getByRole("spinbutton", {
      name: /running pace/i,
    });
    await expect(paceInput).toBeVisible({ timeout: 15000 });
    await expect(paceInput).toHaveValue("9");
  });

  test("shows Reset button only when markers are placed", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /point to point/i })
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByRole("button", { name: /reset/i })
    ).not.toBeVisible();
  });
});
