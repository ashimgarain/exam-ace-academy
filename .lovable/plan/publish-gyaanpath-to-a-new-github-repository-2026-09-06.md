# Publish GyaanPath to a new GitHub repository

## Goal
Connect the Lovable project to a brand-new GitHub repository and push the current codebase there. Razorpay payment secrets will be added afterward.

## What I will do (after approval)
1. Verify the repo is ready for export:
   - Confirm no hardcoded secrets or API keys are in committed source files.
   - Check `.gitignore` covers build artifacts and local env files.
   - Add or update a `README.md` that explains the project, tech stack, and how to run it locally.
2. Run a final typecheck so the first push is clean.
3. Give you the exact GitHub-connect steps to complete in the Lovable editor.

## What you will do in the Lovable editor
1. Open the **Plus (+)** menu in the chat input (bottom left).
2. Choose **GitHub → Connect project**.
3. Authorize the Lovable GitHub App if prompted.
4. Select your GitHub account/organization.
5. Choose **Create a new repository** and name it (for example `gyaanpath`).
6. Click **Create Repository** — Lovable will push the current codebase and start two-way sync.

## After GitHub is connected
- Return here with your Razorpay **Key ID**, **Key Secret**, and **Webhook Secret** (test mode is fine) and I will add them securely so payments and the webhook work.
- If you want the app live on the web, I can then publish it from the Lovable editor.

## Notes
- Do not paste Razorpay secrets in chat; they will be requested through the secure secret form once GitHub sync is done.
- GitHub sync is a workspace-level action in the Lovable UI; it cannot be triggered from code, but I can prepare the code so the first sync succeeds without errors.
