import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

type Props = Record<string, unknown>;

const fps = 30;
const durationInFrames = 60 * fps;

const colors = {
  ink: "#19231f",
  muted: "#758079",
  paper: "#f5f2ea",
  line: "#d9d9d0",
  blue: "#7087df",
  blueDark: "#344685",
  mint: "#cfe8d5",
  mintDark: "#32634a",
  white: "#fffef9",
};

const calculateMetadata: CalculateMetadataFunction<Props> = () => ({
  durationInFrames,
  fps,
  width: 1920,
  height: 1080,
});

function appear(frame: number, start: number, end: number, offset = 32) {
  const opacity = interpolate(frame, [start, start + 18, end - 18, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translate = interpolate(frame, [start, start + 26], [offset, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return { opacity, translate: `0px ${translate}px` };
}

function Scene({ start, end, children }: { start: number; end: number; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={appear(frame, start, end)}>{children}</AbsoluteFill>;
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, color: dark ? colors.white : colors.ink }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: dark ? colors.blue : colors.ink, display: "grid", placeItems: "center" }}>
        <div style={{ width: 17, height: 17, border: `2px solid ${colors.white}`, borderRadius: 5, rotate: "45deg" }} />
      </div>
      <div>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>proofroom</div>
        <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.55 }}>private deal screening</div>
      </div>
    </div>
  );
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <div style={{ fontFamily: "monospace", color: dark ? "#aeb9ae" : colors.muted, fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>{children}</div>;
}

function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "mint" | "dark" }) {
  const background = tone === "mint" ? colors.mint : tone === "dark" ? "#26342d" : "#e2e7fb";
  const color = tone === "mint" ? colors.mintDark : tone === "dark" ? colors.white : colors.blueDark;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 9, borderRadius: 999, padding: "9px 14px", background, color, fontFamily: "monospace", fontSize: 12, letterSpacing: 0.4 }}>{children}</div>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div style={{ background: colors.white, border: `1px solid ${colors.line}`, borderRadius: 14, padding: "22px 24px", minWidth: 190 }}><div style={{ fontFamily: "monospace", fontSize: 12, color: colors.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div><div style={{ marginTop: 9, color: colors.blueDark, fontFamily: "Arial, sans-serif", fontWeight: 800, fontSize: 31 }}>{value}</div><div style={{ marginTop: 7, color: colors.muted, fontFamily: "monospace", fontSize: 11 }}>{note}</div></div>;
}

function Lock({ label }: { label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: 12, color: "#b4c5b5" }}><span style={{ width: 16, height: 16, border: "1px solid #b4c5b5", borderRadius: 4, display: "inline-block" }} />{label}</span>;
}

export const MyComposition = () => (
  <Composition id="ProofRoomDemo" component={ProofRoomVideo} durationInFrames={durationInFrames} fps={fps} width={1920} height={1080} calculateMetadata={calculateMetadata} />
);

