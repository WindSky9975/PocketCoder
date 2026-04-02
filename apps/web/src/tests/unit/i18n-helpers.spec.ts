import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getConnectionStateLabel,
  getNextLocale,
  getSessionStatusLabel,
  normalizeLocale,
  translateClientError,
} from "../../lib/i18n/helpers.ts";
import { localeMessages } from "../../lib/i18n/messages.ts";

describe("i18n helper boundaries", () => {
  it("normalizes locale values and toggles between supported locales", () => {
    assert.equal(normalizeLocale("fr-FR"), "zh-CN");
    assert.equal(normalizeLocale("en"), "en");
    assert.equal(getNextLocale("zh-CN"), "en");
    assert.equal(getNextLocale("en"), "zh-CN");
  });

  it("translates known client-side errors into the selected locale", () => {
    const zhCopy = localeMessages["zh-CN"];
    const enCopy = localeMessages.en;

    assert.equal(
      translateClientError(zhCopy, "pairing failed with status 401"),
      "配对失败，状态码 401。",
    );
    assert.equal(
      translateClientError(enCopy, "browser failed to connect to relay"),
      "Failed to connect to relay. Confirm that the relay service is running.",
    );
  });

  it("maps protocol and connection states to localized labels", () => {
    const zhCopy = localeMessages["zh-CN"];
    const enCopy = localeMessages.en;

    assert.equal(getSessionStatusLabel(zhCopy, "waiting_approval"), "等待审批");
    assert.equal(getConnectionStateLabel(enCopy, "missing_pairing"), "Not paired");
  });
});
