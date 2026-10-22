<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Database migration history
- This remix starts with an empty PostgreSQL migration journal; add future schema changes through the migration tool rather than restoring the source project history, to avoid replaying copied schema changes.

## Shipping architecture
- Resolve Indian postal suggestions from the lazy-loaded local post-office directory before remote providers, preserving town and district separately; this avoids network-dependent booking validation.
- International bookings are authenticated persisted quote requests, not confirmed courier dispatches; acceptance and final prices require provider review.
- Validate prohibited-item declaration in client/server schemas and enforce consent on shipment insertion; automated keywords do not replace operational inspection.
- District reference names permit manual entry because public datasets can lag administrative changes.
