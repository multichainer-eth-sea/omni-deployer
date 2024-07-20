# Contracts

## How to deploy a coin

modify the coin metadata on this `./ignition/parameters.json`

```json
{
  "MyCoin": {
    "name": "Gud Coin",
    "symbol": "GUD",
    "decimals": "18",
    "totalSupply": "1000000000000000000000000000"
  }
}
```

then run this

```sh
pnpm build
pnpm deploy:coin --network arbitrum --verify
```
