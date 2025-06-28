# Release Process

This project uses automated release scripts to streamline the version bumping and tagging process.

## Automated Release Commands

Instead of manually updating `package.json` and creating git tags, use these commands:

### Patch Release (Bug fixes: 2.2.2 → 2.2.3)

```bash
pnpm release:patch
```

### Minor Release (New features: 2.2.2 → 2.3.0)

```bash
pnpm release:minor
```

### Major Release (Breaking changes: 2.2.2 → 3.0.0)

```bash
pnpm release:major
```

## What These Commands Do

1. **`pnpm version [patch|minor|major]`** automatically:

   - Updates the version in `package.json`
   - Creates a git commit with message "v{version}"
   - Creates a git tag (e.g., `v2.2.3`)

2. **`pnpm run release:publish`** then:

   - Runs linting (`pnpm lint`)
   - Runs tests (`pnpm test`)
   - Builds the module (`pnpm prepack`)
   - Pushes the commit and tags to GitHub (`git push --follow-tags`)

3. **GitHub Actions** automatically:
   - The LTPR workflow detects the new tag
   - Runs comprehensive testing
   - Publishes to npm
   - Creates a GitHub release

## Manual Release (Legacy)

The original `pnpm release` command is still available if you prefer to handle versioning manually, but you'll need to update `package.json` and create tags yourself.

## Workflow

1. Make your changes and commit them
2. Run the appropriate release command (`pnpm release:patch`, `pnpm release:minor`, or `pnpm release:major`)
3. The automation handles the rest!

## Troubleshooting

If you need to cancel a release after running the command but before it completes:

- The version bump and tag are created locally first
- If something fails, you can reset with: `git reset --hard HEAD~1 && git tag -d v{version}`
- Then fix the issue and try again

## Benefits

- ✅ No more manual `package.json` editing
- ✅ No more manual git tagging
- ✅ Consistent version commit messages
- ✅ Automatic tag creation
- ✅ Integrated with existing CI/CD pipeline
- ✅ Prevents forgetting to update version before tagging
