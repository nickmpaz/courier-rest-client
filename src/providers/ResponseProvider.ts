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
        this.view.webview.html = "Send a request";
        break;
      case RequestStatus.Loading:
        this.view.webview.html = "Loading...";
        break;
      case RequestStatus.Error:
        this.view.webview.html = "Error";
        break;
      case RequestStatus.Success:
        this.view.webview.html = getWebviewHtml(
          this.restClient.context,
          this.view.webview,
          "Response",
          [],
          [],
          /* html */ `
          <div class="code-display-container">
          <pre class="code-display">${this.response
            ?.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</pre>
            
            </div>
            `
        );
        break;
    }
  }
}

export { ResponseProvider, RequestStatus };
