import assert from "node:assert/strict";
import http from "node:http";
import {
  browserTabPool,
  MAX_LIVE_TABS,
  StaleElementRefError,
} from "./index";

function startLocalFixtureServer(): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = req.url || "/";
      res.setHeader("Content-Type", "text/html; charset=utf-8");

      if (url.startsWith("/pricing")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head><title>Acme Cloud Pricing</title></head>
            <body>
              <h1>Choose your Acme plan</h1>
              <label for="email-input">Work Email</label>
              <input id="email-input" name="email" type="email" placeholder="you@company.com" />

              <label for="secret-pass">Account Password</label>
              <input id="secret-pass" name="password" type="password" value="initialSecret99!" />

              <label for="billing-cycle">Billing Cycle</label>
              <select id="billing-cycle" name="cycle">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (Save 20%)</option>
              </select>

              <label>
                <input id="terms-check" type="checkbox" />
                Agree to spending terms
              </label>

              <div id="pointer-card" style="cursor: pointer; padding: 14px; border: 1px solid #ccc; width: 260px;" onclick="document.getElementById('picked-plan').textContent = 'Pro $29.00/mo'">
                <span>Pro Workspace</span>
                <strong>$29.00 / month</strong>
              </div>
              <div id="picked-plan">None</div>

              <button id="add-dynamic-btn" type="button" onclick="
                const b = document.createElement('button');
                b.id = 'late-btn';
                b.textContent = 'Confirm Dynamic Tier';
                document.body.appendChild(b);
              ">Reveal Extra Option</button>

              <button id="open-popup-btn" type="button" onclick="window.open('/popup', '_blank')">Open Billing Popup</button>
              <a id="next-page-link" href="/page-2">View Enterprise Add-ons</a>
            </body>
          </html>`);
        return;
      }

      if (url.startsWith("/page-2")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head><title>Acme Enterprise Add-ons</title></head>
            <body>
              <h1>Enterprise Security Pack</h1>
              <p class="price-tag">$99.00 / month</p>
              <button id="addon-btn" type="button">Enable Audit Stream</button>
            </body>
          </html>`);
        return;
      }

      if (url.startsWith("/popup")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head><title>Invoice Portal Popup</title></head>
            <body>
              <h2>Popup Invoice Viewer</h2>
              <button type="button">Download PDF</button>
            </body>
          </html>`);
        return;
      }

      if (url.startsWith("/pair")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head><title>Pair Browsing Sandbox</title></head>
            <body>
              <input id="live-key-box" type="text" placeholder="Type here" />
              <div id="key-status">idle</div>
              <div id="hover-target" style="width: 180px; height: 60px; margin-top: 20px; background: #eee; cursor: pointer;">
                Hover Menu Trigger
              </div>
              <script>
                const box = document.getElementById('live-key-box');
                box.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') {
                    document.getElementById('key-status').textContent = 'submitted:' + e.keyCode + ':' + box.value;
                  }
                });
                const hoverEl = document.getElementById('hover-target');
                hoverEl.addEventListener('mousemove', () => {
                  hoverEl.setAttribute('data-hovered', 'yes');
                  hoverEl.textContent = 'Hovered Live!';
                });
              </script>
            </body>
          </html>`);
        return;
      }

      if (url.startsWith("/login")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head><title>Sign in to Merchant Account</title></head>
            <body>
              <h1>Sign in to continue</h1>
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <button type="submit">Sign In</button>
            </body>
          </html>`);
        return;
      }

      if (url.startsWith("/2fa")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head><title>Two-Factor Verification</title></head>
            <body>
              <h1>Enter your 6-digit verification code</h1>
              <input type="text" autocomplete="one-time-code" placeholder="6-digit code" />
              <button type="submit">Verify Code</button>
            </body>
          </html>`);
        return;
      }

      if (url.startsWith("/guards")) {
        res.end(`<!DOCTYPE html>
          <html>
            <head>
              <title>Guarded Pricing Page</title>
              <script src="https://www.google-analytics.com/analytics.min.js" async></script>
            </head>
            <body>
              <div id="onetrust-consent-sdk" role="dialog" aria-label="Cookie consent">
                <button type="button">Accept All Tracking Cookies</button>
              </div>
              <div class="cookie-banner">We use cookies</div>

              <h1>Team Subscription</h1>
              <div data-testid="plan-price">$15.49 / month</div>
              <div style="display: none;">$99.99 / month</div>

              <script>
                console.log("Session initialized with Bearer superSecretBearerToken123456");
                window.alert("Intrusive promo alert!");
                window.confirm("Subscribe to newsletter?");
              </script>
            </body>
          </html>`);
        return;
      }

      res.end(`<!DOCTYPE html><html><head><title>Blank</title></head><body>OK</body></html>`);
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}

