// The schedule card in the browser: the week and its tooltip, edit mode with a pointer, a finger
// and the keyboard, the one call Done makes, who may edit; and the schedule kind on a poster and a
// tile. The clock is frozen at Sunday 21 June 2026, 12:00 (Berlin); the demo home's heating runs
// 06:00–08:30 and 17:00–22:30 on weekdays (Wednesday also 12:00–13:30), 08:00–12:00 and
// 14:00–22:30 on Sunday (docs/.vitepress/theme/ha-shim/schedules.ts).
import { test, expect, type Locator, type Page } from "@playwright/test";
import { card, mount as mountAt, setAdmin, setLanguage, wsMessages } from "./util.ts";

// noon in Berlin wherever the tests run (the shared frozen time is noon on the runner's clock)
const NOON = new Date("2026-06-21T12:00:00+02:00");
const mount: typeof mountAt = (page, cfg, opts = {}) => mountAt(page, cfg, { time: NOON, ...opts });

const CFG = {
  type: "custom:schedule-card-pro",
  entity: "schedule.heating",
  data: [{ key: "temperature", unit: "°C", step: 0.5, default: 21 }],
};
const lane = (page: Page, day: number) => card(page).locator(".slane").nth(day);
const blocks = (page: Page, day: number) => lane(page, day).locator(".sb[data-id]");
// a point of a lane at a minute of the day
const at = async (l: Locator, min: number) => {
  const b = (await l.boundingBox())!;
  return { x: b.x + (b.width * min) / 1440, y: b.y + b.height / 2, w: b.width };
};
const selected = (page: Page) => card(page).locator('.sb[aria-pressed="true"]');
// a mouse's double press held on an empty spot: it draws a block as it moves
const drawFrom = async (page: Page, p: { x: number; y: number }) => {
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.down();
};
const edit = (page: Page) => card(page).locator('.sctl [data-act="edit"]').click();
const updates = async (page: Page) =>
  (await wsMessages(page)).filter((m) => m.type === "schedule/update");

test.describe("schedule card", () => {
  test("shows the week, today, when it changes next and a block's tooltip", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await expect(card(page).locator(".slane")).toHaveCount(7);
    await expect(card(page).locator(".key.today .s")).toHaveText("Sun");
    await expect(card(page).locator(".header .snext")).toHaveText("from 14:00");
    await expect(lane(page, 6).locator(".snow")).toHaveCount(1);
    const p = await at(lane(page, 0), 1200);
    await page.mouse.move(p.x, p.y);
    await expect(card(page).locator(".wk > .tip")).toHaveText("Mon 17:00 – 22:30 · 21.0 °C");
    await expect(lane(page, 0)).toHaveAttribute("aria-label", /Monday: 06:00 – 08:30 21.0 °C/);
  });

  test("moves a block to another day, merging it, and saves the week in one call", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    const mon = blocks(page, 0).first();
    await mon.click();
    await expect(mon).toHaveAttribute("aria-pressed", "true");
    await expect(card(page).locator(".sbar")).toBeVisible();
    await expect(selected(page)).toHaveCount(1);
    // on the first row the toolbar goes below it: the header's Undo and Done stay free
    const bar = (await card(page).locator(".sbar").boundingBox())!;
    const header = (await card(page).locator(".header").boundingBox())!;
    expect(bar.y).toBeGreaterThanOrEqual(header.y + header.height);
    // down a row and an hour later: onto Tuesday's 06:00–08:30, which it joins
    const from = await at(lane(page, 0), 435);
    const pitch = (await lane(page, 1).boundingBox())!.y - (await lane(page, 0).boundingBox())!.y;
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + from.w / 48, from.y + pitch / 2, { steps: 4 });
    await page.mouse.move(from.x + from.w / 24, from.y + pitch, { steps: 4 });
    await expect(card(page).locator(".sbubble")).toHaveText("Tue 07:00 – 09:30");
    await page.mouse.up();
    await expect(blocks(page, 0)).toHaveCount(1);
    await expect(blocks(page, 1).first()).toHaveAttribute(
      "aria-label",
      "Tuesday, 06:00 to 09:30, 21.0 °C",
    );
    expect(await updates(page)).toHaveLength(0);
    await card(page).locator('.sctl [data-act="done"]').click();
    await expect(card(page).locator(".header .snext")).toHaveText("Saved");
    const sent = await updates(page);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      schedule_id: "heating",
      name: "Heating",
      monday: [{ from: "17:00:00", to: "22:30:00", data: { temperature: 21 } }],
      tuesday: [
        { from: "06:00:00", to: "09:30:00", data: { temperature: 21 } },
        { from: "17:00:00", to: "22:30:00", data: { temperature: 21 } },
      ],
    });
    // the card shows the week Home Assistant now has, out of edit mode
    await expect(card(page).locator(".sb[data-id]")).toHaveCount(0);
    await expect(lane(page, 1).locator(".sb")).toHaveCount(2);
  });

  test("draws a block, changes its end, and Undo takes both back", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    const a = await at(lane(page, 6), 60),
      b = await at(lane(page, 6), 240);
    await drawFrom(page, a);
    await page.mouse.move(b.x, b.y, { steps: 6 });
    await expect(card(page).locator(".sbubble")).toHaveText("01:00 – 04:00");
    await page.mouse.up();
    const drawn = blocks(page, 6).first();
    await expect(drawn).toHaveAttribute("aria-label", "Sunday, 01:00 to 04:00, 21.0 °C");
    await expect(drawn).toHaveAttribute("aria-pressed", "true");
    // its end, an hour later
    const knob = lane(page, 6).locator('.sknob[data-act="to"]');
    const k = (await knob.boundingBox())!;
    await page.mouse.move(k.x + k.width / 2, k.y + k.height / 2);
    await page.mouse.down();
    await page.mouse.move(k.x + k.width / 2 + b.w / 24, k.y + k.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(blocks(page, 6).first()).toHaveAttribute(
      "aria-label",
      "Sunday, 01:00 to 05:00, 21.0 °C",
    );
    // and on into the morning's block (08:00–12:00), which joins it
    const k2 = (await knob.boundingBox())!;
    await page.mouse.move(k2.x + k2.width / 2, k2.y + k2.height / 2);
    await page.mouse.down();
    await page.mouse.move(k2.x + k2.width / 2 + b.w / 6, k2.y + k2.height / 2, { steps: 5 });
    await expect(card(page).locator(".sbubble")).toHaveText("09:00");
    await page.mouse.up();
    await expect(blocks(page, 6)).toHaveCount(2);
    await expect(blocks(page, 6).first()).toHaveAttribute("aria-label", /^Sunday, 01:00 to 12:00/);
    await expect(blocks(page, 6).first()).toHaveAttribute("aria-pressed", "true");
    const undo = card(page).locator('.sctl [data-act="undo"]');
    await undo.click();
    await undo.click();
    await undo.click();
    await expect(undo).toBeDisabled();
    await expect(blocks(page, 6)).toHaveCount(2);
    // nothing changed: Done leaves without a call
    await card(page).locator('.sctl [data-act="done"]').click();
    expect(await updates(page)).toHaveLength(0);
    await expect(card(page).locator('.sctl [data-act="edit"]')).toBeVisible();
  });

  test("a handle dragged over other days puts the changed block on each of them", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Monday's morning (06:00–08:30): its end an hour later, and down over Tuesday and Wednesday
    await blocks(page, 0).first().click();
    const knob = lane(page, 0).locator('.sknob[data-act="to"]');
    const k = (await knob.boundingBox())!;
    const w = (await lane(page, 0).boundingBox())!.width;
    const pitch = (await lane(page, 1).boundingBox())!.y - (await lane(page, 0).boundingBox())!.y;
    const x = k.x + k.width / 2,
      y = k.y + k.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + w / 24, y, { steps: 4 });
    await expect(card(page).locator(".sbubble")).toHaveText("09:30");
    await page.mouse.move(x + w / 24, y + pitch * 2, { steps: 6 });
    await expect(card(page).locator(".sbubble")).toHaveText("Mon–Wed 06:00 – 09:30");
    await expect(card(page).locator(".sb.draft")).toHaveCount(2);
    await page.mouse.up();
    // (Tuesday's and Wednesday's mornings join the copies)
    for (const day of [0, 1, 2]) {
      await expect(blocks(page, day).first()).toHaveAttribute("aria-label", /06:00 to 09:30/);
      await expect(blocks(page, day).first()).toHaveAttribute("aria-pressed", "true");
    }
    await expect(selected(page)).toHaveCount(3);
    // one change: one Undo takes it all back
    await card(page).locator('.sctl [data-act="undo"]').click();
    for (const day of [0, 1, 2])
      await expect(blocks(page, day).first()).toHaveAttribute("aria-label", /06:00 to 08:30/);
    await expect(card(page).locator('.sctl [data-act="undo"]')).toBeDisabled();
  });

  test("draws the same block on every day the drag covers", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // from Tuesday 09:00 to Thursday 11:00
    const a = await at(lane(page, 1), 540),
      b = await at(lane(page, 3), 660);
    await drawFrom(page, a);
    await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
    await page.mouse.move(b.x, b.y, { steps: 4 });
    await expect(card(page).locator(".sbubble")).toHaveText("Tue–Thu 09:00 – 11:00");
    // drawn as blocks on all three days
    await expect(card(page).locator(".sb.draft")).toHaveCount(3);
    await page.mouse.up();
    for (const day of [1, 2, 3])
      await expect(lane(page, day).locator('.sb[aria-pressed="true"]')).toHaveAttribute(
        "aria-label",
        /09:00 to 11:00/,
      );
    await expect(selected(page)).toHaveCount(3);
    // one change: one Undo takes all three back
    await card(page).locator('.sctl [data-act="undo"]').click();
    await expect(card(page).locator('.sb[aria-pressed="true"]')).toHaveCount(0);
    await expect(card(page).locator('.sctl [data-act="undo"]')).toBeDisabled();
  });

  test("copies a day's selection to the days it is dragged over", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Wednesday's 12:00–13:30
    await blocks(page, 2).nth(1).click();
    const dot = card(page).locator(".sfill");
    const d = (await dot.boundingBox())!;
    const pitch = (await lane(page, 3).boundingBox())!.y - (await lane(page, 2).boundingBox())!.y;
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2);
    await page.mouse.down();
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2 + pitch * 2, { steps: 6 });
    await expect(card(page).locator(".sbubble")).toHaveText("Copy to Thu, Fri");
    await expect(card(page).locator(".sb.draft")).toHaveCount(2);
    await page.mouse.up();
    for (const day of [3, 4])
      await expect(blocks(page, day).nth(1)).toHaveAttribute("aria-label", /12:00 to 13:30/);
    // the copies are selected with it: the toolbar changes all three
    await expect(selected(page)).toHaveCount(3);
    for (const day of [2, 3, 4])
      await expect(blocks(page, day).nth(1)).toHaveAttribute("aria-pressed", "true");
  });

  test("changes the value, copies by dragging and deletes from the toolbar", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    await blocks(page, 0).first().click();
    await card(page).locator('.sbar [data-act="plus"]').click();
    await card(page).locator('.sbar [data-act="plus"]').click();
    await expect(card(page).locator(".sbar .val")).toHaveText("22.0 °C");
    await card(page).locator('.sbar [data-act="minus"]').click();
    await expect(blocks(page, 0).first()).toHaveAttribute("aria-label", /21.5 °C/);
    // the copy toggle: a drag leaves the block where it was
    await card(page).locator('.sbar [data-act="copy"]').click();
    await expect(card(page).locator('.sbar [data-act="copy"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const from = await at(lane(page, 0), 435);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // (four hours later, clear of the evening's block)
    await page.mouse.move(from.x + from.w / 6, from.y, { steps: 6 });
    await page.mouse.up();
    await expect(blocks(page, 0)).toHaveCount(3);
    await card(page).locator('.sbar [data-act="delete"]').click();
    await expect(blocks(page, 0)).toHaveCount(2);
  });

  test("a block dragged onto its neighbour joins it, on either side; back where it began, nothing changed", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    const wed = lane(page, 2);
    const drag = async (min: number, hours: number[]) => {
      const p = await at(wed, min);
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      for (const h of hours) await page.mouse.move(p.x + (p.w * h) / 24, p.y, { steps: 4 });
    };
    const undo = card(page).locator('.sctl [data-act="undo"]');
    // Wednesday's 12:00–13:30 into the evening's block, which starts at 17:00
    await drag(765, [4]);
    await expect(card(page).locator(".sbubble")).toHaveText("16:00 – 17:30");
    await page.mouse.up();
    await expect(blocks(page, 2)).toHaveCount(2);
    await expect(blocks(page, 2).nth(1)).toHaveAttribute("aria-label", /16:00 to 22:30/);
    await undo.click();
    // and into the morning's, which ends at 08:30
    await drag(765, [-4.5]);
    await page.mouse.up();
    await expect(blocks(page, 2)).toHaveCount(2);
    await expect(blocks(page, 2).first()).toHaveAttribute("aria-label", /06:00 to 09:00/);
    await undo.click();
    await expect(undo).toBeDisabled();
    // over the evening's block and back: the block is where it was, and there is nothing to undo
    await drag(765, [4, 0]);
    await page.mouse.up();
    await expect(blocks(page, 2).nth(1)).toHaveAttribute("aria-label", /12:00 to 13:30/);
    await expect(undo).toBeDisabled();
  });

  test("blocks of several days dragged past the first day stay there, at the time they were dragged to", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Wednesday's midday block and Monday's blocks (by the day's name: the toolbar is over its lane)
    await blocks(page, 2).nth(1).click();
    await card(page).locator(".sday").first().click();
    const p = await at(lane(page, 2), 765);
    const pitch = (await lane(page, 1).boundingBox())!.y - (await lane(page, 0).boundingBox())!.y;
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + p.w / 24, p.y, { steps: 4 });
    // up three rows: Monday's block has nowhere to go, so neither moves a day
    await page.mouse.move(p.x + p.w / 24, p.y - pitch * 3, { steps: 6 });
    await expect(card(page).locator(".sbubble")).toHaveText("13:00 – 14:30");
    await expect(blocks(page, 0).first()).toHaveAttribute("aria-label", /^Monday, 07:00 to 09:30/);
    await page.mouse.up();
    await expect(blocks(page, 2).nth(1)).toHaveAttribute(
      "aria-label",
      /^Wednesday, 13:00 to 14:30/,
    );
  });

  test("steps a value by the step, keeping the decimals it has", async ({ page }) => {
    await mount(page, { ...CFG, data: [{ key: "temperature", unit: "°C" }] }, { width: 400 });
    await edit(page);
    // Sunday's afternoon runs at 21.5
    await blocks(page, 6).nth(1).click();
    await card(page).locator('.sbar [data-act="plus"]').click();
    await expect(card(page).locator(".sbar .val")).toHaveText("22.5 °C");
    await card(page).locator('.sbar [data-act="minus"]').click();
    await card(page).locator('.sbar [data-act="minus"]').click();
    await expect(card(page).locator(".sbar .val")).toHaveText("20.5 °C");
  });

  test("saves the days as they were shown, though the week's first day changed meanwhile", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    await page.keyboard.press("ArrowRight");
    // (American English starts the week on Sunday)
    await setLanguage(page, "en-US");
    await expect(blocks(page, 0).first()).toHaveAttribute("aria-label", /^Monday, 06:15/);
    await card(page).locator('.sctl [data-act="done"]').click();
    await expect.poll(async () => (await updates(page)).length).toBe(1);
    const sent = (await updates(page))[0] as Record<string, { from: string }[]>;
    expect(sent.monday[0].from).toBe("06:15:00");
    expect(sent.tuesday[0].from).toBe("06:00:00");
    // and out of edit mode the week starts as the profile says
    await expect(lane(page, 0)).toHaveAttribute("aria-label", /^Sunday/);
  });

  test("keeps the toolbar inside the card for a selection on the first and the last row", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    await blocks(page, 0).first().click();
    await blocks(page, 6)
      .first()
      .click({ modifiers: ["Shift"] });
    await expect(selected(page)).toHaveCount(2);
    const bar = (await card(page).locator(".sbar").boundingBox())!;
    const box = (await card(page).boundingBox())!;
    const header = (await card(page).locator(".header").boundingBox())!;
    expect(bar.y + bar.height).toBeLessThanOrEqual(box.y + box.height);
    expect(bar.y).toBeGreaterThanOrEqual(header.y + header.height);
  });

  test("gives the days' names the room they need, in view and in edit mode alike", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await setLanguage(page, "pl");
    const clear = () =>
      card(page).evaluate((el) =>
        [...el.shadowRoot!.querySelectorAll(".wrow")].every(
          (row) =>
            row.querySelector(".key")!.getBoundingClientRect().right <=
            row.querySelector(".slane")!.getBoundingClientRect().left,
        ),
      );
    expect(await clear()).toBe(true);
    const before = (await lane(page, 0).boundingBox())!.x;
    await edit(page);
    expect(await clear()).toBe(true);
    expect((await lane(page, 0).boundingBox())!.x).toBe(before);
  });

  test("a press released outside the week turns no edit mode on", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    const b = (await lane(page, 0).boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + 1);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y - 4);
    await page.mouse.up();
    await page.waitForTimeout(650);
    await expect(card(page).locator('.sctl [data-act="edit"]')).toBeVisible();
  });

  test("edits with the keyboard", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    const first = blocks(page, 0).first();
    await expect(first).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("ArrowRight");
    await expect(card(page).locator(".sb:focus")).toHaveAttribute("aria-label", /06:15 to 08:45/);
    await page.keyboard.press("Shift+ArrowRight");
    await expect(card(page).locator(".sb:focus")).toHaveAttribute("aria-label", /06:15 to 09:00/);
    // to Tuesday, into its block: the focus goes with it
    await page.keyboard.press("ArrowDown");
    await expect(card(page).locator(".sb:focus")).toHaveAttribute(
      "aria-label",
      /^Tuesday, 06:00 to 09:00/,
    );
    await page.keyboard.press("Delete");
    await expect(blocks(page, 1)).toHaveCount(1);
    await page.keyboard.press("Escape");
    // edits were made: Escape leaves them for Done
    await expect(card(page).locator('.sctl [data-act="done"]')).toBeVisible();
    // nothing selected: an hour today (Sunday), the first one free from 08:00 on
    await card(page).locator('.sctl [data-act="add"]').click();
    await expect(card(page).locator(".sb:focus")).toHaveAttribute(
      "aria-label",
      /^Sunday, 12:00 to 13:00/,
    );
  });

  test("the arrow keys step a block or its end into the next block, which joins it", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Wednesday's 12:00–13:30; the evening's block starts at 17:00
    await blocks(page, 2).nth(1).focus();
    for (let i = 0; i < 14; i++) await page.keyboard.press("Shift+ArrowRight");
    await expect(card(page).locator(".sb:focus")).toHaveAttribute("aria-label", /12:00 to 17:00/);
    await expect(blocks(page, 2)).toHaveCount(3);
    await page.keyboard.press("Shift+ArrowRight");
    await expect(card(page).locator(".sb:focus")).toHaveAttribute("aria-label", /12:00 to 22:30/);
    await expect(blocks(page, 2)).toHaveCount(2);
    await card(page).locator('.sctl [data-act="undo"]').click();
    // (up against it again) the whole block, a step into it
    await blocks(page, 2).nth(1).focus();
    await page.keyboard.press("ArrowRight");
    await expect(card(page).locator(".sb:focus")).toHaveAttribute("aria-label", /12:15 to 22:30/);
  });

  test("keeps Done on a narrow card with a selection, and the focus in the header", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 228 });
    await edit(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    const done = (await card(page).locator('.sctl [data-act="done"]').boundingBox())!;
    const box = (await card(page).boundingBox())!;
    expect(done.x + done.width).toBeLessThanOrEqual(box.x + box.width);
    // Escape on a header button clears the selection, as on the week
    const undo = card(page).locator('.sctl [data-act="undo"]');
    await undo.focus();
    await page.keyboard.press("Escape");
    await expect(selected(page)).toHaveCount(0);
    // the last Undo: it cannot be pressed again, the focus goes on to Done
    await undo.focus();
    await page.keyboard.press("Enter");
    await expect(undo).toBeDisabled();
    await expect(card(page).locator('.sctl [data-act="done"]')).toBeFocused();
  });

  test("a row's blocks and day take the pointer over their whole height", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Wednesday's first block (the toolbar goes above it)
    const b = (await blocks(page, 2).first().boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height - 1);
    await expect(blocks(page, 2).first()).toHaveAttribute("aria-pressed", "true");
    await expect(blocks(page, 3).first()).toHaveAttribute("aria-pressed", "false");
    // the dot under it leaves Thursday's block to the pointer
    const t = (await blocks(page, 3).first().boundingBox())!;
    await page.mouse.click(t.x + t.width / 2, t.y + t.height / 2);
    await expect(blocks(page, 3).first()).toHaveAttribute("aria-pressed", "true");
  });

  test("is view only for a user who is no administrator, a YAML schedule and edit: false", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await expect(card(page).locator('.sctl [data-act="edit"]')).toBeVisible();
    await setAdmin(page, false);
    await expect(card(page).locator('.sctl [data-act="edit"]')).toHaveCount(0);
    await setAdmin(page, true);
    await mount(page, { type: "custom:schedule-card-pro", entity: "schedule.office_hours" });
    await expect(card(page).locator(".sctl > [role=img]")).toHaveAttribute(
      "aria-label",
      "View only",
    );
    await mount(page, { ...CFG, edit: false });
    await expect(card(page).locator(".sctl")).toBeEmpty();
  });

  test("starts the week on another day and writes one letter on a narrow card", async ({
    page,
  }) => {
    await mount(page, { ...CFG, first_weekday: "sunday" }, { width: 220 });
    await expect(card(page).locator(".key .n").first()).toBeVisible();
    await expect(card(page).locator(".key .n").first()).toHaveText("S");
    await expect(card(page).locator(".key.today")).toHaveCount(1);
    await expect(card(page).locator(".slbl.q").first()).toBeHidden();
  });
});

