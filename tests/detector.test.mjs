import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detect } from "../dist/lib/detector/index.js";

describe("detect", () => {
  it("does not count swear-like words inside domains or URL hosts", () => {
    const result = detect(
      "My site is luxx.wtf, not a confession. See https://luxx.wtf/profile or admin@luxx.wtf.",
    );

    assert.equal(result.count, 0);
  });

  it("still counts swear-like words outside the domain portion of a URL", () => {
    const result = detect("See https://example.com/wtf for the failure details.");

    assert.equal(result.count, 1);
    assert.equal(result.matches[0]?.word, "wtf");
  });

  it("still counts the same word when it is standalone", () => {
    const result = detect("wtf is this?");

    assert.equal(result.count, 1);
    assert.equal(result.matches[0]?.word, "wtf");
  });

  it("still counts a swear followed by sentence punctuation", () => {
    const result = detect("That deploy was wtf.");

    assert.equal(result.count, 1);
    assert.equal(result.matches[0]?.word, "wtf");
  });

  it("does not double-count matches after repeated characters", () => {
    const result = detect("luxx wtf");

    assert.equal(result.count, 1);
    assert.equal(result.matches[0]?.index, 5);
  });
});
