/* Domains: connection of artist-owned custom domains, DNS ownership proof,
   routing checks, the on-demand TLS gate and daily re-verification. */
export { domainRoutes } from "./presentation/domains.routes.ts";
export { recheckDomains } from "./application/verification.ts";
export { normalizeHost } from "./domain/hostname.ts";
export { realNetwork, type Network } from "./infrastructure/network.ts";
