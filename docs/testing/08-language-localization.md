# 08 — Language & Localization

Language **selection** was removed. The app is single-language (English): there is no
language picker, no UI language switching, and no RTL restart flow. i18next is initialized
once with English (`en.json`) as both the only bundled locale and the fallback. The
catalog-content filter (`albumVisibleInLang`) still hides foreign-language albums so only
English + legacy ('other') catalog content is browsable.

---

### JLM-LANG-001 — No language UI is present
**Category:** Functional, Regression · **Priority:** P1 · **Platform:** Both
**Preconditions:** On Home / Profile.
**Steps:**
1. Inspect the Home header actions and the Profile account options.
**Expected Result:** No language flag button in the header and no "Language" row in Profile;
there is no way to open a language picker anywhere in the app.

---

### JLM-LANG-002 — UI renders in English
**Category:** Functional · **Priority:** P1 · **Platform:** Both
**Preconditions:** Fresh install; any device locale.
**Steps:**
1. Launch the app on a device set to a non-English locale.
**Expected Result:** All UI strings render in English regardless of the device locale; no raw
key strings (e.g. `home.title`) are shown.

---

### JLM-LANG-003 — Catalog browse shows only English/legacy content
**Category:** Integration, Functional · **Priority:** P1 · **Platform:** Both
**Preconditions:** Catalog has content in multiple languages.
**Steps:**
1. Browse Home and the catalog rails.
**Expected Result:** Only English (…EN) and non-language/legacy ('other') albums appear;
foreign-language translations (…ES, …AR, …BR, …) are hidden.

---

### JLM-LANG-004 — Personal collections are NOT language-filtered
**Category:** Functional, Regression · **Priority:** P1 · **Platform:** Both
**Preconditions:** Signed in with liked songs/followed artists/liked albums across languages.
**Steps:**
1. Open Liked Songs, Followed Artists, and the Library albums grid.
**Expected Result:** All personal items remain visible regardless of catalog language (only the
browse/home catalog is language-scoped).