async function runSemanticBrowserV2Tests() {
  console.log("==================================================");
  console.log("🧭 Testing OpenCode V2 × Zephium Semantic Browser");
  console.log("==================================================");

  const server = await startLocalFixtureServer();

  try {
    // 1. Semantic AXTree + cursor:pointer walker + monotonic @e1..@eN refs + password redaction
    console.log("\n[Test 1] Semantic AXTree + cursor:pointer Walker & Monotonic @eN Refs...");
    const tab1 = await browserTabPool.openTab({
      url: `${server.baseUrl}/pricing`,
      focus: true,
    });
    assert.match(tab1.id, /^tab_[a-f0-9-]{36}$/, "Tab ID must match tab_<uuid> format");
    assert.equal(tab1.generation, 1, "Initial loaded tab starts at generation 1");

    const snap1 = await browserTabPool.snapshot(tab1.id);
    assert.ok(snap1.elements.length >= 6, `Expected >=6 semantic nodes, got ${snap1.elements.length}`);
    assert.equal(snap1.elements[0].ref, "@e1", "First ref must be @e1");

    const passNode = snap1.elements.find((e) => e.inputType === "password");
    assert.ok(passNode, "Password input must appear in semantic AXTree");
    assert.equal(passNode.value, "[REDACTED]", "Password input value must be redacted");
    assert.ok(!snap1.treeText.includes("initialSecret99!"), "Raw password must never appear in treeText");

    const pointerCard = snap1.elements.find((e) => e.name.includes("Pro Workspace"));
    assert.ok(pointerCard, "cursor:pointer card must be discovered by semantic walker");
    assert.equal(pointerCard.isCursorPointer, true, "cursor:pointer root flag must be set");

    // Re-snapshot in same generation preserves existing @eN refs
    const snap1Repeat = await browserTabPool.snapshot(tab1.id);
    const pointerRepeat = snap1Repeat.elements.find((e) => e.name.includes("Pro Workspace"));
    assert.equal(pointerRepeat?.ref, pointerCard.ref, "Existing @eN ref must remain stable in same generation");

    // Click button that dynamically appends a new DOM button -> mints monotonic @e(max+1)
    const addDynamicBtn = snap1.elements.find((e) => e.name.includes("Reveal Extra Option"));
    assert.ok(addDynamicBtn, "Reveal Extra Option button must exist");
    await browserTabPool.act({
      tabId: tab1.id,
      action: "click",
      ref: addDynamicBtn.ref,
      generation: snap1.generation,
    });

    const snapAfterDynamic = await browserTabPool.snapshot(tab1.id);
    const lateBtn = snapAfterDynamic.elements.find((e) => e.name.includes("Confirm Dynamic Tier"));
    assert.ok(lateBtn, "Dynamically added button must be minted in snapshot");
    const prevMaxNum = Math.max(
      ...snap1.elements.map((e) => parseInt(e.ref.slice(2), 10))
    );
    const newNum = parseInt(lateBtn.ref.slice(2), 10);
    assert.ok(newNum > prevMaxNum, `New monotonic ref ${lateBtn.ref} must exceed @e${prevMaxNum}`);
    console.log(`   ✅ Minted @e1..@e${newNum} monotonically, cursor:pointer captured, password redacted.`);

    // 2. Multi-Turn Action Loop: fill (normal + redacted), select, check, click, wait
    console.log("\n[Test 2] Multi-Turn Semantic Actions (fill, select, check, click, wait)...");
    const emailNode = snap1.elements.find((e) => e.name.includes("Work Email"));
    const selectNode = snap1.elements.find((e) => e.role === "combobox");
    const checkNode = snap1.elements.find((e) => e.role === "checkbox");
    assert.ok(emailNode && passNode && selectNode && checkNode);

    const fillEmail = await browserTabPool.act({
      tabId: tab1.id,
      action: "fill",
      ref: emailNode.ref,
      generation: snap1.generation,
      value: "founder@rico.ai",
    });
    assert.equal(fillEmail.redacted, false);

    const fillPass = await browserTabPool.act({
      tabId: tab1.id,
      action: "fill",
      ref: passNode.ref,
      generation: snap1.generation,
      value: "TopSecretNewPass42!",
    });
    assert.equal(fillPass.redacted, true, "Filling password field must flag redacted=true");
    assert.ok(fillPass.summary.includes("[REDACTED]") && !fillPass.summary.includes("TopSecretNewPass42!"));

    await browserTabPool.act({
      tabId: tab1.id,
      action: "select",
      ref: selectNode.ref,
      generation: snap1.generation,
      value: "annual",
    });

    await browserTabPool.act({
      tabId: tab1.id,
      action: "check",
      ref: checkNode.ref,
      generation: snap1.generation,
      checked: true,
    });

    await browserTabPool.act({
      tabId: tab1.id,
      action: "click",
      ref: pointerCard.ref,
      generation: snap1.generation,
    });

    await browserTabPool.act({
      tabId: tab1.id,
      action: "wait",
      text: "Pro $29.00/mo",
      ms: 2000,
    });

    const snapVerified = await browserTabPool.snapshot(tab1.id);
    const updatedCheck = snapVerified.elements.find((e) => e.ref === checkNode.ref);
    const updatedSelect = snapVerified.elements.find((e) => e.ref === selectNode.ref);
    assert.equal(updatedCheck?.checked, true, "Checkbox must be checked");
    assert.equal(updatedSelect?.value, "annual", "Select value must be annual");
    console.log("   ✅ Multi-turn fill, redacted password fill, select, check, click & wait verified.");

    // 3. Generation Stale-Ref Guard + CDP Navigation History (canGoBack / canGoForward)
    console.log("\n[Test 3] Generation Stale-Ref Guard & CDP Navigation History...");
    const nextLink = snapVerified.elements.find((e) => e.name.includes("View Enterprise Add-ons"));
    assert.ok(nextLink, "Navigation link must exist");
    const oldGen = snapVerified.generation;

    await browserTabPool.act({
      tabId: tab1.id,
      action: "click",
      ref: nextLink.ref,
      generation: oldGen,
    });

    const page2Snap = await browserTabPool.snapshot(tab1.id);
    assert.ok(
      page2Snap.generation > oldGen,
      `Generation must advance on navigation (${oldGen} -> ${page2Snap.generation})`
    );

    let caughtStale = false;
    try {
      await browserTabPool.act({
        tabId: tab1.id,
        action: "click",
        ref: nextLink.ref,
        generation: oldGen,
      });
    } catch (err) {
      if (err instanceof StaleElementRefError) {
        caughtStale = true;
      }
    }
    assert.equal(caughtStale, true, "Stale generation must throw StaleElementRefError");

    const diagAtPage2 = browserTabPool.getDiagnostics(tab1.id)!;
    assert.equal(diagAtPage2.canGoBack, true, "canGoBack must be true after navigating to /page-2");
    assert.equal(diagAtPage2.canGoForward, false, "canGoForward must be false at tip of history");

    const backInfo = await browserTabPool.goBack(tab1.id);
    assert.ok(backInfo && backInfo.url.includes("/pricing"), "goBack must return to /pricing");
    assert.equal(backInfo.canGoBack, false, "canGoBack must be false at initial tab URL");
    assert.equal(backInfo.canGoForward, true, "canGoForward must be true after goBack");

    const fwdInfo = await browserTabPool.goForward(tab1.id);
    assert.ok(fwdInfo && fwdInfo.url.includes("/page-2"), "goForward must return to /page-2");
    assert.equal(fwdInfo.canGoBack, true);
    assert.equal(fwdInfo.canGoForward, false);
    console.log("   ✅ StaleElementRefError enforced and CDP canGoBack/canGoForward verified.");

    // 4. Popup Capture & 4-Tab Live Pool Cap
    console.log("\n[Test 4] Multi-Tab Pool (Max 4 Live Pages) & Automatic Popup Capture...");
    await browserTabPool.goBack(tab1.id); // back on /pricing where #open-popup-btn lives
    const pricingSnap = await browserTabPool.snapshot(tab1.id);
    const popupTrigger = pricingSnap.elements.find((e) => e.name.includes("Open Billing Popup"));
    assert.ok(popupTrigger, "Popup trigger button must exist");

    await browserTabPool.act({
      tabId: tab1.id,
      action: "click",
      ref: popupTrigger.ref,
      generation: pricingSnap.generation,
    });
    await new Promise((r) => setTimeout(r, 350));

    const afterPopupPool = browserTabPool.listTabs();
    const capturedPopup = afterPopupPool.tabs.find((t) => t.isPopup);
    assert.ok(capturedPopup, "window.open popup must be captured into BrowserTabPool");
    assert.ok(capturedPopup.url.includes("/popup"), `Popup URL should be /popup, got ${capturedPopup.url}`);

    // Open 3 more tabs (total would be 5) and verify pool cap evicts oldest non-focused tab
    await browserTabPool.openTab({ url: `${server.baseUrl}/pair`, focus: true });
    await browserTabPool.openTab({ url: `${server.baseUrl}/login`, focus: true });
    await browserTabPool.openTab({ url: `${server.baseUrl}/2fa`, focus: true });

    const cappedPool = browserTabPool.listTabs();
    assert.equal(
      cappedPool.tabs.length,
      MAX_LIVE_TABS,
      `Live tab pool must cap at ${MAX_LIVE_TABS} concurrent pages`
    );
    console.log(`   ✅ Popup captured (${capturedPopup.id}) and pool capped at ${cappedPool.tabs.length}/${MAX_LIVE_TABS} live tabs.`);

    // 5. Full Pair Browsing Keyboard (keyDown/char/keyUp + virtualKeyCode) & mouseMoved Hover
    console.log("\n[Test 5] Full Pair Browsing CDP Keyboard & mouseMoved Hover...");
    const pairTab = cappedPool.tabs.find((t) => t.url.includes("/pair"))!;
    await browserTabPool.focusTab(pairTab.id);
    const pairSnap = await browserTabPool.snapshot(pairTab.id);
    const inputBox = pairSnap.elements.find((e) => e.role === "textbox")!;
    const hoverTarget = pairSnap.elements.find((e) => e.name.includes("Hover Menu Trigger"))!;

    // Click input to focus it, then type "Rico" + Enter via raw CDP keyDown/keyUp events
    await browserTabPool.act({
      tabId: pairTab.id,
      action: "click",
      ref: inputBox.ref,
      generation: pairSnap.generation,
    });

    for (const ch of ["R", "i", "c", "o"]) {
      await browserTabPool.dispatchKeyEvent(
        { eventType: "keyDown", key: ch, text: ch },
        pairTab.id
      );
      await browserTabPool.dispatchKeyEvent(
        { eventType: "keyUp", key: ch },
        pairTab.id
      );
    }
    await browserTabPool.dispatchKeyEvent(
      { eventType: "keyDown", key: "Enter" },
      pairTab.id
    );
    await browserTabPool.dispatchKeyEvent(
      { eventType: "keyUp", key: "Enter" },
      pairTab.id
    );

    // Hover over #hover-target via CDP mouseMoved
    const hoverHit = await browserTabPool.dispatchMouseMove(
      hoverTarget.rect.x + 20,
      hoverTarget.rect.y + 15,
      0,
      pairTab.id
    );
    assert.equal(hoverHit?.ref, hoverTarget.ref, "dispatchMouseMove must return hovered @eN element");

    const pairPage = browserTabPool.getPage(pairTab.id)!;
    const keyStatus = await pairPage.locator("#key-status").innerText();
    const hoverAttr = await pairPage.locator("#hover-target").getAttribute("data-hovered");
    assert.equal(keyStatus, "submitted:13:Rico", "CDP keyDown/char/keyUp + virtualKeyCode=13 must populate input & submit");
    assert.equal(hoverAttr, "yes", "CDP mouseMoved must trigger live DOM hover listener");
    console.log(`   ✅ CDP keyDown/char/keyUp (${keyStatus}) and mouseMoved hover verified.`);

    // 6. Zephium Help-the-Agent Login / 2FA Wall Detector (Continue / Skip / +90s)
    console.log("\n[Test 6] Zephium Help-the-Agent Login & 2FA Wall Detector...");
    const loginTab = cappedPool.tabs.find((t) => t.url.includes("/login"))!;
    const twoFaTab = cappedPool.tabs.find((t) => t.url.includes("/2fa"))!;

    const loginSnap = await browserTabPool.snapshot(loginTab.id);
    assert.equal(loginSnap.wall?.detected, true);
    assert.equal(loginSnap.wall?.kind, "LOGIN_WALL");

    const baseExpiry = loginSnap.wall!.expiresAt;
    const extendedWall = await browserTabPool.resolveWall("extend_90s", loginTab.id);
    assert.ok(
      extendedWall && extendedWall.expiresAt >= baseExpiry + 85_000,
      "+90s must extend wall countdown timer by ~90 seconds"
    );

    const continuedWall = await browserTabPool.resolveWall("continue", loginTab.id);
    assert.equal(continuedWall?.detected, false);
    assert.equal(continuedWall?.resolution, "continued");

    const twoFaSnap = await browserTabPool.snapshot(twoFaTab.id);
    assert.equal(twoFaSnap.wall?.detected, true);
    assert.equal(twoFaSnap.wall?.kind, "TWO_FACTOR_AUTH");
    const skippedWall = await browserTabPool.resolveWall("skip", twoFaTab.id);
    assert.equal(skippedWall?.detected, false);
    assert.equal(skippedWall?.resolution, "skipped");
    console.log("   ✅ LOGIN_WALL, TWO_FACTOR_AUTH, +90s, Continue, and Skip verified.");

    // 7. Adblock, Cosmetic Cookie Blocker, DialogGate, Ring Buffers & DOM-Substring Price Grounding
    console.log("\n[Test 7] Adblock, Cosmetic Cookie Blocker, DialogGate, Ring Buffers & Grounding...");
    const guardTab = await browserTabPool.openTab({
      url: `${server.baseUrl}/guards`,
      focus: true,
    });
    await new Promise((r) => setTimeout(r, 200));

    const guardSnap = await browserTabPool.snapshot(guardTab.id);
    const guardDiag = browserTabPool.getDiagnostics(guardTab.id)!;

    // JS alert() and confirm() on /guards must have been auto-dismissed without hanging
    assert.ok(
      guardDiag.interceptedDialogsCount >= 2,
      `DialogGate should intercept >=2 dialogs, got ${guardDiag.interceptedDialogsCount}`
    );

    // Google Analytics script must have been blocked by Adblock route guard
    assert.ok(
      guardDiag.blockedTrackersCount >= 1,
      `Adblock should block >=1 tracker request, got ${guardDiag.blockedTrackersCount}`
    );

    // Cosmetic Cookie Blocker must hide #onetrust-consent-sdk so its button never pollutes AXTree
    const leakedCookieBtn = guardSnap.elements.find((e) =>
      e.name.includes("Accept All Tracking Cookies")
    );
    assert.equal(leakedCookieBtn, undefined, "Cosmetic cookie blocker must hide #onetrust-consent-sdk");

    // Console ring buffer must redact Bearer token
    const bearerLog = guardDiag.console.find((c) => c.text.includes("Session initialized"));
    assert.ok(bearerLog, "Console ring buffer must record page console.log");
    assert.ok(
      bearerLog.text.includes("[REDACTED]") &&
        !bearerLog.text.includes("superSecretBearerToken123456"),
      "Console ring buffer must redact Bearer token"
    );

    // DOM-substring price grounding: visible $15.49 passes; hidden $99.99 and fake $42.42 fail
    const validGround = await browserTabPool.verifyGroundedPrice(
      15.49,
      "USD",
      "monthly",
      guardTab.id
    );
    assert.equal(validGround.grounded, true, "Visible $15.49 must pass DOM-substring grounding");
    assert.equal(validGround.matchedSubstring, "$15.49");

    const hiddenGround = await browserTabPool.verifyGroundedPrice(
      99.99,
      "USD",
      "monthly",
      guardTab.id
    );
    assert.equal(hiddenGround.grounded, false, "display:none $99.99 must fail DOM grounding");

    const hallucinatedGround = await browserTabPool.verifyGroundedPrice(
      42.42,
      "USD",
      "monthly",
      guardTab.id
    );
    assert.equal(hallucinatedGround.grounded, false, "Non-existent $42.42 must fail DOM grounding");

    console.log(
      `   ✅ DialogGate (${guardDiag.interceptedDialogsCount} dialogs), Adblock (${guardDiag.blockedTrackersCount} trackers), Cookie Shield, Redacted Ring Buffers, and DOM Grounding verified.`
    );

    console.log("\n==================================================");
    console.log("🎉 All 7 OpenCode V2 × Zephium Semantic Browser Tests PASSED!");
    console.log("==================================================");
  } finally {
    await browserTabPool.closeAll();
    await server.close();
  }
}

runSemanticBrowserV2Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Semantic Browser V2 test failed:", err);
    process.exit(1);
  });
