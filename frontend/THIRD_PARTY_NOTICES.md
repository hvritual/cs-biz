# Third-party source notices

## Vben Admin

This frontend includes source adapted from [vbenjs/vue-vben-admin](https://github.com/vbenjs/vue-vben-admin/tree/63a38dce49ba109f61607994e21ba921d8e970e9), tag `v5.7.0`, commit `63a38dce49ba109f61607994e21ba921d8e970e9`.

Copyright (c) 2024-present, Vben. The complete upstream MIT notice is retained in [LICENSE.vben](LICENSE.vben). The `UNLICENSED` metadata on private CS Biz application packages does not revoke the MIT license or attribution on included upstream source.

The import retains the workspace packages and build/lint tooling needed to build one application. The Element Plus application at `apps/web-ele` supplies the build scaffold; its example application, business pages, login flow and mock server have been replaced by the CS Biz console in `apps/console`. Other upstream applications, documentation site, playground, promotional assets and Nitro mock service are not imported.

Four retained upstream files contain small changes: an initial storage namespace in the preferences manager; bundled local sidebar icons and accessible button labels passed from the application; and synchronous registration of the shared theme stylesheet so repeated startup updates cannot create conflicting copies. Root scripts, application metadata, environment defaults and test selection are adapted to this repository. Exact retained-file differences and the lock fingerprint are recorded in [doc/upstream.json](doc/upstream.json).

## Dependencies and assets

External package versions and integrity values are recorded in [pnpm-lock.yaml](pnpm-lock.yaml). Dependencies retain their own licenses. This notice records the source import and is not a claim that every transitive dependency has received a legal audit.

The running business interface uses code, CSS, bundled icons and system fonts. No upstream demo photographs, avatars or favicons are used. Image concepts served as internal design references, not embedded screenshots. Browser validation may install a separate Chromium and fonts in a temporary QA environment; those binaries and screenshots are not application source dependencies.