test.describe("schedule card with a mouse", () => {
  test("a click selects one block, Shift adds one, a click on an empty spot clears and a double click makes an hour", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    const hint = card(page).locator(".header .snext");
    await expect(hint).toHaveText("Double-click to add a block");
    // (the toolbar floats over the rows above the selection: Sunday stays clear)
    await blocks(page, 5).first().click();
    await expect(hint).toBeHidden();
    await blocks(page, 6)
      .nth(1)
      .click({ modifiers: ["Shift"] });
    await expect(selected(page)).toHaveCount(2);
    // a click without Shift: that block alone
    await blocks(page, 6).nth(1).click();
    await expect(selected(page)).toHaveCount(1);
    // Sunday 03:00 is empty: a click there clears the selection and makes nothing
    const p = await at(lane(page, 6), 180);
    await page.mouse.click(p.x, p.y);
    await expect(card(page).locator('.sb[aria-pressed="true"]')).toHaveCount(0);
    await expect(blocks(page, 6)).toHaveCount(2);
    await expect(card(page).locator('.sctl [data-act="undo"]')).toBeDisabled();
    await expect(hint).toBeVisible();
    // a double click there: an hour around it, selected
    await page.mouse.dblclick(p.x, p.y);
    await expect(blocks(page, 6)).toHaveCount(3);
    await expect(blocks(page, 6).first()).toHaveAttribute("aria-label", /02:30 to 03:30/);
    await expect(blocks(page, 6).first()).toHaveAttribute("aria-pressed", "true");
  });
  test("the keys act on the selection after a drag that copied it", async ({ page }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Saturday's and Sunday's mornings (08:00–12:00), copied six hours earlier
    await blocks(page, 5).first().click();
    await blocks(page, 6)
      .first()
      .click({ modifiers: ["Shift"] });
    const p = await at(lane(page, 6), 600);
    await page.mouse.move(p.x, p.y);
    await page.keyboard.down("Alt");
    await page.mouse.down();
    await page.mouse.move(p.x - p.w / 4, p.y, { steps: 6 });
    await page.mouse.up();
    await page.keyboard.up("Alt");
    for (const day of [5, 6]) {
      await expect(blocks(page, day)).toHaveCount(3);
      await expect(blocks(page, day).first()).toHaveAttribute("aria-pressed", "true");
    }
    // Backspace deletes the copies, the mornings stay
    await page.keyboard.press("Backspace");
    for (const day of [5, 6]) {
      await expect(blocks(page, day)).toHaveCount(2);
      await expect(blocks(page, day).first()).toHaveAttribute("aria-label", /08:00 to 12:00/);
    }
  });
  test("a drag from an empty spot selects the blocks its box touches; Shift adds them", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // from Monday 10:00 to Wednesday 18:00: the evenings of the three days and Wednesday's midday
    const a = await at(lane(page, 0), 600),
      b = await at(lane(page, 2), 1080);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 6 });
    await expect(card(page).locator(".slasso")).toBeVisible();
    await expect(selected(page)).toHaveCount(4);
    // no toolbar while it is drawn
    await expect(card(page).locator(".sbar")).toHaveCount(0);
    await page.mouse.up();
    await expect(card(page).locator(".slasso")).toHaveCount(0);
    await expect(selected(page)).toHaveCount(4);
    await expect(blocks(page, 0).first()).toHaveAttribute("aria-pressed", "false");
    await expect(card(page).locator('.sctl [data-act="undo"]')).toBeDisabled();
    // with Shift, Sunday's morning joins them (from Sunday 07:00 to 09:00)
    const c = await at(lane(page, 6), 420),
      d = await at(lane(page, 6), 540);
    await page.keyboard.down("Shift");
    await page.mouse.move(c.x, c.y);
    await page.mouse.down();
    await page.mouse.move(d.x, d.y, { steps: 4 });
    await page.mouse.up();
    await page.keyboard.up("Shift");
    await expect(selected(page)).toHaveCount(5);
  });
  test("Alt while dragging copies; Cmd+Z takes it back, Cmd+A selects all, Delete deletes the selection", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 400 });
    await edit(page);
    // Wednesday's 12:00–13:30, two hours later, Alt held from the start
    const p = await at(lane(page, 2), 765);
    await page.mouse.move(p.x, p.y);
    await page.keyboard.down("Alt");
    await page.mouse.down();
    await page.mouse.move(p.x + p.w / 12, p.y, { steps: 4 });
    await expect(card(page).locator(".sbubble")).toHaveText("14:00 – 15:30 · copy");
    // let go of Alt: a move again
    await page.keyboard.up("Alt");
    await expect(card(page).locator(".sbubble")).toHaveText("14:00 – 15:30");
    await expect(blocks(page, 2)).toHaveCount(3);
    await page.keyboard.down("Alt");
    await page.mouse.up();
    await page.keyboard.up("Alt");
    await expect(blocks(page, 2)).toHaveCount(4);
    await expect(blocks(page, 2).nth(1)).toHaveAttribute("aria-label", /12:00 to 13:30/);
    await expect(blocks(page, 2).nth(2)).toHaveAttribute("aria-label", /14:00 to 15:30/);
    await page.keyboard.press("ControlOrMeta+z");
    await expect(blocks(page, 2)).toHaveCount(3);
    // a click on an empty spot gives the keys to the week
    const q = await at(lane(page, 6), 180);
    await page.mouse.click(q.x, q.y);
    await page.keyboard.press("ControlOrMeta+a");
    await expect(selected(page)).toHaveCount(await card(page).locator(".sb[data-id]").count());
    await page.keyboard.press("Delete");
    await expect(card(page).locator(".sb[data-id]")).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+z");
    await expect(blocks(page, 2)).toHaveCount(3);
  });
});

