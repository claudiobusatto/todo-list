import { config } from "./config";

type ReportResult = { jobId: string } | { skipped: true; reason: string; prUrl?: string } | null;

interface CoolKeeperOptions {
  orgId: string;
  apiKey: string;
  url: string;
  repoUrl: string;
  branch: string;
}

export class CoolKeeper {
  private orgId: string;
  private apiKey: string;
  private url: string;
  private repoUrl: string;
  private branch: string;

  constructor(opts: CoolKeeperOptions) {
    this.orgId = opts.orgId;
    this.apiKey = opts.apiKey;
    this.url = opts.url.replace(/\/$/, "");
    this.repoUrl = opts.repoUrl;
    this.branch = opts.branch;
  }

  async report(error: Error | string, context?: Record<string, unknown>): Promise<ReportResult> {
    try {
      const errorMessage = typeof error === "string" ? error : error.message;
      const stack = typeof error === "string" ? undefined : error.stack;

      const body = JSON.stringify({
        error: errorMessage,
        stack,
        repoUrl: this.repoUrl,
        branch: this.branch,
        context,
      });

      console.log({ body })

      const res = await fetch(`${this.url}/api/v1/errors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": this.orgId,
          "x-api-key": this.apiKey,
        },
        body,
      });

      if (!res.ok) {
        console.warn(`[cool-keeper] Error reporting failed: ${res.status} ${res.statusText}`);
        return null;
      }

      console.log({ resStatus: res.status })

      return await res.json();
    } catch (err) {
      console.warn("[cool-keeper] Failed to report error:", err);
      return null;
    }
  }
}

export const coolKeeper = new CoolKeeper({
  url: config.COOL_KEEPER_URL,
  orgId: config.COOL_KEEPER_ORG_ID,
  apiKey: config.COOL_KEEPER_API_KEY,
  repoUrl: config.COOL_KEEPER_REPO_URL,
  branch: config.COOL_KEEPER_BRANCH,
});
