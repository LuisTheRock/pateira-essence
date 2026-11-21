import assert from "node:assert/strict";
import { test } from "node:test";
import { check } from "./validate.ts";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ nome: "Ana Silva", instagram: "@ana", telemovel: "912345678", qtd: "2", ...o })) f.set(k, v);
  return f;
};

test("valid input passes and strips the leading @", () => {
  const r = check(form({}));
  assert.equal(r.error, "");
  assert.equal(r.values.instagram, "ana");
  assert.equal(r.qtd, 2);
});

test("bad input is rejected", () => {
  for (const bad of [{ nome: " " }, { instagram: "@" }, { telemovel: "91234567" }, { telemovel: "9123456789" }, { telemovel: "91234567a" }, { qtd: "0" }, { qtd: "11" }, { qtd: "1.5" }, { qtd: "" }] as Record<string, string>[])
    assert.notEqual(check(form(bad)).error, "", JSON.stringify(bad));
});

test("consent is required only when asked for", () => {
  assert.equal(check(form({})).error, "");
  assert.notEqual(check(form({}), true).error, "");
  assert.equal(check(form({ ack: "on" }), true).error, "");
});