test.describe("schedule card on a touch screen", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 400, height: 800 } });
  test("a long press turns edit mode on with the block selected", async ({ page }) => {
    await mount(page, CFG, { width: 360 });
    const p = await at(lane(page, 0), 1200);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    await page.waitForTimeout(650);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(blocks(page, 0).nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(card(page).locator(".sbar")).toBeVisible();
    // the keyboard works at once (the long press's release swallows no later click)
    const copy = card(page).locator('.sbar [data-act="copy"]');
    await copy.focus();
    await page.keyboard.press("Enter");
    await expect(copy).toHaveAttribute("aria-pressed", "true");
  });
  test("in edit mode the page scrolls over the week; a tap selects or clears, a hold makes an hour or drags", async ({
    page,
  }) => {
    await mount(page, CFG, { width: 360 });
    await edit(page);
    const cdp = await page.context().newCDPSession(page);
    const touch = async (
      type: "touchStart" | "touchMove" | "touchEnd",
      p?: { x: number; y: number },
    ) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        // (a point: Chrome moves a wider touch onto the nearest block)
        touchPoints: p ? [{ x: p.x, y: p.y, radiusX: 1, radiusY: 1 }] : [],
      });
    const tap = async (p: { x: number; y: number }) => {
      await touch("touchStart", p);
      await touch("touchEnd");
    };
    const touchAction = (l: Locator) => l.evaluate((el) => getComputedStyle(el).touchAction);
    await expect(card(page).locator(".header .snext")).toHaveText("Hold to add a block");
    // a finger scrolls the page over the lanes and the blocks it has not selected
    expect(await touchAction(lane(page, 0))).toBe("pan-y");
    expect(await touchAction(blocks(page, 0).first())).toBe("pan-y");
    // a tap adds a block to the selection, a second block too; a selected block takes the finger
    // (the toolbar floats over the rows above the selection: Sunday stays clear)
    await tap(await at(lane(page, 5), 600));
    await tap(await at(lane(page, 6), 1000));
    await expect(selected(page)).toHaveCount(2);
    expect(await touchAction(blocks(page, 6).nth(1))).toBe("none");
    // a tap on an empty spot (Sunday 03:00) clears it and makes nothing
    await tap(await at(lane(page, 6), 180));
    await expect(card(page).locator('.sb[aria-pressed="true"]')).toHaveCount(0);
    await expect(blocks(page, 6)).toHaveCount(2);
    // a hold on an empty spot (Thursday 14:00) makes an hour
    const thu = await at(lane(page, 3), 840);
    await touch("touchStart", thu);
    await page.waitForTimeout(650);
    // (an hour around the finger)
    await expect(card(page).locator(".sbubble")).toHaveText("13:30 – 14:30");
    await touch("touchEnd");
    await expect(blocks(page, 3).nth(1)).toHaveAttribute("aria-label", /13:30 to 14:30/);
    await card(page).locator('.sctl [data-act="undo"]').click();
    await expect(blocks(page, 3)).toHaveCount(2);
    // a hold that drags on draws, over the day below too
    const pitch = (await lane(page, 4).boundingBox())!.y - (await lane(page, 3).boundingBox())!.y;
    await touch("touchStart", thu);
    await page.waitForTimeout(650);
    for (let i = 1; i <= 4; i++)
      await touch("touchMove", { x: thu.x + (thu.w / 12) * (i / 4), y: thu.y + (pitch * i) / 4 });
    await expect(card(page).locator(".sbubble")).toHaveText("Thu, Fri 14:00 – 16:00");
    await touch("touchEnd");
    await expect(selected(page)).toHaveCount(2);
    for (const day of [3, 4])
      await expect(blocks(page, day).nth(1)).toHaveAttribute("aria-label", /14:00 to 16:00/);
    // a hold on a block not selected drags that block alone (Monday's morning, an hour later)
    const mon = await at(lane(page, 0), 435);
    await touch("touchStart", mon);
    await page.waitForTimeout(650);
    for (let i = 1; i <= 4; i++)
      await touch("touchMove", { x: mon.x + (mon.w / 24) * (i / 4), y: mon.y });
    await touch("touchEnd");
    await expect(blocks(page, 0).first()).toHaveAttribute("aria-label", /07:00 to 09:30/);
    await expect(blocks(page, 0).first()).toHaveAttribute("aria-pressed", "true");
    await expect(selected(page)).toHaveCount(1);
  });
  test("a short tap shows the tooltip and keeps view mode", async ({ page }) => {
    await mount(page, CFG, { width: 360 });
    const p = await at(lane(page, 0), 400);
    await page.touchscreen.tap(p.x, p.y);
    await expect(card(page).locator(".wk > .tip")).toHaveText("Mon 06:00 – 08:30 · 21.0 °C");
    await expect(card(page).locator('.sctl [data-act="edit"]')).toBeVisible();
  });
});

