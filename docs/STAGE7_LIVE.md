# Stage 7 — Live paid Telegraph acquisition

This stage connects the autonomous Latch controller to Telegraph's escrow-paid
Engine path.

## Safety properties

- The request is pinned to miner `7317701` (`latch-telemetry`).
- The maximum payment is fixed at `10000 uUSDC` ($0.01).
- The adapter requires the Ethereum Sepolia escrow rail.
- It does not auto-route across multiple miners.
- It does not fall back to wallet x402 settlement.
- The private key stays in the official Telegraph wallet file:
  `~/.telegraph/wallet.json`.
- The repository never reads the key into logs or serializes it into results.
- The live command requires an explicit `LATCH_LIVE_PAID=1` opt-in.

## Live command

First confirm the wallet and escrow with the official CLI:

```bash
npx -y @telegraphprotocol/telegraph-protocol-mcp status
```

Then execute exactly one paid autonomous recovery:

```bash
LATCH_LIVE_PAID=1 npm run stage7:live
```

The expected flow is:

```text
local telemetry unavailable
→ controller requests recovery
→ pinned Telegraph miner 7317701
→ HTTP 402 escrow challenge
→ local wallet signs EIP-191 challenge
→ $0.01 paid request
→ canonical telemetry response
→ Evidence Gate
→ CONTINUE or fail closed
```

Do not rerun the paid command merely to reproduce evidence. Preserve the first
successful live output and the post-call escrow status.
