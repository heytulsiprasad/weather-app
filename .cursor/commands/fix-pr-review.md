# PR Status Check & Review Resolution

Comprehensive command to check PR status, resolve review comments, and manage the review cycle.

## Instructions

### Phase 1: PR Status Assessment
1. Get current branch: `git branch --show-current`
2. Find associated PR: `gh pr list --head [branch-name]`
3. Show PR details: `gh pr view --json number,title,state,reviewDecision,reviews`
4. List pending reviewers: `gh pr view --json reviewRequests`
5. Show recent comments: `gh pr view --json comments | jq '.[-5:]'`

### Phase 2: Style Guide Compliance
1. Load and review style guides:
   - Read global `CLAUDE.md` for global styling rules
   - Read local `CLAUDE.md` and any file named `styleguide.md` for project-specific guidelines
   - Apply these standards throughout the review resolution process

### Phase 3: Review Comment Analysis
1. Fetch unresolved comments only: `gh pr view --json reviewThread | jq '.[] | select(.isResolved == false)'`
2. Extract actionable feedback from each unresolved comment
3. Categorize comments by:
   - Code style/formatting issues
   - Logic/functionality concerns  
   - Documentation/comment updates
   - Test coverage requirements
   - Performance/security improvements

### Phase 4: Resolution Planning
1. **Create detailed fix plan** showing:
   - List of all unresolved comments with context
   - Proposed solution for each comment
   - Files that need modification
   - Estimated complexity/effort for each fix
   - Recommended order of implementation
2. **Present plan to author** for approval before proceeding
3. Wait for explicit approval: "Proceed with the plan" or modifications

### Phase 5: Incremental Fix Implementation
⚠️ **CRITICAL: DO NOT USE `git commit` OR `git add` COMMANDS WITHOUT EXPLICIT AUTHOR APPROVAL** ⚠️

For each approved comment resolution:

1. **Show proposed code changes**:
   - Display current code section
   - Show proposed changes with diff highlighting
   - Explain the reasoning behind the fix
   - Reference relevant style guide rules if applicable
   - **🚨 NEVER RUN GIT COMMIT COMMANDS WITHOUT EXPLICIT APPROVAL 🚨**

2. **Wait for approval**: 
   - Present code changes clearly
   - Ask: "Approve this fix? (yes/no/modify)"
   - **⚠️ LLM: Do not proceed to commit until you receive explicit "yes" approval ⚠️**
   - Only proceed after explicit approval

3. **Implement and commit** (ONLY AFTER APPROVAL):
   - Apply the approved changes
   - **🔒 IMPORTANT: Only run `git add` and `git commit` after receiving explicit approval 🔒**
   - Create focused commit with descriptive message
   - Reference the specific review comment in commit body

4. **Verify fix**:
   - Run relevant tests if applicable
   - Confirm code follows style guidelines
   - Mark comment as addressed in tracking

### Phase 6: Final Steps
**⚠️ REMINDER: No git operations without approval ⚠️**

1. **Push all commits** (ONLY AFTER ALL COMMITS ARE APPROVED): `git push origin [branch-name]`
2. **Update PR with summary**:
   - Post comment listing all addressed review items
   - Mention specific reviewers: `@reviewer-username`
   - Include message: "All review comments have been addressed. Please take another look when you have a chance."

## Expected Output Summary

Provide a clear summary including:

### PR Status & Review State
- Current PR state (open/draft/ready)
- Review decision status (pending/approved/changes_requested)
- List of reviewers and their status

### Unresolved Issues Analysis  
- Count of unresolved comments
- Categorized breakdown of comment types
- Priority assessment of each issue

### Resolution Plan
- Step-by-step plan for addressing each comment
- Estimated timeline for completion
- Dependencies between fixes

### Next Steps
- Immediate actions required
- Who needs to take action (author/reviewers)
- Any blocking issues that need discussion

### Progress Tracking
- Comments addressed in this session
- Remaining work items
- Commits made and pushed

## Command Behavior Notes

- **Always maintain style guide compliance** throughout the process
- **🚨 CRITICAL: Never auto-commit without explicit approval from the author 🚨**
- **⚠️ LLM WARNING: Do not execute `git add`, `git commit`, or `git push` without explicit user consent ⚠️**
- **One commit per logical fix** to maintain clean history  
- **Show all code changes** before implementing
- **Provide context** for why each change addresses the review feedback
- **Handle merge conflicts** gracefully if they arise during push
- **Respect reviewer time** with clear, organized updates
- **🔒 APPROVAL REQUIRED: Each code modification must be explicitly approved before committing 🔒**

## LLM Safety Instructions
- **DO NOT** run any `git commit`, `git add`, or `git push` commands without explicit user approval
- **ALWAYS** show proposed changes first and wait for confirmation
- **STOP** and ask for approval before any git operations that modify the repository
- **PRESENT** all changes clearly before implementing them