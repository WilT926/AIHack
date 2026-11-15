import { describe, expect, it } from "vitest";
import { clock, durationSeconds, endsWithThanks, joinTranscript, parseClock, wordCount, wordsPerMinute } from "./transcript";

describe("transcript helpers", () => {
  it("counts words, including contractions", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("  We built Panel — it's a board.  ")).toBe(6);
  });

  it("times a pitch and its pace", () => {
    expect(durationSeconds("2026-11-15T10:00:00Z", "2026-11-15T10:03:07Z")).toBe(187);
    expect(durationSeconds("2026-11-15T10:03:07Z", "2026-11-15T10:00:00Z")).toBe(0);
    expect(durationSeconds(null, "2026-11-15T10:00:00Z")).toBe(0);
    expect(wordsPerMinute(450, 180)).toBe(150);
    expect(wordsPerMinute(450, 0)).toBe(0);
    expect(clock(187)).toBe("3:07");
  });

  it("parses typed lengths", () => {
    expect(parseClock("3:07")).toBe(187);
    expect(parseClock("3m 7s")).toBe(187);
    expect(parseClock("5")).toBe(300);
    expect(parseClock("240")).toBe(240);
    expect(parseClock("soon")).toBeNull();
  });

  it("spots a closing thank you", () => {
    expect(endsWithThanks("…and that is Panel. Thank you.")).toBe(true);
    expect(endsWithThanks("that's all, thanks very much everyone")).toBe(true);
    expect(endsWithThanks("thank you for listening!")).toBe(true);
    expect(endsWithThanks("Thank you to the organisers for the venue")).toBe(false);
    expect(endsWithThanks("we thank you")).toBe(true);
    expect(endsWithThanks("")).toBe(false);
  });

  it("joins final and interim text", () => {
    expect(joinTranscript("Hello judges.", " we built")).toBe("Hello judges. we built");
    expect(joinTranscript("", "")).toBe("");
  });
});
