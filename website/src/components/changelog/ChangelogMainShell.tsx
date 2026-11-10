import React from "react";
import Link from "next/link";

function BulletItem({
  itemId,
  itemName,
  wrapId,
  wrapName,
  dotId,
  dotName,
  textId,
  textName,
  flexText = false,
  children,
}: {
  itemId: string;
  itemName: string;
  wrapId: string;
  wrapName: string;
  dotId: string;
  dotName: string;
  textId: string;
  textName: string;
  flexText?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-pencil-id={itemId}
      data-pencil-name={itemName}
      className="box-border w-full h-fit shrink-0 flex flex-row gap-[11px] justify-start items-start"
    >
      <div
        data-pencil-id={wrapId}
        data-pencil-name={wrapName}
        className="box-border w-[7px] shrink-0 h-[20px] flex flex-row gap-0 p-[9px_0px_0px_2px] justify-start items-start"
      >
        <div
          data-pencil-id={dotId}
          data-pencil-name={dotName}
          className="box-border w-[5px] shrink-0 h-[5px] bg-[#FFFFFF4D] rounded-[50%]"
        />
      </div>
      <div
        data-pencil-id={textId}
        data-pencil-name={textName}
        className={`text-[15.5px]/[24px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left ${
          flexText ? "[flex:1_1_0]" : "[white-space:nowrap]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ChangelogMainShell() {
  return (
    <div
      data-pencil-id="u6uGf5"
      data-pencil-name="Changelog Main Shell"
      className="box-border w-[1440px] h-fit shrink-0 flex flex-col gap-0 p-[112px_120px_16px_120px] justify-start items-center bg-[#09090B]"
    >
      <div
        data-pencil-id="KzlZf"
        data-pencil-name="Changelog Top Block"
        className="box-border w-[960px] h-fit shrink-0 flex flex-col gap-0 justify-start items-center bg-[#09090B]"
      >
        <div
          data-pencil-id="aOCDZ"
          data-pencil-name="Changelog Header"
          className="box-border w-[736px] h-fit shrink-0 flex flex-col gap-[20px] justify-start items-center"
        >
          <div
            data-pencil-id="uD8g1"
            data-pencil-name="Changelog Title"
            className="text-[68px]/[68px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-3.06px] text-center [white-space:nowrap]"
          >
            Changelog
          </div>
          <div
            data-pencil-id="CkE0r"
            data-pencil-name="Changelog Lede"
            className="text-[20px]/[30px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-center [white-space:nowrap]"
          >
            New in RICO, release by release.
          </div>
        </div>
        <div
          data-pencil-id="C6DRoS"
          data-pencil-name="Changelog Feed Row"
          className="box-border w-full h-fit shrink-0 flex flex-row gap-[20px] p-[48px_0px_0px_0px] justify-end items-center"
        >
          <Link
            href="/roadmap"
            data-pencil-id="uPT10"
            data-pencil-name="Feed Roadmap Link"
            className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap] no-underline"
          >
            Roadmap
          </Link>
          <div
            data-pencil-id="KM3QG"
            data-pencil-name="Feed RSS Link"
            className="box-border w-fit shrink-0 h-[24px] flex flex-row gap-[6px] justify-start items-center"
          >
            <svg
              data-pencil-id="BdnQf"
              data-pencil-name="RSS Icon"
              viewBox="0 0 24 24"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
            >
              <path
                d="M19.5 19.5c0-8.2843-6.7157-15-15-15m8 15c0-4.4183-3.58172-8-8-8m0.75 7.5h-0.25m0.5 0c0 0.2761-0.22386 0.5-0.5 0.5-0.27614 0-0.5-0.2239-0.5-0.5 0-0.2761 0.22386-0.5 0.5-0.5 0.27614 0 0.5 0.2239 0.5 0.5z"
                fill="none"
                stroke="#F4F4F66B"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div
              data-pencil-id="IUg6Z"
              data-pencil-name="RSS Label"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              RSS feed
            </div>
          </div>
        </div>
      </div>

      <div
        data-pencil-id="hjw1v"
        data-pencil-name="Changelog Releases List"
        className="box-border w-[960px] h-fit shrink-0 flex flex-col gap-0 p-[12px_0px_0px_0px] justify-start items-start bg-[#09090B]"
      >
        {/* Release 1.0.4 */}
        <div
          data-pencil-id="HHB3l"
          data-pencil-name="Release 1.0.4"
          className="[box-sizing:content-box] w-[960px] h-[2194.5px] shrink-0 flex flex-row gap-[48px] p-[40px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF14] [margin:-0.5px_0px_0px_0px]"
        >
          <div
            data-pencil-id="fZ4Fd"
            data-pencil-name="1.0.4 Meta"
            className="box-border w-[176px] shrink-0 h-fit flex flex-col gap-[6px] justify-start items-start"
          >
            <div
              data-pencil-id="ZHwAh"
              data-pencil-name="1.0.4 Version"
              className="text-[20px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.4px] text-left [white-space:nowrap]"
            >
              1.0.4
            </div>
            <div
              data-pencil-id="vvfm9"
              data-pencil-name="1.0.4 Date"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              October 28, 2026
            </div>
            <div
              data-pencil-id="KQMu4"
              data-pencil-name="1.0.4 Latest Pill"
              className="box-border w-fit h-[22px] shrink-0 flex flex-row gap-0 p-[0px_9px] justify-center items-center [outline:1px_solid_#FFFFFF33] [outline-offset:-0.5px] rounded-[999px]"
            >
              <div
                data-pencil-id="AwjkA"
                data-pencil-name="Latest Label"
                className="text-[12px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium text-left [white-space:nowrap]"
              >
                Latest
              </div>
            </div>
          </div>

          <div
            data-pencil-id="f4KWP"
            data-pencil-name="1.0.4 Body"
            className="box-border w-[736px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
          >
            <div
              data-pencil-id="pKjRT"
              data-pencil-name="1.0.4 Headline"
              className="text-[33.6px]/[37px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.176px] text-left [white-space:nowrap]"
            >
              Shaped by the first week
            </div>
            <div
              data-pencil-id="CHpCk"
              data-pencil-name="1.0.4 Summary Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[14px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="Xswau"
                data-pencil-name="1.0.4 Summary"
                className="text-[17px]/[26px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Four days after launch: a collapsible command center, a live 30 FPS viewport,
                <br />
                the everyday guardrails a financial agent needs, Dual-Rail Vault failover, and
                <br />
                fixes sent in by people who use RICO.
              </div>
            </div>

            <div
              data-pencil-id="d8Ijb"
              data-pencil-name="Section Highlights"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="JGDNX"
                data-pencil-name="Highlights Heading"
                className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
              >
                Highlights
              </div>
              <div
                data-pencil-id="craMj"
                data-pencil-name="Highlights List"
                className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
              >
                <BulletItem
                  itemId="WwNqY"
                  itemName="Highlights Item 1"
                  wrapId="KrBNi"
                  wrapName="Highlights Dot Wrap 1"
                  dotId="yDMEf"
                  dotName="Highlights Dot 1"
                  textId="omEC8"
                  textName="Highlights Text 1"
                >
                  The sidebar hides. Press its toggle, then move to the left edge of the window to
                  bring it back over
                  <br />
                  the page.
                </BulletItem>
                <BulletItem
                  itemId="DIVQP"
                  itemName="Highlights Item 2"
                  wrapId="WWo07"
                  wrapName="Highlights Dot Wrap 2"
                  dotId="ArDGm"
                  dotName="Highlights Dot 2"
                  textId="AsPzs"
                  textName="Highlights Text 2"
                >
                  Customize the command center: switch between Split View, Chat Only and Dashboard
                  Only, or toggle Dark and Light mode.
                </BulletItem>
                <BulletItem
                  itemId="LbTBg"
                  itemName="Highlights Item 3"
                  wrapId="v3SavR"
                  wrapName="Highlights Dot Wrap 3"
                  dotId="A6YU7l"
                  dotName="Highlights Dot 3"
                  textId="t59rPs"
                  textName="Highlights Text 3"
                >
                  Generative receipt cards display verified price, budget ceiling and order ID
                  inline.
                </BulletItem>
                <BulletItem
                  itemId="f9Rgx"
                  itemName="Highlights Item 4"
                  wrapId="kojdL"
                  wrapName="Highlights Dot Wrap 4"
                  dotId="J0ILM4"
                  dotName="Highlights Dot 4"
                  textId="QjQi9"
                  textName="Highlights Text 4"
                >
                  RICO opens directly into the split-screen command center with active mandates
                  loaded.
                </BulletItem>
                <BulletItem
                  itemId="yrtKn"
                  itemName="Highlights Item 5"
                  wrapId="VEuTm"
                  wrapName="Highlights Dot Wrap 5"
                  dotId="CLNW5"
                  dotName="Highlights Dot 5"
                  textId="hZ4qd"
                  textName="Highlights Text 5"
                >
                  Calm Pricing Lens strips hidden per-seat fees into clean tier cards across the
                  WebApp.
                </BulletItem>
              </div>
            </div>

            <div
              data-pencil-id="Kj9ph"
              data-pencil-name="1.0.4 All Changes Outer"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="zkVKH"
                data-pencil-name="1.0.4 All Changes Box"
                className="[box-sizing:content-box] [flex:1_1_0] h-[1553px] flex flex-col gap-0 p-[0px_0px_28px_0px] justify-start items-start [border-width:1px_0px_1px_0px] [border-style:solid] [border-color:#FFFFFF1F] [margin:-0.5px_0px_-0.5px_0px] w-[736px]"
              >
                <div
                  data-pencil-id="ai7GS"
                  data-pencil-name="1.0.4 All Changes Summary"
                  className="box-border w-full h-[48px] shrink-0 flex flex-row gap-0 p-[0px_12px] justify-between items-center"
                >
                  <div
                    data-pencil-id="t2eFPu"
                    data-pencil-name="1.0.4 All Changes Label"
                    className="text-[14.5px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.07px] text-left [white-space:nowrap]"
                  >
                    All changes (33)
                  </div>
                  <svg
                    data-pencil-id="KU04g"
                    data-pencil-name="1.0.4 All Changes Chevron Up"
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                  >
                    <path
                      d="M6 15c0 0 4.4189-6 6-6 1.5812 0 6 6 6 6"
                      fill="none"
                      stroke="#F4F4F6A3"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* Section Browse (Command Center) */}
                <div
                  data-pencil-id="fUZEX"
                  data-pencil-name="Section Browse"
                  className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[8px_0px_0px_0px] justify-start items-start"
                >
                  <div
                    data-pencil-id="dw675"
                    data-pencil-name="Browse Heading"
                    className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
                  >
                    Command Center
                  </div>
                  <div
                    data-pencil-id="w2s6J"
                    data-pencil-name="Browse List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
                  >
                    <BulletItem itemId="CbywV" itemName="Browse Item 1" wrapId="eRXmI" wrapName="Browse Dot Wrap 1" dotId="zvKjJ" dotName="Browse Dot 1" textId="y6L0b" textName="Browse Text 1">
                      A merchant check that times out explains why and offers Retry or Manual Takeover.
                    </BulletItem>
                    <BulletItem itemId="KjTJN" itemName="Browse Item 2" wrapId="vHmib" wrapName="Browse Dot Wrap 2" dotId="yy6VG" dotName="Browse Dot 2" textId="J7qz2" textName="Browse Text 2">
                      Audit Logs record every mandate creation, price verification, guardrail halt and capture.
                    </BulletItem>
                    <BulletItem itemId="f9hNmo" itemName="Browse Item 3" wrapId="X6un1" wrapName="Browse Dot Wrap 3" dotId="I7WeiC" dotName="Browse Dot 3" textId="ZSFBI" textName="Browse Text 3">
                      Pausing a mandate immediately halts scheduled background runs.
                    </BulletItem>
                    <BulletItem itemId="vXdMZ" itemName="Browse Item 4" wrapId="F6O3vS" wrapName="Browse Dot Wrap 4" dotId="aGv4L" dotName="Browse Dot 4" textId="C0CKX" textName="Browse Text 4">
                      Long-running tasks pause and resume, and risky actions ask before they are kept.
                    </BulletItem>
                    <BulletItem itemId="E7GOd" itemName="Browse Item 5" wrapId="C2pha" wrapName="Browse Dot Wrap 5" dotId="WnuqN" dotName="Browse Dot 5" textId="G13Li" textName="Browse Text 5">
                      Merchants that require 2FA or CAPTCHA trigger the interactive Takeover Challenge modal.
                    </BulletItem>
                    <BulletItem itemId="IxQkK" itemName="Browse Item 6" wrapId="F2wt7" wrapName="Browse Dot Wrap 6" dotId="CWPNZ" dotName="Browse Dot 6" textId="fGYQU" textName="Browse Text 6">
                      One status badge in the header shows Sandbox connection, active mandates count and approval mode.
                    </BulletItem>
                    <BulletItem itemId="RgRem" itemName="Browse Item 7" wrapId="v4RSjV" wrapName="Browse Dot Wrap 7" dotId="fbpDY" dotName="Browse Dot 7" textId="sI7Tu" textName="Browse Text 7">
                      Persona selector switches between Startup Founder, Student and SMB savings profiles.
                    </BulletItem>
                    <BulletItem itemId="Y5eLpY" itemName="Browse Item 8" wrapId="qJIWq" wrapName="Browse Dot Wrap 8" dotId="NpgN8" dotName="Browse Dot 8" textId="EitPG" textName="Browse Text 8">
                      Webhook endpoints for Telegram, WhatsApp and Slack interactive callbacks.
                    </BulletItem>
                    <BulletItem itemId="T69N7" itemName="Browse Item 9" wrapId="p1kQtl" wrapName="Browse Dot Wrap 9" dotId="irozQ" dotName="Browse Dot 9" textId="ppEcQ" textName="Browse Text 9">
                      Quick Command Launcher (⌘K) searches mandates, transactions and audit logs instantly.
                    </BulletItem>
                    <BulletItem itemId="Ewxiv" itemName="Browse Item 10" wrapId="S7XGvd" wrapName="Browse Dot Wrap 10" dotId="HtMwJ" dotName="Browse Dot 10" textId="hmmM3" textName="Browse Text 10">
                      Import recurring subscriptions from CSV or natural-language chat prompts with automatic baseline price checks.
                    </BulletItem>
                    <BulletItem itemId="wnple" itemName="Browse Item 11" wrapId="NAfVC" wrapName="Browse Dot Wrap 11" dotId="H7OPS" dotName="Browse Dot 11" textId="qqsWb" textName="Browse Text 11">
                      Each mandate stores its own recurrence schedule and hard budget cap.
                    </BulletItem>
                  </div>
                </div>

                {/* Section Windows (Verification Engine) */}
                <div
                  data-pencil-id="D0ChM"
                  data-pencil-name="Section Windows"
                  className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
                >
                  <div
                    data-pencil-id="kJbCO"
                    data-pencil-name="Windows Heading"
                    className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
                  >
                    Verification Engine
                  </div>
                  <div
                    data-pencil-id="RONVo"
                    data-pencil-name="Windows List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
                  >
                    <BulletItem itemId="IdzxN" itemName="Windows Item 1" wrapId="n8mTje" wrapName="Windows Dot Wrap 1" dotId="B2C2P" dotName="Windows Dot 1" textId="S6mmB" textName="Windows Text 1">
                      Cryptographic proof snapshots save cleanly alongside every receipt.
                    </BulletItem>
                    <BulletItem itemId="EyGW7" itemName="Windows Item 2" wrapId="X8W0dq" wrapName="Windows Dot Wrap 2" dotId="a4t2NI" dotName="Windows Dot 2" textId="AXJlI" textName="Windows Text 2">
                      Switching between parallel helper tabs in the live viewport is now instant.
                    </BulletItem>
                    <BulletItem itemId="Guwwd" itemName="Windows Item 3" wrapId="DuOCB" wrapName="Windows Dot Wrap 3" dotId="zi2fM" dotName="Windows Dot 3" textId="kKRG1" textName="Windows Text 3">
                      Quick Command Launcher shortcuts work everywhere: ⌘K, Ctrl+K, and natural-language triggers.
                    </BulletItem>
                    <BulletItem itemId="J26Nfb" itemName="Windows Item 4" wrapId="M7PPF" wrapName="Windows Dot Wrap 4" dotId="E0goJm" dotName="Windows Dot 4" textId="MsQLr" textName="Windows Text 4">
                      A merchant page that requires 2FA or CAPTCHA triggers Live Human Takeover mode.
                    </BulletItem>
                    <BulletItem itemId="ANZZ0" itemName="Windows Item 5" wrapId="DodFT" wrapName="Windows Dot Wrap 5" dotId="LSr6b" dotName="Windows Dot 5" textId="vNQi0" textName="Windows Text 5">
                      Parallel helper bots now scrape up to three merchant pricing pages concurrently.
                    </BulletItem>
                    <BulletItem itemId="HfoHY" itemName="Windows Item 6" wrapId="qOByl" wrapName="Windows Dot Wrap 6" dotId="T67o2U" dotName="Windows Dot 6" textId="fHdsA" textName="Windows Text 6">
                      If a mandate halts on a price spike, RICO explains why in plain words and logs the diff.
                    </BulletItem>
                    <BulletItem itemId="fgbCn" itemName="Windows Item 7" wrapId="yh9ie" wrapName="Windows Dot Wrap 7" dotId="sETxR" dotName="Windows Dot 7" textId="RirIB" textName="Windows Text 7">
                      A Strict Approval toggle in the header lets you require manual confirmation on every run.
                    </BulletItem>
                  </div>
                </div>

                {/* Section macOS (Payment Rails & Sentinel) */}
                <div
                  data-pencil-id="tv9uP"
                  data-pencil-name="Section macOS"
                  className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
                >
                  <div
                    data-pencil-id="AgsCz"
                    data-pencil-name="macOS Heading"
                    className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
                  >
                    Payment Rails &amp; Sentinel
                  </div>
                  <div
                    data-pencil-id="i5rDi9"
                    data-pencil-name="macOS List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
                  >
                    <BulletItem itemId="uqvWi" itemName="macOS Item 1" wrapId="qXWar" wrapName="macOS Dot Wrap 1" dotId="uzOtL" dotName="macOS Dot 1" textId="hV7tc" textName="macOS Text 1">
                      Zero-Knowledge Vault tokens persist across sessions in SQLite without re-entering card details.
                    </BulletItem>
                    <BulletItem itemId="D9jRMB" itemName="macOS Item 2" wrapId="w1vx1B" wrapName="macOS Dot Wrap 2" dotId="G2lNy" dotName="macOS Dot 2" textId="b530m" textName="macOS Text 2">
                      Automatic failover routes to backup Visa or Mastercard when a merchant requires direct card billing.
                    </BulletItem>
                    <BulletItem itemId="V1KxJ2" itemName="macOS Item 3" wrapId="Ja6hZ" wrapName="macOS Dot Wrap 3" dotId="PBLWl" dotName="macOS Dot 3" textId="WllZP" textName="macOS Text 3">
                      24/7 Price Sentinel dispatches interactive Approve and Cancel buttons to Telegram and WhatsApp.
                    </BulletItem>
                    <BulletItem itemId="ZeTSj" itemName="macOS Item 4" wrapId="o6qqm" wrapName="macOS Dot Wrap 4" dotId="hPq1K" dotName="macOS Dot 4" textId="djQmM" textName="macOS Text 4">
                      Persona Savings Probe checks $50k PostHog and Notion startup credits before capturing payment.
                    </BulletItem>
                  </div>
                </div>

                {/* Section Work and Ask RICO */}
                <div
                  data-pencil-id="i1kiH"
                  data-pencil-name="Section Work and Ask RICO"
                  className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
                >
                  <div
                    data-pencil-id="KBgKe"
                    data-pencil-name="Work and Ask RICO Heading"
                    className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
                  >
                    Work and Ask RICO
                  </div>
                  <div
                    data-pencil-id="m4ltGC"
                    data-pencil-name="Work and Ask RICO List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
                  >
                    <BulletItem itemId="zUjRV" itemName="Work and Ask RICO Item 1" wrapId="ROTCd" wrapName="Work and Ask RICO Dot Wrap 1" dotId="Bn4pT" dotName="Work and Ask RICO Dot 1" textId="TuGLF" textName="Work and Ask RICO Text 1" flexText>
                      A free Groq key that runs into its limit now says so, and what to do, instead of failing without a reason.
                      <br />
                      Qwen 3.8 27B is available on Groq.
                    </BulletItem>
                    <BulletItem itemId="XE2vS" itemName="Work and Ask RICO Item 2" wrapId="pYrl1" wrapName="Work and Ask RICO Dot Wrap 2" dotId="N5EJIu" dotName="Work and Ask RICO Dot 2" textId="QYRJe" textName="Work and Ask RICO Text 2">
                      A helper no longer gets stuck when a model sends empty fields along with its request.
                    </BulletItem>
                    <BulletItem itemId="bLEaf" itemName="Work and Ask RICO Item 3" wrapId="Qjs6n" wrapName="Work and Ask RICO Dot Wrap 3" dotId="b56sC" dotName="Work and Ask RICO Dot 3" textId="K0GufN" textName="Work and Ask RICO Text 3">
                      Runs using your own Cloud BYOK API key consume zero RICO platform credits.
                    </BulletItem>
                    <BulletItem itemId="FAEIH" itemName="Work and Ask RICO Item 4" wrapId="cy97X" wrapName="Work and Ask RICO Dot Wrap 4" dotId="T70NQ" dotName="Work and Ask RICO Dot 4" textId="v0Bjk" textName="Work and Ask RICO Text 4">
                      What Ask RICO writes can be selected and copied.
                    </BulletItem>
                  </div>
                </div>

                {/* Section Security and privacy */}
                <div
                  data-pencil-id="mxrjx"
                  data-pencil-name="Section Security and privacy"
                  className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
                >
                  <div
                    data-pencil-id="Cux40"
                    data-pencil-name="Security and privacy Heading"
                    className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
                  >
                    Security and privacy
                  </div>
                  <div
                    data-pencil-id="vZWXz"
                    data-pencil-name="Security and privacy List"
                    className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
                  >
                    <BulletItem itemId="TYwBU" itemName="Security and privacy Item 1" wrapId="Y7DpaV" wrapName="Security and privacy Dot Wrap 1" dotId="JeGyu" dotName="Security and privacy Dot 1" textId="dk6hv" textName="Security and privacy Text 1">
                      Payment tokens are isolated per workspace: AI models never receive raw card numbers or CVVs.
                    </BulletItem>
                    <BulletItem itemId="T1NIk" itemName="Security and privacy Item 2" wrapId="f4o3b" wrapName="Security and privacy Dot Wrap 2" dotId="i2Cnu3" dotName="Security and privacy Dot 2" textId="ACmU2" textName="Security and privacy Text 2">
                      A saved API key is only ever sent to the model provider it was configured for.
                    </BulletItem>
                    <BulletItem itemId="n8aczB" itemName="Security and privacy Item 3" wrapId="dRaJH" wrapName="Security and privacy Dot Wrap 3" dotId="mFLVP" dotName="Security and privacy Dot 3" textId="Xc2sr" textName="Security and privacy Text 3">
                      Ask RICO asks before it searches, and shows the exact query and where it goes. Allowing history
                      <br />
                      no longer shares your open tabs.
                    </BulletItem>
                    <BulletItem itemId="E1Pz11" itemName="Security and privacy Item 4" wrapId="GTWZ4" wrapName="Security and privacy Dot Wrap 4" dotId="MehJE" dotName="Security and privacy Dot 4" textId="R52rgd" textName="Security and privacy Text 4" flexText>
                      Every mandate execution is bound to its verified budget ceiling, so a price spike can never auto-capture.
                    </BulletItem>
                    <BulletItem itemId="UaYX5" itemName="Security and privacy Item 5" wrapId="IyXQr" wrapName="Security and privacy Dot Wrap 5" dotId="AoQ5h" dotName="Security and privacy Dot 5" textId="I0LmP" textName="Security and privacy Text 5">
                      Clear workspace data resets local mandates, transaction history and audit logs cleanly.
                    </BulletItem>
                    <BulletItem itemId="Pp2I6" itemName="Security and privacy Item 6" wrapId="y5kxMn" wrapName="Security and privacy Dot Wrap 6" dotId="Y6q4m" dotName="Security and privacy Dot 6" textId="r6J9U" textName="Security and privacy Text 6">
                      Notes are not overwritten by a quick edit made outside RICO, and deleting a profile waits for its
                      <br />
                      notes, so deleted notes cannot come back.
                    </BulletItem>
                    <BulletItem itemId="Y0NJL2" itemName="Security and privacy Item 7" wrapId="k6Xcm" wrapName="Security and privacy Dot Wrap 7" dotId="Gt9P8" dotName="Security and privacy Dot 7" textId="axsGt" textName="Security and privacy Text 7">
                      No payment capture ever executes when a scraped price exceeds your mandate ceiling.
                    </BulletItem>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-pencil-id="kCPLt"
              data-pencil-name="1.0.4 Thanks Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="iczx0"
                data-pencil-name="1.0.4 Thanks"
                className="text-[14.5px]/[22px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Thanks to @mydd7, @kd100100, @nduongg04 and @ErnieBernie10, and welcome to the three
                of
                <br />
                you who contributed for the first time.
              </div>
            </div>

            <div
              data-pencil-id="hJWHo"
              data-pencil-name="1.0.4 Links Wrap"
              className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] p-[36px_0px_0px_0px] justify-start items-center"
            >
              <div
                data-pencil-id="LOVQ4"
                data-pencil-name="1.0.4 GitHub Button"
                className="box-border w-fit shrink-0 h-[42px] flex flex-row gap-[8px] p-[0px_18px] justify-center items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
              >
                <div
                  data-pencil-id="xsHOs"
                  data-pencil-name="1.0.4 GitHub Label"
                  className="text-[14.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.145px] text-left [white-space:nowrap]"
                >
                  Release on GitHub
                </div>
                <svg
                  data-pencil-id="lt3jh"
                  data-pencil-name="1.0.4 GitHub Arrow"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
                >
                  <path
                    d="M9 6.65032c0 0 6.9383-0.54273 7.9154 0.43431 0.977 0.97704 0.4342 7.91537 0.4342 7.91537m-0.8496-7.5l-10 10"
                    fill="none"
                    stroke="#F4F4F6"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Release 1.0.3 */}
        <div
          data-pencil-id="hEcUv"
          data-pencil-name="Release 1.0.3"
          className="[box-sizing:content-box] w-[960px] h-[676.5px] shrink-0 flex flex-row gap-[48px] p-[40px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF14] [margin:-0.5px_0px_0px_0px]"
        >
          <div
            data-pencil-id="G5G9u"
            data-pencil-name="1.0.3 Meta"
            className="box-border w-[176px] shrink-0 h-fit flex flex-col gap-[6px] justify-start items-start"
          >
            <div
              data-pencil-id="dTwgM"
              data-pencil-name="1.0.3 Version"
              className="text-[20px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.4px] text-left [white-space:nowrap]"
            >
              1.0.3
            </div>
            <div
              data-pencil-id="eQODd"
              data-pencil-name="1.0.3 Date"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              October 24, 2026
            </div>
          </div>
          <div
            data-pencil-id="XYlA0"
            data-pencil-name="1.0.3 Body"
            className="box-border w-[736px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
          >
            <div
              data-pencil-id="z1per"
              data-pencil-name="1.0.3 Headline"
              className="text-[33.6px]/[37px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.176px] text-left [white-space:nowrap]"
            >
              RICO, in public
            </div>
            <div
              data-pencil-id="iO0i6"
              data-pencil-name="1.0.3 Summary Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[14px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="POmPQ"
                data-pencil-name="1.0.3 Summary"
                className="text-[17px]/[26px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                The public release. A redesigned RICO command center, Ask RICO streaming chat,
                <br />
                Calm Pricing Lens, and RICO AI for autonomous mandate execution.
              </div>
            </div>

            <div
              data-pencil-id="wryq2"
              data-pencil-name="1.0.3 Section Highlights"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="D0Sts"
                data-pencil-name="1.0.3 Highlights Heading"
                className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
              >
                Highlights
              </div>
              <div
                data-pencil-id="h6DdU"
                data-pencil-name="1.0.3 Highlights List"
                className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
              >
                <BulletItem itemId="YbpB8" itemName="1.0.3 Highlights Item 1" wrapId="txCWt" wrapName="1.0.3 Highlights Dot Wrap 1" dotId="hwBR6" dotName="1.0.3 Highlights Dot 1" textId="VDntu" textName="1.0.3 Highlights Text 1">
                  A new interface throughout, quieter and more precise, with the window&apos;s own material behind the
                  <br />
                  sidebar and the window material of your choice.
                </BulletItem>
                <BulletItem itemId="nh5ee" itemName="1.0.3 Highlights Item 2" wrapId="VjNbU" wrapName="1.0.3 Highlights Dot Wrap 2" dotId="N8JcfC" dotName="1.0.3 Highlights Dot 2" textId="vzbFH" textName="1.0.3 Highlights Text 2">
                  The Financial Command Center displays active mandates, transaction receipts and PostHog telemetry side by side.
                </BulletItem>
                <BulletItem itemId="Q2GoC" itemName="1.0.3 Highlights Item 3" wrapId="QyGKD" wrapName="1.0.3 Highlights Dot Wrap 3" dotId="agpPi" dotName="1.0.3 Highlights Dot 3" textId="KU7RF" textName="1.0.3 Highlights Text 3">
                  Ask RICO, an assistant in the sidebar: it reads the page you are on, takes small steps on it when
                  <br />
                  you ask, restyles a site, and hands larger jobs to Work.
                </BulletItem>
                <BulletItem itemId="T8B0Z" itemName="1.0.3 Highlights Item 4" wrapId="TraCE" wrapName="1.0.3 Highlights Dot Wrap 4" dotId="G5jk6" dotName="1.0.3 Highlights Dot 4" textId="mWdxP" textName="1.0.3 Highlights Text 4">
                  RICO AI: sign in with an email code and get 1,000 free credits for your first month, then 250
                  <br />
                  free credits every month after.
                </BulletItem>
              </div>
            </div>

            <div
              data-pencil-id="dcn4N"
              data-pencil-name="1.0.3 All Changes Outer"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="k2mI5"
                data-pencil-name="1.0.3 All Changes Bar"
                className="[box-sizing:content-box] [flex:1_1_0] h-[47px] flex flex-row gap-0 p-[0px_12px] justify-between items-center [border-width:1px_0px_1px_0px] [border-style:solid] [border-color:#FFFFFF1F] [margin:-0.5px_0px_-0.5px_0px] w-[736px]"
              >
                <div
                  data-pencil-id="rWgVP"
                  data-pencil-name="1.0.3 All Changes Label"
                  className="text-[14.5px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.07px] text-left [white-space:nowrap]"
                >
                  All changes (10)
                </div>
                <svg
                  data-pencil-id="aGPRK"
                  data-pencil-name="1.0.3 All Changes Chevron Down"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                >
                  <path
                    d="M18 9.00005c0 0-4.4189 5.99995-6 5.99995-1.5812 0-6-6-6-6"
                    fill="none"
                    stroke="#F4F4F6A3"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>

            <div
              data-pencil-id="TIVnS"
              data-pencil-name="1.0.3 Thanks Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="aqyq8"
                data-pencil-name="1.0.3 Thanks"
                className="text-[14.5px]/[22px] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                Thanks to @drunkardleo-10 and @mydd7, and welcome to the two of you who contributed
                for
                <br />
                the first time.
              </div>
            </div>

            <div
              data-pencil-id="G3t9M"
              data-pencil-name="1.0.3 Links Wrap"
              className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] p-[36px_0px_0px_0px] justify-start items-center"
            >
              <div
                data-pencil-id="i7ZeeP"
                data-pencil-name="1.0.3 GitHub Button"
                className="box-border w-fit shrink-0 h-[42px] flex flex-row gap-[8px] p-[0px_18px] justify-center items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
              >
                <div
                  data-pencil-id="Fl79Z"
                  data-pencil-name="1.0.3 GitHub Label"
                  className="text-[14.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.145px] text-left [white-space:nowrap]"
                >
                  Release on GitHub
                </div>
                <svg
                  data-pencil-id="RYt1q"
                  data-pencil-name="1.0.3 GitHub Arrow"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
                >
                  <path
                    d="M9 6.65032c0 0 6.9383-0.54273 7.9154 0.43431 0.977 0.97704 0.4342 7.91537 0.4342 7.91537m-0.8496-7.5l-10 10"
                    fill="none"
                    stroke="#F4F4F6"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Release 1.0.0-beta.2 */}
        <div
          data-pencil-id="MYS8x"
          data-pencil-name="Release 1.0.0-beta.2"
          className="[box-sizing:content-box] w-[960px] h-[404.5px] shrink-0 flex flex-row gap-[48px] p-[40px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF14] [margin:-0.5px_0px_0px_0px]"
        >
          <div
            data-pencil-id="pG8OK"
            data-pencil-name="1.0.0-beta.2 Meta"
            className="box-border w-[176px] shrink-0 h-fit flex flex-col gap-[6px] justify-start items-start"
          >
            <div
              data-pencil-id="rzpsv"
              data-pencil-name="1.0.0-beta.2 Version"
              className="text-[20px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.4px] text-left [white-space:nowrap]"
            >
              1.0.0-beta.2
            </div>
            <div
              data-pencil-id="qY4xE"
              data-pencil-name="1.0.0-beta.2 Date"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              October 4, 2026
            </div>
          </div>
          <div
            data-pencil-id="Lg5Rn"
            data-pencil-name="1.0.0-beta.2 Body"
            className="box-border w-[736px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
          >
            <div
              data-pencil-id="c3RQkN"
              data-pencil-name="1.0.0-beta.2 Headline"
              className="text-[33.6px]/[37px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.176px] text-left [white-space:nowrap]"
            >
              Steadier updates
            </div>
            <div
              data-pencil-id="FI4mn"
              data-pencil-name="1.0.0-beta.2 Summary Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[14px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="yOw0G"
                data-pencil-name="1.0.0-beta.2 Summary"
                className="text-[17px]/[26px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                A small update that makes the next ones more dependable, and RICO a little
                <br />
                lighter and faster on the web.
              </div>
            </div>

            <div
              data-pencil-id="bJsUa"
              data-pencil-name="1.0.0-beta.2 Section Fixes"
              className="box-border w-full h-fit shrink-0 flex flex-col gap-[12px] p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="n9krxE"
                data-pencil-name="1.0.0-beta.2 Fixes Heading"
                className="text-[14px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.07px] text-left [white-space:nowrap]"
              >
                Fixes
              </div>
              <div
                data-pencil-id="x4WJ3L"
                data-pencil-name="1.0.0-beta.2 Fixes List"
                className="box-border w-full h-fit shrink-0 flex flex-col gap-[10px] justify-start items-start"
              >
                <BulletItem itemId="Wrkad" itemName="1.0.0-beta.2 Fixes Item 1" wrapId="t1Ie0S" wrapName="1.0.0-beta.2 Fixes Dot Wrap 1" dotId="j0IEtV" dotName="1.0.0-beta.2 Fixes Dot 1" textId="U4aQw" textName="1.0.0-beta.2 Fixes Text 1">
                  An update check that stops responding now gives up and tries again later, instead of
                  <br />
                  holding back updates until you refresh.
                </BulletItem>
                <BulletItem itemId="lnb9t" itemName="1.0.0-beta.2 Fixes Item 2" wrapId="Pccrs" wrapName="1.0.0-beta.2 Fixes Dot Wrap 2" dotId="IYERH" dotName="1.0.0-beta.2 Fixes Dot 2" textId="pHmyr" textName="1.0.0-beta.2 Fixes Text 2">
                  About 1 MB smaller bundle across the WebApp and API.
                </BulletItem>
              </div>
            </div>

            <div
              data-pencil-id="Vh4j7"
              data-pencil-name="1.0.0-beta.2 Links Wrap"
              className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] p-[36px_0px_0px_0px] justify-start items-center"
            >
              <div
                data-pencil-id="cbSZ7"
                data-pencil-name="1.0.0-beta.2 GitHub Button"
                className="box-border w-fit shrink-0 h-[42px] flex flex-row gap-[8px] p-[0px_18px] justify-center items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
              >
                <div
                  data-pencil-id="E2dW23"
                  data-pencil-name="1.0.0-beta.2 GitHub Label"
                  className="text-[14.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.145px] text-left [white-space:nowrap]"
                >
                  Release on GitHub
                </div>
                <svg
                  data-pencil-id="Vy6VB"
                  data-pencil-name="1.0.0-beta.2 GitHub Arrow"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
                >
                  <path
                    d="M9 6.65032c0 0 6.9383-0.54273 7.9154 0.43431 0.977 0.97704 0.4342 7.91537 0.4342 7.91537m-0.8496-7.5l-10 10"
                    fill="none"
                    stroke="#F4F4F6"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Release 1.0.0-beta.1 */}
        <div
          data-pencil-id="z2pMh"
          data-pencil-name="Release 1.0.0-beta.1"
          className="[box-sizing:content-box] w-[960px] h-[366.5px] shrink-0 flex flex-row gap-[48px] p-[40px_0px] justify-start items-start bg-[#09090B] [border-width:1px_0px_0px_0px] [border-style:solid] [border-color:#FFFFFF14] [margin:-0.5px_0px_0px_0px]"
        >
          <div
            data-pencil-id="GjGMq"
            data-pencil-name="1.0.0-beta.1 Meta"
            className="box-border w-[176px] shrink-0 h-fit flex flex-col gap-[6px] justify-start items-start"
          >
            <div
              data-pencil-id="dOffI"
              data-pencil-name="1.0.0-beta.1 Version"
              className="text-[20px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-0.4px] text-left [white-space:nowrap]"
            >
              1.0.0-beta.1
            </div>
            <div
              data-pencil-id="hMDqN"
              data-pencil-name="1.0.0-beta.1 Date"
              className="text-[14px]/[normal] box-border text-[#F4F4F66B] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
            >
              October 4, 2026
            </div>
          </div>
          <div
            data-pencil-id="mFRQ9"
            data-pencil-name="1.0.0-beta.1 Body"
            className="box-border w-[736px] shrink-0 h-fit flex flex-col gap-0 justify-start items-start"
          >
            <div
              data-pencil-id="I0ooDk"
              data-pencil-name="1.0.0-beta.1 Headline"
              className="text-[33.6px]/[37px] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-semibold tracking-[-1.176px] text-left [white-space:nowrap]"
            >
              The first public beta
            </div>
            <div
              data-pencil-id="p1WWA"
              data-pencil-name="1.0.0-beta.1 Summary Wrap"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[14px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="hN08I"
                data-pencil-name="1.0.0-beta.1 Summary"
                className="text-[17px]/[26px] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-normal text-left [white-space:nowrap]"
              >
                RICO&apos;s first public beta for the WebApp and API. An autonomous financial agent
                <br />
                with strict budget guardrails and live price verification, free and open source
                <br />
                under the MIT License.
              </div>
            </div>

            <div
              data-pencil-id="qGPai"
              data-pencil-name="1.0.0-beta.1 All Changes Outer"
              className="box-border w-full h-fit shrink-0 flex flex-row gap-0 p-[32px_0px_0px_0px] justify-start items-start"
            >
              <div
                data-pencil-id="G5hea"
                data-pencil-name="1.0.0-beta.1 All Changes Bar"
                className="[box-sizing:content-box] [flex:1_1_0] h-[47px] flex flex-row gap-0 p-[0px_12px] justify-between items-center [border-width:1px_0px_1px_0px] [border-style:solid] [border-color:#FFFFFF1F] [margin:-0.5px_0px_-0.5px_0px] w-[736px]"
              >
                <div
                  data-pencil-id="M4LT3"
                  data-pencil-name="1.0.0-beta.1 All Changes Label"
                  className="text-[14.5px]/[normal] box-border text-[#F4F4F6A3] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.07px] text-left [white-space:nowrap]"
                >
                  All changes (21)
                </div>
                <svg
                  data-pencil-id="PdLpD"
                  data-pencil-name="1.0.0-beta.1 All Changes Chevron Down"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[16px] shrink-0 h-[16px] overflow-visible"
                >
                  <path
                    d="M18 9.00005c0 0-4.4189 5.99995-6 5.99995-1.5812 0-6-6-6-6"
                    fill="none"
                    stroke="#F4F4F6A3"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>

            <div
              data-pencil-id="h88Fe8"
              data-pencil-name="1.0.0-beta.1 Links Wrap"
              className="box-border w-fit h-fit shrink-0 flex flex-row gap-[10px] p-[36px_0px_0px_0px] justify-start items-center"
            >
              <div
                data-pencil-id="f6php"
                data-pencil-name="1.0.0-beta.1 GitHub Button"
                className="box-border w-fit shrink-0 h-[42px] flex flex-row gap-[8px] p-[0px_18px] justify-center items-center bg-[#FFFFFF14] [outline:1px_solid_#FFFFFF24] [outline-offset:-0.5px] rounded-[999px]"
              >
                <div
                  data-pencil-id="gPFsS"
                  data-pencil-name="1.0.0-beta.1 GitHub Label"
                  className="text-[14.5px]/[normal] box-border text-[#F4F4F6] font-[Geist,system-ui,sans-serif] font-medium tracking-[-0.145px] text-left [white-space:nowrap]"
                >
                  Release on GitHub
                </div>
                <svg
                  data-pencil-id="Ukrus"
                  data-pencil-name="1.0.0-beta.1 GitHub Arrow"
                  viewBox="0 0 24 24"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="box-border w-[15px] shrink-0 h-[15px] overflow-visible"
                >
                  <path
                    d="M9 6.65032c0 0 6.9383-0.54273 7.9154 0.43431 0.977 0.97704 0.4342 7.91537 0.4342 7.91537m-0.8496-7.5l-10 10"
                    fill="none"
                    stroke="#F4F4F6"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
