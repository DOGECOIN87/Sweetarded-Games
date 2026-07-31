# PayBox agentic checkout — how and why it's built this way

## What PayBox is
PayBox (paybox.sh) is MoonPay's non-custodial payment vault for AI agents, launched
July 29, 2026. A user connects it once to Claude / ChatGPT via the MCP connector
(`https://api.paybox.sh/mcp`) + OAuth 2.1 + a passkey. Their assistant can then use
scoped tools — fund a wallet, pay, sign, swap, pay x402 services — against the USER's
own vault. Keys live in MPC and never leave; sensitive operations pause for a passkey
approval; every operation is audited; agents are revocable.

## Why it's a link-out flow, not an embedded checkout
Verified directly against the live endpoint: `POST https://api.paybox.sh/mcp` returns
`401` with an OAuth 2.1 `WWW-Authenticate` challenge (`scope: mcp`, auth server
`api.paybox.sh`). There is no merchant key or server-side credential a website can
hold — by design, every call is the user's own OAuth session operating their own
vault from inside their own assistant. So the correct integration for a mint site is
**signage**: get the user connected, hand their agent a precise prompt, and let the
passkey model do its job. That's what `src/components/AgentMint.tsx` ships.

## What ships
- `src/content/agentMint.ts` — config + the prompt template. `AGENT_MINT_ENABLED`
  is the master switch; the prompt is built from `MINT_URL` (MintEmbed's export) so
  there is exactly one source of truth for where money goes.
- `src/components/AgentMint.tsx` — the "Mint by talking to your AI" panel in the
  Mint aisle: PayBox setup link, connector-URL copy, prompt copy with feedback,
  and the passkey step spelled out. The prompt explicitly instructs the agent to
  cross-check the mint page's ownership and confirm every amount before approval.

## Safety posture
- Sweetardio never touches user funds; LaunchMyNFT remains the authoritative mint.
- The panel states PayBox is a MoonPay product, unaffiliated, brand-new, and tells
  users to verify every approval. Keep that copy.
- If you ever change the mint URL, change `MINT_URL` in MintEmbed — the prompt
  follows automatically.

## The deeper integration (future, optional)
PayBox agents can "pay x402 services." Becoming an x402 *merchant* (selling mint
passes / NFTs the agent can buy directly over HTTP 402 + USDC) is a real backend
project: an x402-speaking endpoint (their Node SDK / CLI could sit in a Cloudflare
Worker), payment→delivery logic, and a mint mechanism you control (LaunchMyNFT's
contract can't deliver on x402 payment). Revisit after the mint, if agent-native
sales are worth owning end-to-end.
