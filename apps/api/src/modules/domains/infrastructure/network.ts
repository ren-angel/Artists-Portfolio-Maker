import { resolveTxt, resolveCname, resolve4 } from "node:dns/promises";
import { connect as tlsConnect } from "node:tls";

/** DNS and TLS lookups, replaceable in tests. */
export type Network = {
  txt(name: string): Promise<string[]>;
  cname(name: string): Promise<string[]>;
  a(name: string): Promise<string[]>;
  tls(host: string): Promise<boolean>;
};

export const realNetwork: Network = {
  txt: async (n) => (await resolveTxt(n)).map((r) => r.join("")),
  cname: (n) => resolveCname(n),
  a: (n) => resolve4(n),
  // Reports a certificate as active only after a real, authorized handshake.
  tls: (host) =>
    new Promise((resolve) => {
      const socket = tlsConnect({ host, servername: host, port: 443, timeout: 5000 }, () => {
        resolve(socket.authorized);
        socket.end();
      });
      socket.on("error", () => resolve(false));
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    }),
};
