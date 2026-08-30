import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

type Props = Record<string, unknown>;

const fps = 30;
const durationInFrames = 60 * fps;

const colors = {
  ink: "#20211e",
  blue: "#2852d7",
  mint: "#dff0c7",
  paper: "#f5f4ee",
  muted: "#d4d7ce",
};

const calculateMetadata: CalculateMetadataFunction<Props> = () => ({
  durationInFrames,
  fps,
  width: 1920,
  height: 1080,
});

function fade(frame: number, from: number, to: number) {
  return interpolate(frame, [from, from + 15, to - 15, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

function Sfx({ from, src, volume = 0.6 }: { from: number; src: string; volume?: number }) {
  return (
    <Sequence from={from} durationInFrames={90} layout="none">
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
}

function StageCard({
  from,
  to,
  step,
  kicker,
  title,
  detail,
  tone = "blue",
}: {
  from: number;
  to: number;
  step: string;
  kicker: string;
  title: string;
  detail: string;
  tone?: "blue" | "mint";
}) {
  const frame = useCurrentFrame();
  const opacity = fade(frame, from, to);
  const translate = interpolate(frame, [from, from + 24], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const accent = tone === "mint" ? colors.mint : colors.blue;
  return (
    <Interactive.Div
      name={`${step} caption`}
      style={{
        position: "absolute",
        left: 38,
        bottom: 38,
        width: 465,
        padding: "18px 20px 19px",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 9,
        backgroundColor: "rgba(32,33,30,.95)",
        color: "#fff",
        opacity,
        translate: `0px ${translate}px`,
        boxShadow: "0 12px 35px rgba(0,0,0,.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: accent, fontFamily: "monospace", fontSize: 11, letterSpacing: 1.8, fontWeight: 700 }}>
        <span style={{ display: "inline-flex", width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: accent, color: colors.ink, fontSize: 10 }}>{step}</span>
        {kicker}
      </div>
      <div style={{ marginTop: 10, fontFamily: "Arial, sans-serif", fontSize: 29, lineHeight: 1.05, letterSpacing: -1.1, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, color: colors.muted, fontFamily: "Arial, sans-serif", fontSize: 14, lineHeight: 1.35 }}>{detail}</div>
    </Interactive.Div>
  );
}

function LiveChrome() {
  const frame = useCurrentFrame();
  const time = Math.min(frame / fps, 60).toFixed(1).padStart(4, "0");
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", top: 20, left: 22, right: 22, display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 5, backgroundColor: "rgba(32,33,30,.9)", color: "#fff", fontFamily: "monospace", fontSize: 10, letterSpacing: 1.1 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#9cdb5b", boxShadow: "0 0 0 4px rgba(156,219,91,.15)" }} />
          PROOFROOM / REAL APP FLOW
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 11px", borderRadius: 5, backgroundColor: "rgba(32,33,30,.82)", color: "#fff", fontFamily: "monospace", fontSize: 10, letterSpacing: 1 }}>
          PREPROD-READY DEMO <span style={{ color: "#bfc8bc" }}>00:{time}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: "rgba(32,33,30,.25)", pointerEvents: "none" }}>
        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: colors.blue }} />
      </div>
    </>
  );
}

export const MyComposition = () => (
  <Composition
    id="ProofRoomDemo"
    component={ProofRoomVideo}
    durationInFrames={durationInFrames}
    fps={fps}
    width={1920}
    height={1080}
    calculateMetadata={calculateMetadata}
    defaultProps={{}}
  />
);

export const ProofRoomVideo = () => {
  const frame = useCurrentFrame();
  const introOpacity = interpolate(frame, [0, 18, 120, 180], [1, 1, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper, overflow: "hidden" }}>
      <Video
        name="Recorded ProofRoom application"
        src={staticFile("proofroom-flow.webm")}
        trimAfter={durationInFrames}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />

      <AbsoluteFill style={{ backgroundColor: "rgba(14,16,14,.3)", opacity: introOpacity, pointerEvents: "none" }} />
      <LiveChrome />

      <Interactive.Div
        name="Intro title"
        style={{ position: "absolute", left: 38, top: 92, maxWidth: 680, opacity: introOpacity, color: "#fff", textShadow: "0 3px 18px rgba(0,0,0,.4)" }}
      >
        <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 2.2, color: colors.mint }}>ONE MINUTE / REAL INTERACTION</div>
        <div style={{ marginTop: 10, fontFamily: "Arial, sans-serif", fontSize: 50, lineHeight: 0.96, letterSpacing: -2.2, fontWeight: 800 }}>Watch a deal qualify<br /><span style={{ color: colors.mint }}>without exposing it.</span></div>
      </Interactive.Div>

      <StageCard from={140} to={410} step="01" kicker="SELLER CONSOLE / LOCAL PROOF" title="Click → seller fit verified" detail="The actual app evaluates four private metrics and publishes only PASS." />
      <StageCard from={370} to={680} step="02" kicker="BUYER CONSOLE / PRIVATE FUNDS" title="Click → funds threshold verified" detail="The buyer policy is public. The bank balance stays behind the wallet." tone="mint" />
      <StageCard from={620} to={920} step="03" kicker="SELLER CONSOLE / ACCESS RECEIPT" title="Click → grant encrypted access" detail="Both proofs pass before the seller can release the dossier ciphertext." />
      <StageCard from={850} to={1280} step="04" kicker="BUYER DATA ROOM / LOCAL DECRYPT" title="Click → unlock locally" detail="The real dossier opens only after the receipt and hash match." tone="mint" />
      <StageCard from={1210} to={1799} step="05" kicker="PUBLIC VERIFIER / SELECTIVE DISCLOSURE" title="The chain sees the receipt" detail="Commitments, outcomes, and hashes are visible. Revenue, balances, and identities are not." />

      <Sfx from={145} src="mouse-click.wav" />
      <Sfx from={300} src="switch.wav" volume={0.5} />
      <Sfx from={330} src="mouse-click.wav" />
      <Sfx from={515} src="ding.wav" volume={0.5} />
      <Sfx from={610} src="switch.wav" volume={0.5} />
      <Sfx from={660} src="mouse-click.wav" />
      <Sfx from={760} src="ding.wav" volume={0.5} />
      <Sfx from={800} src="switch.wav" volume={0.5} />
      <Sfx from={870} src="mouse-click.wav" />
      <Sfx from={1030} src="ding.wav" volume={0.5} />
      <Sfx from={1160} src="switch.wav" volume={0.5} />
      <Sfx from={1220} src="mouse-click.wav" />
      <Sfx from={1380} src="ding.wav" volume={0.55} />
      <Sfx from={1450} src="whoosh.wav" volume={0.35} />
    </AbsoluteFill>
  );
};
