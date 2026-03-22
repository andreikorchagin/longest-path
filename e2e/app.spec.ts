import { test, expect } from "@playwright/test";

test.describe("App loads", () => {
  test("shows the instruction banner", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Tap to set start point")).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows mode selector with A to B and Loop options", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "A to B" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: "Loop" })).toBeVisible();
  });

  test("shows unit toggle", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "mi" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows My location button initially", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "My location" })
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Mode switching", () => {
  test("loop mode shows distance slider", async ({ page }) => {
    await page.goto("/");

    const loopBtn = page.getByRole("button", { name: "Loop" });
    await expect(loopBtn).toBeVisible({ timeout: 15000 });

    // Dismiss any overlays first
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    await loopBtn.click();
    await expect(page.getByText("Target distance")).toBeVisible();
  });

  test("switching back to A to B hides distance slider", async ({ page }) => {
    await page.goto("/");

    const loopBtn = page.getByRole("button", { name: "Loop" });
    await expect(loopBtn).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    await loopBtn.click();
    await expect(page.getByText("Target distance")).toBeVisible();

    await page.getByRole("button", { name: "A to B" }).click();
    await expect(page.getByText("Target distance")).not.toBeVisible();
  });

  test("A to B is selected by default", async ({ page }) => {
    await page.goto("/");

    const abButton = page.getByRole("button", { name: "A to B" });
    await expect(abButton).toBeVisible({ timeout: 15000 });
    await expect(abButton).toHaveClass(/bg-white/);
  });
});

test.describe("Unit toggle", () => {
  test("toggles between mi and km", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    const unitButton = page.getByRole("button", { name: "mi" });
    await expect(unitButton).toBeVisible({ timeout: 15000 });

    await unitButton.click();
    await expect(page.getByRole("button", { name: "km" })).toBeVisible();
  });

  test("toggles back to mi", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });

    await expect(page.getByRole("button", { name: "mi" })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "mi" }).click();
    await expect(page.getByRole("button", { name: "km" })).toBeVisible();

    await page.getByRole("button", { name: "km" }).click();
    await expect(page.getByRole("button", { name: "mi" })).toBeVisible();
  });
});

test.describe("Controls", () => {
  test("shows pace input", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Pace")).toBeVisible({ timeout: 15000 });
  });

  test("shows Reset button when markers are placed but not initially", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "A to B" })).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByRole("button", { name: "Reset" })
    ).not.toBeVisible();
  });
});
