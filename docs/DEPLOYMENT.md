# Deployment and operations

1. Install on a network-enabled build host. Generate the pnpm lockfile, review it, and commit it before switching CI to frozen installs. Run the migration, integration, browser and build commands in the README against disposable services.
2. Provision PostgreSQL, a private object bucket and a verified transactional mail sender. Keep runtime and migration connections separate. Set production variables from .env.example in your secret manager. Restrict database and bucket access to the API and migration/maintenance jobs as appropriate.
3. Set PLATFORM_DOMAIN to the bare domain, APP_ORIGIN to the HTTPS application origin, and API_INTERNAL_ORIGIN to the private Fastify listener. Build with the same upstream and upload limit as runtime. Run pnpm migrate once with direct database credentials. Execute pnpm build, then supervise pnpm --filter @studio/api start and pnpm --filter @studio/web start.
4. Point apex, app and wildcard DNS at the web ingress. Install TLS covering the apex and wildcard. Validate accepted hostnames at ingress, forward the original validated Host and discard incoming forwarding headers. The API should be reachable only from the web service or controlled ingress. Enforce per-client IP limits at the trusted edge. Behind the web proxy Fastify can see a shared peer address. Its built-in limits are process-local and can affect multiple artists together.
5. Set the ingress body limit at least as high as the configured upload maximum. Local uploads pass through Next and Fastify. Configure bucket CORS to allow PUT and Content-Type from APP_ORIGIN for presigned browser uploads. Keep bucket reads private. Bound process memory and request concurrency for decoded images and scrypt. All provider credentials stay on the server.
6. Schedule pnpm cleanup at least hourly using the same environment as the API. Asset garbage has a one-hour grace period. Monitor job failures, storage capacity, mail delivery failures and API 5xx errors. Back up PostgreSQL and object storage consistently and rehearse restoration together.
7. Register an artist, verify a delivered email, create and publish an artwork, then change the draft. Verify the public hostname in a signed-out browser. Unpublish it and check both its HTML and image URLs. Complete the reset and deletion flows before enabling registrations.

## Abuse reports and privacy operations

The reports table contains a report ID, site ID, submission time, reason and review status. An authorized operator can list open reports using a restricted database role and record a review outcome. Grant moderation access separately from application credentials. Establish a published privacy notice, contact channel, deletion and backup retention policy with qualified review for the intended jurisdictions. No certification claim is made.

## Production choices still to verify

Check live mail delivery, R2 permissions, DNS, TLS, limits at the edge and deletion propagation under the actual hosting configuration. The local adapter exercises a private filesystem. It does not authenticate to an external provider. Phase 1 uses one API process and rereads public snapshots. Introduce shared rate limits and revision-aware caching before horizontal scale.
