import { expect, it } from "vitest";
import { FLOOR_BOUNDS, QUOTE } from "@/styles/floor";
import { focusPath, questionExcerpt, quoteAnchor, seatBoxes, slots, toPoint } from "./geometry";

it("keeps long questions to a short exact excerpt, ending at a word boundary", () => {
  const question = "How did you check whether the variant order or the one-week periods affected the comfort results?";
  const excerpt = questionExcerpt(question);
  expect(excerpt.length).toBeLessThanOrEqual(QUOTE.maxCharacters);
  expect(excerpt.endsWith("…")).toBe(true);
  expect(question.startsWith(excerpt.slice(0, -1))).toBe(true);
  expect(questionExcerpt("What changed?")).toBe("What changed?");
});

it("does not teleport an interrupted table to another angle before a new focus move", () => {
  const inFlight = [{ a: 70, d: 0.3, r: 124 }, { a: 190, d: 0.6, r: 110 }];
  const path = focusPath(inFlight, 1);
  expect(path.from).toEqual(inFlight);
});

it("keeps bounded bubbles on the floor with their tail beside the correct speaker, for every seat", () => {
  for (let focus = 0; focus < 4; focus++) {
    const points = slots(4, focus, null).map(toPoint);
    for (let count = 1; count <= 6; count++) {
      const seats = seatBoxes(points[focus], count);
      for (const seat of seats) {
        const q = quoteAnchor(seat, points, focus, seats);
        expect(q.left).toBeGreaterThanOrEqual(FLOOR_BOUNDS.left);
        expect(q.top).toBeGreaterThanOrEqual(FLOOR_BOUNDS.top);
        expect(q.left + QUOTE.width).toBeLessThanOrEqual(FLOOR_BOUNDS.right);
        expect(q.top + QUOTE.height).toBeLessThanOrEqual(FLOOR_BOUNDS.bottom);
        const dot = { x: q.left + q.tailLeft + QUOTE.tailSize / 2, y: q.top + q.tailTop + QUOTE.tailSize / 2 };
        const horizontal = q.side === "left" || q.side === "right";
        expect(Math.abs(horizontal ? q.tailTop + QUOTE.tailSize / 2 - QUOTE.height / 2 : q.tailLeft + QUOTE.tailSize / 2 - QUOTE.width / 2)).toBeGreaterThan(10);
        expect(horizontal ? dot.y : dot.x).toBeCloseTo(horizontal ? seat.cy : seat.cx);
        expect(horizontal ? Math.abs(dot.x - seat.cx) : Math.abs(dot.y - seat.cy)).toBeCloseTo(seat.size / 2 + QUOTE.gap / 2);
      }
    }
  }
});
