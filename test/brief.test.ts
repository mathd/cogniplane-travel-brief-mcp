import assert from "node:assert/strict";
import { test } from "node:test";
import { PREFERENCE_TREE, briefMessage, briefText, toolSummary, type Idea } from "../src/brief.ts";

test("tree ids are unique and every branch leads to leaves", () => {
  const ids: string[] = [];
  const walk = (n: Idea, depth: number) => {
    ids.push(n.id);
    if (depth === 3) assert.equal(n.children.length, 0, n.id);
    else assert.ok(n.children.length > 0, n.id);
    n.children.forEach((c) => walk(c, depth + 1));
  };
  walk(PREFERENCE_TREE, 0);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(PREFERENCE_TREE.children.length, 10);
});

test("brief text fills defaults for empty fields", () => {
  assert.equal(
    briefText({ party: "", travellers: 1, destination: "", budget: "", preferences: [] }),
    "Atlas trip brief\nTravel party: Open\nNumber of people: 1\nDestination: Not set\nBudget per person: Not set\nPreferences: Open",
  );
});

test("brief message asks for a proposal and carries the brief", () => {
  const msg = briefMessage({ party: "Couple", travellers: 2, destination: "Japan", budget: "$4,000 to $8,000", preferences: ["Food", "Markets", "Street food"] });
  assert.match(msg, /^Draft a short trip proposal/);
  assert.match(msg, /Travel party: Couple\nNumber of people: 2\nDestination: Japan\nBudget per person: \$4,000 to \$8,000\nPreferences: Food, Markets, Street food$/);
});

test("tool summary names the top-level themes", () => {
  assert.match(toolSummary(), /Culture, Coast, Food, Nature, Adventure, City life, Slow travel, Wellness, Romance, Nightlife\./);
});
