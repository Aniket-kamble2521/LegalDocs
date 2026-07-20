# Contributing to LegalDocs

We love your input! We want to make contributing to LegalDocs as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Coding Conventions

To keep our codebase clean and maintainable, please follow these rules:

1.  **TypeScript & Type Safety:** Ensure strict mode is enabled. Avoid using `any` unless absolutely necessary; favor explicit types and interfaces.
2.  **Linting:** Run `npm run lint` before committing. Follow rules defined in `.eslintrc.json`.
3.  **File Naming:** Use kebab-case for folders and configuration files. Use PascalCase for React component files (e.g. `DashboardConsole.tsx`).
4.  **No Bypasses:** Never commit testing shortcuts, visual mock checks, or disabled credit verifications. All code must run through real API layers.
5.  **Environment Handling:** Never hardcode keys. Use the `.env.example` file to document new additions.

## Pull Request Workflow

1.  **Fork the Repository:** Create your branch from `main` (e.g. `feature/your-feature` or `fix/your-fix`).
2.  **Run Tests Locally:** Make sure all integration and unit tests pass by running:
    ```bash
    npm run test
    ```
3.  **Build Verification:** Verify that the Next.js production bundler compiles without errors:
    ```bash
    npm run build
    ```
4.  **Format Commits:** Follow the conventional commit structure (e.g., `feat: add client filters`, `fix: sanitize invoice payload`).
5.  **Submit PR:** Open a Pull Request targeting the `main` branch. Provide a detailed summary using our Pull Request template.
