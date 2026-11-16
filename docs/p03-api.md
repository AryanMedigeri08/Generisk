# P03 fictional identity and consent API

Synthetic Demo — Not for Clinical Use. Runtime scope under DEC-010; P01 clinical-service API remains a provisional design. [ADR-006](adr/ADR-006-demo-identity-consent.md) explains security and deviations.

API prefix `/api/v1`; browser uses same-origin `/api/p03` proxy. GET requests through the proxy require `X-Demo-Request: 1`; mutations additionally require JSON, matching loopback Origin and `X-CSRF-Token`. Begin with `GET auth/csrf`, then login with returned CSRF and its HttpOnly cookie; login rotates the cookie/CSRF. Never put secrets in URLs, logs or browser storage. API `/docs` describes exact bounded Pydantic models. No browser-supplied role/user grants authority.

| Method/path (relative to prefix) | Authorization and behavior |
|---|---|
| GET `auth/csrf` | Origin/custom header checked; anonymous five-minute challenge |
| POST `auth/login` | Challenge CSRF + public fictional username/password; rate limited; new opaque cookie |
| GET `auth/session` | Current valid server session, safe identity and CSRF (no session token) |
| POST `auth/logout` | Session + CSRF; revoke and clear cookie |
| GET `me/cases` | Own private synthetic metadata only |
| GET `private/cases/{case_id}` | Owner, or assigned fictional counsellor with owner processing grant; otherwise neutral 404 |
| GET `professional/cases` | Only permitted assignments; support gets no records |
| POST `invitations` | Individual + CSRF, recipient fictional username; raw recipient-bound delivery token returned once |
| GET `me/invitations`, GET `invitations/{uuid}` | Participants only; sender sees neutral availability, never recipient refusal reason |
| POST `invitations/{uuid}/decision` | Bound recipient + CSRF + token; accept/decline; accept creates unconsented joint request |
| GET `me/consents` | Own scoped choice records only |
| POST `me/consents` (alias `private/consents`) | Own choice + CSRF, scope, target version, expected decision version, idempotency key; extra identity fields rejected |
| POST `me/consents/{uuid}/withdraw` | Own choice + CSRF, expected version/idempotency key; transactional revocation |
| GET `me/joints`, GET `joints/{uuid}/status` | Member only, neutral availability plus versions; no partner decision state/reason |
| GET `joints/{uuid}/output` | Member, both processing/assessment/disclosure grants and reviewed matching output; fixed non-clinical metadata only; unavailable in normal demo |
| POST `private/cases/{case_id}/demo-version` | Owner + CSRF + expected input version; fictional version increment invalidates affected permissions; no report input |
| GET `me/audit` | Latest 30 own-actor minimized events; no global administrator view |

Processing targets an owned case/input version; assessment targets a joint request/version; disclosure targets its reviewed output version and `participants` audience. Initial expected decision version is zero; subsequent actions must use the returned version. Idempotency key is caller-generated, bounded and tied to the full decision payload. A replay returns current state, not a cached old grant. Scope mutation accepts grant/refuse/withdraw; expiry and supersession are server transitions. No acceptance or assessment implies disclosure.

Errors use the P02 `error.code/message/request_id` envelope (proxy transport errors are generic code/message). 401 missing/expired/revoked authentication; 403 CSRF or unavailable dependent authorization; 404 non-member/non-owner/missing resource without precise reason; 409 stale version/idempotency conflict; 422 invalid bounded input; 429 demo abuse limit; 503 database/required audit/transport unavailable. Do not interpret an unavailable joint request as a partner's specific private decision. Errors exclude submitted fields, SQL and secrets. Denied authenticated requests are audited; malformed request-schema validation happens before domain actions and uses sanitized validation errors.

P02 health, public fictional templates, capabilities and empty KnowledgeProvider continue. Authentication/consent capabilities now advertise the implemented local demo, while clinical rules and knowledge stay unavailable. Public fixture cards are not private health records. No clinical-result generation, account administration, password recovery or professional verification endpoint exists.