test.describe("the schedule kind", () => {
  test("a poster says when it changes and how soon, and draws today's blocks", async ({ page }) => {
    await mount(
      page,
      {
        type: "custom:poster-card-pro",
        entity: "schedule.heating",
        data: [{ key: "temperature", unit: "°C" }],
      },
      { width: 283 },
    );
    await expect(card(page).locator(".pbody .secondary")).toHaveText("from 14:00 · 21.5 °C");
    await expect(card(page).locator(".corner")).toContainText("in 2h");
    await expect(card(page).locator(".psched .sb")).toHaveCount(2);
    await expect(card(page).locator(".psched .snow")).toHaveCount(1);
    const p = await at(card(page).locator(".psched .slane"), 1000);
    await page.mouse.move(p.x, p.y);
    await expect(card(page).locator(".psched .tip")).toHaveText("14:00 – 22:30 · 21.5 °C");
  });

  test("a tile draws the next 24 hours, or a ribbon along its edge", async ({ page }) => {
    await mount(
      page,
      {
        type: "custom:tile-card-pro",
        entity: "schedule.garden_watering",
        visual: { variant: "ahead" },
      },
      { width: 400 },
    );
    await expect(card(page).locator(".saxis .slbl").first()).toHaveText("now");
    await expect(card(page).locator(".secondary")).toHaveText("Off · next Mon 06:00 · 20");
    await mount(
      page,
      {
        type: "custom:tile-card-pro",
        entity: "schedule.hallway_lights",
        visual: { variant: "edge" },
      },
      { width: 400 },
    );
    await expect(card(page).locator(".psched.edge")).toHaveCSS("position", "absolute");
    await expect(card(page).locator(".psched.edge .saxis")).toHaveCount(0);
    // the ribbon takes no room: one row, as a plain tile
    const grid = await card(page).evaluate((el) =>
      (el as unknown as { getGridOptions(): { min_rows?: number } }).getGridOptions(),
    );
    expect(grid.min_rows).toBe(1);
  });
});
