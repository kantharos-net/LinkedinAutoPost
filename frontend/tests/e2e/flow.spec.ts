import { test, expect } from "@playwright/test";

test.describe("LinkedIn AutoPoster", () => {
  test("draft to schedule flow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Composer" }).click();
    await page.getByLabel("Title").fill("Playwright Demo Post");
    await page.getByLabel("Generation brief").fill(
      "We hosted a hands-on demo about automated social media posting and would love to recap the highlights."
    );
    await page.getByRole("button", { name: "Generate with GPT" }).click();
    await expect(page.getByText("Generating...")).toBeVisible();
    // Assume mocked response fills textarea.
    await page.getByLabel("Post content").fill("This is generated content");
    await page.getByLabel("Schedule for").fill("2030-01-01T10:00");
    await page.getByRole("button", { name: "Schedule" }).click();
    await expect(page.getByText("Post scheduled")).toBeVisible();
    await page.getByRole("link", { name: "Scheduler" }).click();
    await expect(page.getByText("Playwright Demo Post")).toBeVisible();
  });

  test("retry failed job and search history", async ({ page }) => {
    await page.goto("/jobs");
    const failedRow = page.getByRole("row", { name: /failed/i }).first();
    await failedRow.click();
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Retry triggered")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("link", { name: "History" }).click();
    await page.getByPlaceholder("Search").fill("launch");
    await expect(page.getByRole("cell", { name: /launch/i })).toBeVisible();
  });
});
