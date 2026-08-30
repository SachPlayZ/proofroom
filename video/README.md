# ProofRoom one-minute demo

This is a 60-second Remotion composition built from a real Playwright recording of the ProofRoom application. It shows the actual seller, buyer, access-grant, dossier-unlock, and public-verifier interactions, with a visible cursor, click ripples, and timed sound effects.

## Commands

**Install dependencies**

```console
npm install
```

**Start Preview**

```console
npm run dev
```

**Record the real application flow**

Start the app first with `npm run dev -- --host 127.0.0.1 --port 4174` from the repository root, then run:

```console
npm run record
```

The Playwright capture is written to `video/public/proofroom-flow.webm`. Set `PROOFROOM_URL` to point at another running ProofRoom instance if needed.

**Render video**

```console
npm run render
```

The final MP4 is written to `video/out/proofroom-demo.mp4` and is intentionally ignored from git as a generated binary. It is 1920×1080, H.264, 60 seconds long, and includes click/switch/ding/whoosh SFX from the local `public/` assets.

Flow: seller proof → buyer funds proof → seller grants encrypted access → buyer unlocks locally → verifier copies the public receipt and reviews the timeline.

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
