# subcultcoin

SUBCULT, a fixed-supply Solana token (Token-2022, on-chain name and symbol, mint authority revoked).

- `scripts/mint.js` creates the mint. Settings are listed at the top of the file. Defaults: 1,000,000,000 supply, 6 decimals.
- `assets/logo.png` is the token image; `assets/metadata.json` is the off-chain metadata the mint points to.
- The deployer key is created outside the repo at `~/.config/subcultcoin/deployer.json`. Never commit it.

```sh
npm install
CLUSTER=devnet RECIPIENT=<wallet address> URI=<metadata url> node scripts/mint.js
```
