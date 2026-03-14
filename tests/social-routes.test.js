const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadSocialState() {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "social-state.js"), "utf8");
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.globalThis.StampbookSocialState;
}

test("parses profile and group hash routes with decoding", () => {
  const socialState = loadSocialState();

  const profile = socialState.parseSocialRoute("#profile/collector%20one", "");
  assert.equal(profile.view, "profile");
  assert.equal(profile.value, "collector one");

  const group = socialState.parseSocialRoute("#group/arab%2Dstamps", "");
  assert.equal(group.view, "group");
  assert.equal(group.value, "arab-stamps");
});

test("maps bare group hash to selected group id", () => {
  const socialState = loadSocialState();

  const selected = socialState.parseSocialRoute("#group", "group-77");
  assert.equal(selected.view, "group");
  assert.equal(selected.value, "group-77");

  const empty = socialState.parseSocialRoute("#group", "");
  assert.equal(empty.view, "group");
  assert.equal(empty.value, "");
});

test("normalizes profile/group hashes to social top-nav target", () => {
  const socialState = loadSocialState();

  assert.equal(socialState.normalizeTopNavHash("#profile/demo-user"), "#stampbook-social");
  assert.equal(socialState.normalizeTopNavHash("#group/demo-group"), "#stampbook-social");
  assert.equal(socialState.normalizeTopNavHash("#wallet"), "#wallet");
  assert.equal(socialState.normalizeTopNavHash(""), "#hero");
});
