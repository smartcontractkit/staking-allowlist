# Early Access Allowlist for Chainlink Staking

This repo includes:
- `allowlist.csv` that has all Early Access addresses
- `index.js` that generates the Merkle tree based on the above `allowlist.csv`

## Build instructions

To generate the Merkle tree and proofs from:

```
npm install
npm run build
```

## Tree.json Schema

The above steps will generate a `tree.json` file with the following fields:

```json
{
  "root": "0x74d01770374bb506fed0e11d7f8ff86e51277369b725582587b6d2a80c5d6c1f",
  "proofs": {
    "<staker address>": "<encoded merkle proof>",
    ...
  }
}
```

