AGENTS — Publishing @chikate/chikate

This is a short, practical checklist for publishing a scoped, public package to npm.

Basics
- Scope: @chikate/chikate
- Node: 18+; npm: 9+
- 2FA: enabled (auth and writes)

One‑time
- npm login
- Confirm access to @chikate scope (org or user)
- Verify package.json:
  - name: "@chikate/chikate"
  - version: x.y.z (semver)
  - publishConfig.access: public
  - files allowlist: src/**, docs/**, README.md, CHANGELOG.md, LICENSE
  - repository/bugs/homepage set
  - .npmignore excludes large media (e.g., docs/high_quality_chikate.gif)

Release steps
1) Bump version
   - npm version patch|minor|major
   - or edit package.json "version" then commit: "release: vX.Y.Z"

2) Sanity check tarball
   - npm pack
   - tar -tf chikate-*.tgz (ensure no large media; verify entry points)

3) Publish
   - npm publish --access public
   - If 2FA prompts, enter OTP

4) Verify
   - npmjs.com/package/@chikate/chikate (badge shows Public)
   - README image loads (uses GitHub raw URL)

Notes
- Scoped packages default to private; first publish must pass --access public.
- Use dist‑tags for pre-releases: npm publish --tag next
- Docs import from '@chikate/chikate'.
- If Ctrl+C feels stuck after running examples, run `stty sane`; we also fix raw mode in cleanup.

CI (optional)
- Use GitHub Actions with OIDC provenance and tag‑based releases; minimal job:

  on:
    push:
      tags: [ 'v*.*.*' ]
  jobs:
    publish:
      runs-on: ubuntu-latest
      permissions: { id-token: write, contents: read }
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, registry-url: 'https://registry.npmjs.org' }
        - run: npm ci
        - run: npm test --if-present
        - run: npm publish --provenance --access public
          env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }

