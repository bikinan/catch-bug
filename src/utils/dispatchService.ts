/**
 * CatchBug Dispatch Service
 * Handles dispatching bug reports to GitHub Issues and Slack/Discord Webhooks
 * via the background service worker proxy to bypass host-page CSP restrictions.
 */

export interface GitHubTestResult {
  success: boolean;
  fullName?: string;
  private?: boolean;
  error?: string;
}

export interface GitHubIssueResult {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  error?: string;
}

export interface WebhookResult {
  success: boolean;
  error?: string;
}

/**
 * Tests connection to a GitHub repository using a PAT.
 */
export async function testGitHubConnection(token: string, repo: string): Promise<GitHubTestResult> {
  try {
    const res = await browser.runtime.sendMessage({
      type: "TEST_GITHUB_CONNECTION",
      payload: { token, repo },
    });
    return res || { success: false, error: "No response from background script" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Dispatches a formatted bug report as a new GitHub issue.
 */
export async function dispatchGitHubIssue(params: {
  token: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}): Promise<GitHubIssueResult> {
  try {
    const res = await browser.runtime.sendMessage({
      type: "DISPATCH_GITHUB_ISSUE",
      payload: params,
    });
    return res || { success: false, error: "No response from background script" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Sends a test ping to Slack or Discord webhook.
 */
export async function testWebhookPing(webhookUrl: string): Promise<WebhookResult> {
  try {
    const res = await browser.runtime.sendMessage({
      type: "TEST_WEBHOOK_PING",
      payload: { webhookUrl },
    });
    return res || { success: false, error: "No response from background script" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Formats and dispatches bug report telemetry to a Slack or Discord webhook.
 */
export async function dispatchWebhook(params: {
  webhookUrl: string;
  pageUrl: string;
  viewport: string;
  errorsCount: number;
  breadcrumbsCount: number;
  latestErrorSnippet: string;
  reportMarkdown?: string;
}): Promise<WebhookResult> {
  const { webhookUrl, pageUrl, viewport, errorsCount, breadcrumbsCount, latestErrorSnippet } = params;

  const isDiscord = webhookUrl.includes("discord.com/api/webhooks");

  let payload: Record<string, unknown>;

  if (isDiscord) {
    payload = {
      embeds: [
        {
          title: "🚨 CatchBug Telemetry Report",
          description: `**Target:** ${pageUrl}\n**Viewport:** ${viewport}\n**Diagnostics:** ${errorsCount} errors | ${breadcrumbsCount} actions`,
          color: 16007006, // #f43f5e
          fields: latestErrorSnippet
            ? [
                {
                  name: "Latest Diagnostic Log",
                  value: `\`\`\`\n${latestErrorSnippet.slice(0, 1000)}\n\`\`\``,
                },
              ]
            : [],
          footer: { text: "Dispatched via CatchBug Extension" },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } else {
    // Standard Slack Block Kit payload
    const blocks: unknown[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 CatchBug Telemetry Alert",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Target Page:*\n<${pageUrl}|${pageUrl}>`,
          },
          {
            type: "mrkdwn",
            text: `*Diagnostics:*\n${errorsCount} captured errors • ${breadcrumbsCount} breadcrumbs`,
          },
        ],
      },
    ];

    if (latestErrorSnippet) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Latest Error Summary:*\n\`\`\`\n${latestErrorSnippet.slice(0, 1500)}\n\`\`\``,
        },
      });
    }

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Viewport: \`${viewport}\` • Generated with *CatchBug QA Extension*`,
        },
      ],
    });

    payload = { blocks };
  }

  try {
    const res = await browser.runtime.sendMessage({
      type: "DISPATCH_WEBHOOK",
      payload: { webhookUrl, payload },
    });
    return res || { success: false, error: "No response from background script" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Generates an intelligent default issue title based on current page URL and telemetry.
 */
export function generateDefaultIssueTitle(url: string, firstErrorText?: string): string {
  let path = "/";
  try {
    const parsed = new URL(url);
    path = parsed.pathname || "/";
  } catch {
    path = url;
  }

  if (firstErrorText) {
    const cleanError = firstErrorText.replace(/[\n\r]+/g, " ").trim().slice(0, 60);
    return `[Bug] ${cleanError} on ${path}`;
  }

  return `[Bug] Diagnostics Report on ${path}`;
}
