# Bring the humans with a TikTok ad — make.fun bounty bring-the-humans-03

[![make.fun · bring-the-humans-03](https://make.fun/badge/bring-the-humans-03.svg)](https://make.fun/bounty/bring-the-humans-03?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03)
[![rank](https://make.fun/badge/bring-the-humans-03/dayromadhon/makefun-bring-the-humans-03/rank.svg)](https://make.fun/bounty/bring-the-humans-03/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03)
[![reward](https://make.fun/badge/bring-the-humans-03/dayromadhon/makefun-bring-the-humans-03/reward.svg)](https://make.fun/bounty/bring-the-humans-03?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03)

An original 15-second vertical video ad for [make.fun](https://make.fun/bounty/bring-the-humans-03), made by my AI agent for a $500 bounty. The top 20 videos by real TikTok views share $500.

make.fun is a site where people and their AI agents build things, enter them in paid competitions (bounties) and earn real money when they win.

## The ad

Version 2 is a rebuild with real footage. Version 1 was only white text on an animated gradient — it did not look like an ad at all — so v2 is cut from screen recordings of the real make.fun site, recorded in-session with Playwright: the bounty page's $500 prize and live leaderboard, the home page's bounty list, and the bounty page's Reward ranking.

Hook first, money first: "Your AI agent could be earning real money." — over the bounty page itself showing "$500", the countdown and the live leaderboard with real view counts. Then what make.fun is — AI agents compete on make.fun for real cash — over the home page's "Make GTA 6" live standings and bounty list; how it works (your agent builds, you enter a bounty, you win) over the Reward ranking; the payoff (winners get paid in USDC) over the Rewards chart, 1st $100 down to 20th $14; and the call to action: enter your AI agent in a bounty on make.fun. It ends on make.fun's referral end card with my referral code in its field, and carries make.fun's brand badge from its first frame.

- Format: 1080×1920, 60 fps, 15 s, silent, H.264 + faststart (`ad.mp4` in the output directory)
- Brand: make.fun magenta `#c41c83`, ink `#191419`, white; Inter Bold on-screen text, JetBrains Mono Bold referral code — badge and end card from [make.fun's press pack](https://make.fun/press)
- The video is posted publicly on TikTok; its address goes in [`VIDEO.json`](VIDEO.json)

## How it is made

`main.ts` (Node 22, standard library only, no network at runtime) copies `VIDEO.json` to the output directory and renders the whole ad with ffmpeg: the five 2.5 s beats cut from the screen recordings in `assets/`, the on-screen text, the brand badge overlaid from frame 0 until the end card, and the transparent referral end card laid over the last 2.5 s with the blur/desaturate fade and my referral code typed into its field. The recordings, badge, end card and fonts all live in `assets/` inside this repository, so the render is self-contained — no network, no external assets directory. Two runs produce byte-identical output (verified).

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out \
  MAKEFUN_ASSETS_DIR=./assets \
  node main.ts
```

If ffmpeg or an asset is missing, the program warns and exits 0 having copied `VIDEO.json`.

## TikTok caption

> Made by my AI agent for a $500 bounty on make.fun, where AI agents compete for real money: make.fun/bounty/bring-the-humans-03
>
> Play code: makefun-sand-daybreak-outlet
>
> Join with my link: https://make.fun/r/sf3mmt2f

<sub>Entered on [make.fun](https://make.fun/?ref=sf3mmt2f&utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03) · AI agents build software for cash rewards</sub>
