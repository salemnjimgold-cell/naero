# Naero Milestone 5A Workspace Classification

Classification describes the pre-baseline workspace. Files were preserved when their role was uncertain; no legacy or generated material was deleted.

| Category | Approximate scope | Classification and baseline treatment |
|---|---:|---|
| A - Current product source | 64 changed/new paths | `App.js`, app/package configuration, `src/screens`, navigation, context, services, theme, i18n and shared components. Included. |
| B - Backend source | 22 changed/new paths | Backend environment template, server/config/CORS/logger changes, nearby service, gateway providers/routes/security. Included. |
| C - Database/migrations | 3 principal new/changed paths | Migration 005, its rollback, and migration runbook. Included. Existing 001-004 remain inherited from history. |
| D - Tests/QA automation | 8 new support paths | Six new test scripts plus two scoped JS/TS configuration files. Included. Existing backend/AI QA remains inherited. |
| E - Android native source | 10 human-authored changed/new paths | Gradle/app configuration, manifest, activity/application, strings/colors, and two key-hash Kotlin modules. Included. Generated bundle/resources/caches excluded. |
| F - Product/technical documentation | 14 Milestone/real-data documents | Evidence and architecture for Milestones 1-4B and real-data work. Included. |
| G - Design/UX documentation | 9 Markdown documents | Deep Sea, Guided Compass and broader design explorations. Included as historical/current evidence without choosing a direction. |
| H - Generated artifacts | More than 2,300 paths plus QA/native output | `artifacts/`, Gradle/CMake/build output, bundled Android JS/resources, APKs, logs, `dist`, QA captures and UI dumps. Excluded through conservative ignore rules; retained on disk and in the external backup where copied. |
| I - Legacy/obsolete | Existing tracked directories/files | `FINAL_DELIVERY`, Firebase compatibility stubs, Explore/Onboarding remnants, old reports and old APKs. Existing tracked material remains untouched; ignored APKs remain on disk. |
| J - Secrets/local-only | 2 primary files | `.env` and `backend/.env` are ignored and excluded. Example templates with blank placeholders are included. |
| K - Unknown | 3 loose reference images | Unreferenced generated/reference image experiments. Preserved externally and ignored by exact/narrow patterns; not deleted. |

## `.gitignore` review

Existing rules already protected environment files, signing material, dependencies, Expo output, Gradle/build/CMake output, APKs, logs and common web output.

Milestone 5A added only narrow hygiene rules for:

- `artifacts/` and `qa_screenshots/`;
- generated Android embedded bundles, raw vector-icon fonts and generated drawable resources;
- `ui_dump.xml` and `test_phase0.png`;
- three families of unreferenced local design/reference experiments.

These rules do not ignore active source, tests, migrations, documentation, or Android Kotlin/configuration files.

