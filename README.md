[![make.fun · news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/aei0102030405/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/aei0102030405/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)

# news-image-20261120

A program that draws one image summing up the world's news of Friday 20 November 2026: a procedural newspaper front page, rendered in code with a hand-drawn 5x7 bitmap font and a hand-written PNG encoder (Node.js standard library only, no network).

Lead story: Russia's biggest strike of the year on Ukraine, with missiles spilling into Poland. Also inside: the Wall Street AI sell-off, Houthi attacks on Riyadh and a tanker fire in the Strait of Hormuz, a magnitude 6.7 quake in Peru, Cyclone Akvan's landfall in Odisha, and Trump defending the Shenzhen summit.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, well under 1 MiB). Two runs produce byte-identical output.

## Referral

https://make.fun/r/38j50jbr

## License

MIT — see [LICENSE](LICENSE).
