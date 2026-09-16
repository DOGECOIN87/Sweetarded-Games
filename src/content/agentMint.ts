/**
 * Agentic checkout via PayBox (MoonPay) — configuration.
 *
 * PayBox is a non-custodial payment vault that lives inside the USER's AI
 * assistant (Claude, ChatGPT, Grok): they connect it once via MCP + OAuth,
 * and their agent can fund a wallet / pay / sign from THEIR vault, with a
 * passkey approval gating anything sensitive. There is no server-side key a
 * website can hold — verified against the live endpoint (401 + OAuth 2.1
 * challenge) and docs.paybox.sh. So the site's job is to be great signage:
 * hand the user's agent a precise, safe prompt. Full notes in PAYBOX.md.
 */

/** Master switch — set false to hide the agent-mint panel entirely. */
export const AGENT_MINT_ENABLED = true;

export const PAYBOX = {
  /** Official guided setup (MoonPay's own connect flow — always current). */
  site: 'https://paybox.sh',
  /** The MCP connector URL users paste when adding PayBox manually. */
  mcpUrl: 'https://api.paybox.sh/mcp',
  docs: 'https://docs.paybox.sh',
  /**
   * Anthropic's documented custom-connector install link: opens claude.ai's
   * "Add custom connector" dialog with name + URL prefilled; the user still
   * reviews and confirms, and OAuth runs as normal. See
   * claude.com/docs/connectors/building/directory-vs-custom
   */
  claudeInstallUrl:
    'https://claude.ai/customize/connectors?modal=add-custom-connector' +
    '&connectorName=PayBox&connectorUrl=' +
    encodeURIComponent('https://api.paybox.sh/mcp'),
} as const;

/**
 * The prompt the user hands their assistant. Built around the official mint
 * URL so there is exactly one source of truth for where money goes, and it
 * instructs the agent to confirm every amount before any passkey approval.
 */
export const buildAgentMintPrompt = (mintUrl: string): string =>
  `Using my PayBox, help me mint a Sweetardio NFT.

Official mint page: ${mintUrl}
(Cross-check it belongs to @Sweetardio / sweetardio.fun before paying anything.)

The mint is on Robinhood Chain (an EVM network) and is priced in ETH.

1. Check the live mint price, per-wallet limit, and whether the mint is open.
2. Check whether my PayBox can hold and send ETH on Robinhood Chain. If it can't, tell me and stop.
3. Make sure that wallet holds enough ETH on Robinhood Chain for the mint plus gas — fund it if it doesn't.
4. Walk me through completing the mint on that page.

Confirm every amount and every address with me before I approve anything with my passkey.`;
