import * as vscode from "vscode";
import { getWebviewHtml } from "../definitions/helpers";
import { RequestStatus } from "../definitions/types";
import { RestClient } from "../RestClient";

class ResponseProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private response?: string;
  private requestStatus: RequestStatus = RequestStatus.Idle;
  private restClient: RestClient;

  constructor(restClient: RestClient) {
    this.restClient = restClient;
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): Promise<void> {
    this.view = webviewView;
    const extensionUri = vscode.Uri.file(this.restClient.context.extensionPath);
    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: [extensionUri],
    };
    this.update(undefined, RequestStatus.Idle);
  }

  async update(response: string | undefined, requestStatus: RequestStatus) {
    this.response = response;
    this.requestStatus = requestStatus;
    if (!this.view) {
      return;
    }

    switch (this.requestStatus) {
      case RequestStatus.Idle:
        this.view.webview.html = this.getContentHtml(
          this.view.webview,
          "Send a request and the response will appear here.",
          false,
        );
        break;
      case RequestStatus.Loading:
        this.view.webview.html = this.getLoadingHtml(this.view.webview);
        break;
      case RequestStatus.Error:
        this.view.webview.html = this.view.webview.html = this.getContentHtml(
          this.view.webview,
          "Error",
          false
        );
        break;
      case RequestStatus.Success:
        this.view.webview.html = this.getContentHtml(
          this.view.webview,
          this.response,
          true
        );
        break;
    }
  }

  getContentHtml(webview: vscode.Webview, content: string | undefined, isCode: boolean) {
    const contentTag = isCode ? 'pre' : 'div'
    return getWebviewHtml(
      this.restClient.context,
      webview,
      "Response",
      [],
      [],
      /* html */ `
      <div class="code-display-container full-height">
        <${contentTag} class="code-display full-height">${content
        ?.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}
        </${contentTag}>
      </div>`
    );
  }

  getLoadingHtml(webview: vscode.Webview) {
    return getWebviewHtml(
      this.restClient.context,
      webview,
      "Response",
      [],
      [],
      /* html */ `
      <div class="code-display-container full-height">
        <div class="code-display full-height center-content">
          <vscode-progress-ring></vscode-progress-ring>
        </div>
      </div>`
    );
  }
}

export { ResponseProvider, RequestStatus };