export const ProofRoomVideo: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper, color: colors.ink, fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 0.33, backgroundImage: "linear-gradient(#dfe1d8 1px, transparent 1px), linear-gradient(90deg, #dfe1d8 1px, transparent 1px)", backgroundSize: "72px 72px", translate: `${scan * 42}px ${scan * -22}px` }} />
      <div style={{ position: "absolute", inset: 0, padding: "54px 78px" }}><Brand /></div>

      <Scene start={0} end={240}>
        <AbsoluteFill style={{ justifyContent: "center", padding: "0 170px" }}>
          <Eyebrow>PRIVATE M&A / MIDNIGHT</Eyebrow>
          <div style={{ marginTop: 26, maxWidth: 1100, fontSize: 96, lineHeight: 0.98, letterSpacing: -5, fontWeight: 800 }}>Screen a deal<br /><span style={{ color: colors.blueDark, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>without opening</span> the room.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 42 }}><Pill tone="dark">MIDNIGHT / LOCAL DEMO</Pill><span style={{ color: colors.muted, fontFamily: "monospace", fontSize: 15 }}>seller proves quality · buyer proves funds</span></div>
          <div style={{ position: "absolute", right: 170, bottom: 145, width: 290, borderLeft: `1px solid ${colors.blue}`, paddingLeft: 24 }}><Eyebrow>THE PRIVACY PROMISE</Eyebrow><div style={{ fontFamily: "Georgia, serif", fontSize: 31, lineHeight: 1.08, marginTop: 16 }}>“I can prove it.<br /><em>You don’t get to see it.”</em></div></div>
        </AbsoluteFill>
      </Scene>

      <Scene start={220} end={540}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 1360, display: "grid", gridTemplateColumns: "0.7fr 1.3fr", gap: 70, alignItems: "center" }}>
            <div><Eyebrow>01 / SELLER PROOF</Eyebrow><div style={{ fontSize: 59, lineHeight: 1.02, letterSpacing: -3, fontWeight: 800, marginTop: 20 }}>Prove the shape<br />of the business.</div><p style={{ color: colors.muted, fontSize: 21, lineHeight: 1.35, maxWidth: 440, marginTop: 26 }}>A signed fixture is evaluated locally. The chain learns only whether the policy passed.</p><Pill tone="mint"><span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.mintDark }} />PRIVATE WITNESSES</Pill></div>
            <div style={{ background: colors.white, border: `1px solid ${colors.line}`, borderRadius: 23, padding: 34, boxShadow: "0 24px 70px rgba(40, 50, 45, .10)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}><div style={{ fontFamily: "monospace", fontSize: 12, color: colors.muted, letterSpacing: 1 }}>STRIPE FIXTURE ATTESTATION</div><Pill tone="mint">SIGNED / LIVE</Pill></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}><Stat label="TTM revenue" value="$2.4m" note="hidden in proof" /><Stat label="Net retention" value="118%" note="hidden in proof" /><Stat label="Top customer" value="14%" note="hidden in proof" /><Stat label="Refund rate" value="2.1%" note="hidden in proof" /></div><div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${colors.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><Lock label="no metric sent to indexer" /><div style={{ background: colors.blue, color: colors.white, borderRadius: 10, padding: "13px 22px", fontWeight: 700 }}>Seller fit verified ✓</div></div></div>
          </div>
        </AbsoluteFill>
      </Scene>

      <Scene start={520} end={840}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 1360, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 70, alignItems: "center" }}>
            <div style={{ background: colors.ink, borderRadius: 24, padding: 38, color: colors.white, boxShadow: "0 24px 70px rgba(20, 30, 25, .18)" }}><div style={{ display: "flex", justifyContent: "space-between" }}><Eyebrow dark>REQUEST REQ-042 / PUBLIC POLICY</Eyebrow><Pill tone="dark">ANONYMOUS</Pill></div><div style={{ fontSize: 27, marginTop: 29, color: "#d9e1d9" }}>Buyer screening thresholds</div><div style={{ marginTop: 24 }}>{[["TTM revenue", "≥ $2,000,000"], ["Net retention", "≥ 110%"], ["Customer concentration", "≤ 20%"], ["Refund rate", "≤ 5%"]].map(([label, value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "17px 0", borderBottom: "1px solid #3a4840", fontFamily: "monospace", fontSize: 16 }}><span style={{ color: "#aeb9ae" }}>{label}</span><strong>{value}</strong></div>)}</div><div style={{ marginTop: 25, display: "flex", justifyContent: "space-between", alignItems: "center" }}><Lock label="policy is public" /><span style={{ background: colors.blue, borderRadius: 10, padding: "13px 22px", fontWeight: 700 }}>Funds threshold verified ✓</span></div></div>
            <div><Eyebrow>02 / BUYER PROOF</Eyebrow><div style={{ fontSize: 59, lineHeight: 1.02, letterSpacing: -3, fontWeight: 800, marginTop: 20 }}>Balance stays<br /><span style={{ color: colors.blueDark, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>behind the wallet.</span></div><p style={{ color: colors.muted, fontSize: 21, lineHeight: 1.35, maxWidth: 430, marginTop: 26 }}>The bank fixture proves available funds meet the asking floor. Exact balance and identity never become public state.</p><Pill tone="mint"><span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.mintDark }} />PRIVATE BANK ATTESTATION</Pill></div>
          </div>
        </AbsoluteFill>
      </Scene>

      <Scene start={820} end={1110}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 1360 }}><Eyebrow>03 / MUTUAL QUALIFICATION</Eyebrow><div style={{ fontSize: 60, lineHeight: 1.02, letterSpacing: -3, fontWeight: 800, marginTop: 18 }}>The receipt is public.<br /><span style={{ color: colors.blueDark, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>The evidence is not.</span></div><div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, marginTop: 48 }}><div style={{ background: colors.white, border: `1px solid ${colors.line}`, borderRadius: 22, padding: 30 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>{[["Seller qualification", "PASS / 4 constraints"], ["Buyer funds", "PASS / ≥ asking floor"], ["Dossier access", "LOCKED"]].map(([label, value], index) => <div key={label} style={{ borderLeft: `3px solid ${index === 2 ? colors.line : colors.mintDark}`, paddingLeft: 17 }}><div style={{ fontFamily: "monospace", color: colors.muted, fontSize: 12 }}>{label}</div><strong style={{ display: "block", marginTop: 15, color: index === 2 ? colors.muted : colors.mintDark, fontSize: 21 }}>{value}</strong></div>)}</div><div style={{ height: 1, background: colors.line, margin: "30px 0" }}><div style={{ height: 3, width: "68%", background: colors.blue, translate: `${Math.min((frame - 850) * 2, 500)}px 0px` }} /></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Lock label="commitments · outcomes · hashes" /><span style={{ color: colors.muted, fontFamily: "monospace", fontSize: 12 }}>MIDNIGHT / PUBLIC TRANSCRIPT</span></div></div><div style={{ background: colors.blueDark, color: colors.white, borderRadius: 22, padding: 30 }}><Eyebrow dark>WHAT REMAINS PRIVATE</Eyebrow><div style={{ marginTop: 22, display: "grid", gap: 16 }}>{["company identity", "revenue + retention", "customer data", "buyer identity", "exact available funds"].map((item) => <div key={item} style={{ display: "flex", gap: 12, alignItems: "center", fontFamily: "monospace", fontSize: 15 }}><span style={{ color: colors.mint }}>✦</span>{item}</div>)}</div></div></div></div>
        </AbsoluteFill>
      </Scene>

      <Scene start={1090} end={1410}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 1360, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 90, alignItems: "center" }}>
            <div><Eyebrow>04 / ENCRYPTED DATA ROOM</Eyebrow><div style={{ fontSize: 58, lineHeight: 1.03, letterSpacing: -3, fontWeight: 800, marginTop: 20 }}>Unlock only<br />after both sides<br /><span style={{ color: colors.blueDark, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>qualify.</span></div><p style={{ color: colors.muted, fontSize: 20, lineHeight: 1.35, maxWidth: 400, marginTop: 25 }}>The dossier travels as ciphertext. The key stays with the qualified buyer.</p></div>
            <div style={{ background: "#e8ebf9", border: "1px solid #c8d0f1", borderRadius: 24, padding: 36 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Eyebrow>ACCESS RECEIPT VERIFIED</Eyebrow><Pill>ENCRYPTED</Pill></div><div style={{ marginTop: 28, background: colors.white, borderRadius: 16, padding: 24, border: "1px solid #d7dcf3" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontFamily: "monospace", fontSize: 11, color: colors.muted, letterSpacing: 1 }}>CIPHERTEXT HASH</div><div style={{ marginTop: 9, fontFamily: "monospace", color: colors.blueDark, fontSize: 16 }}>sha256:241b9beda3…</div></div><div style={{ width: 52, height: 52, borderRadius: 15, display: "grid", placeItems: "center", background: colors.mint, color: colors.mintDark, fontSize: 25 }}>⌁</div></div><div style={{ marginTop: 26, height: 12, borderRadius: 99, background: "#edf0fb", overflow: "hidden" }}><div style={{ height: "100%", width: `${interpolate(frame, [1120, 1250], [8, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`, background: colors.blue }} /></div><div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontFamily: "monospace", color: colors.muted, fontSize: 12 }}><span>local decryption</span><span>ready</span></div></div><div style={{ marginTop: 25, display: "flex", justifyContent: "flex-end" }}><span style={{ background: colors.blue, color: colors.white, borderRadius: 10, padding: "14px 23px", fontWeight: 700 }}>Unlock locally ↗</span></div></div>
          </div>
        </AbsoluteFill>
      </Scene>

      <Scene start={1390} end={1800}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 1360, display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 75, alignItems: "center" }}>
            <div><Eyebrow>05 / PUBLIC VERIFIER</Eyebrow><div style={{ fontSize: 64, lineHeight: 1.02, letterSpacing: -3, fontWeight: 800, marginTop: 20 }}>See what the chain<br /><span style={{ color: colors.blueDark, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>can prove.</span></div><p style={{ color: colors.muted, fontSize: 21, lineHeight: 1.35, maxWidth: 500, marginTop: 26 }}>Commitments, qualification outcomes, and hashes. No revenue, balances, identities, or dossier plaintext.</p><div style={{ display: "flex", gap: 14, marginTop: 28 }}><Pill tone="dark">PRIVATE INPUTS</Pill><Pill tone="mint">PUBLIC OUTCOME</Pill></div><div style={{ marginTop: 58 }}><Brand /><div style={{ marginTop: 13, fontFamily: "monospace", fontSize: 13, color: colors.muted }}>Live demo · sachplayz.github.io/proofroom</div></div></div>
            <div style={{ background: colors.ink, borderRadius: 26, padding: 36, color: colors.white, minHeight: 475, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Eyebrow dark>PROTOCOL RECEIPT</Eyebrow><Pill tone="dark">PUBLIC / LIVE</Pill></div><div style={{ fontSize: 31, marginTop: 25 }}>Privacy boundary intact.</div><div style={{ marginTop: 25, display: "grid", gap: 16 }}>{[["Seller qualification", "PASS / 4 constraints"], ["Buyer funds", "PASS / ≥ asking floor"], ["Dossier access", "GRANTED / encrypted"]].map(([label, value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #3a4840", paddingBottom: 15, fontFamily: "monospace", fontSize: 14 }}><span style={{ color: "#aeb9ae" }}>{label}</span><strong style={{ color: colors.mint }}>{value}</strong></div>)}</div></div><div style={{ borderTop: "1px solid #3a4840", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><div style={{ fontFamily: "Georgia, serif", fontSize: 31, fontStyle: "italic" }}>Proof, not exposure.</div><div style={{ marginTop: 10, color: "#aeb9ae", fontFamily: "monospace", fontSize: 12 }}>build private acquisition workflows on Midnight</div></div><div style={{ width: 67, height: 67, border: "1px solid #7190d8", borderRadius: 18, display: "grid", placeItems: "center", color: "#9db2f2", fontSize: 31 }}>↗</div></div></div>
          </div>
        </AbsoluteFill>
      </Scene>
    </AbsoluteFill>
  );
};
