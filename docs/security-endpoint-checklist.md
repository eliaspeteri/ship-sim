# Endpoint Security Checklist

Use this checklist for new API and socket endpoints.

- Authentication: Is caller identity verified before privileged actions?
- Authorization: Is resource ownership/role scope enforced?
- Input bounds: Are payload size/range and enum constraints validated?
- Abuse controls: Is rate limiting or replay protection required?
- Logging hygiene: Are secrets/tokens/cookies excluded from logs?
- Error shape: Are errors non-enumerating and consistent for clients?
- Test coverage: Are success, unauthorized, forbidden, and invalid-input paths tested?
