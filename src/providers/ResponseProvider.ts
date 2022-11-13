import * as vscode from "vscode";
import { renderTemplate } from "../definitions/helpers";
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

    const templateData: Record<string, unknown> = {
      requestStatus,
    }
    switch (this.requestStatus) {
      case RequestStatus.Idle:
        templateData.isCode = false
        templateData.message = 'Send a request and the response will appear here.'
        break;
      case RequestStatus.Error:
      case RequestStatus.Success:
        templateData.isCode = true
        templateData.message = this.response
        break;
      case RequestStatus.Loading:
        templateData.isCode = false
        templateData.message = ''
        break;
    }
    this.view.webview.html = renderTemplate(
      this.restClient.context,
      this.view.webview,
      "response.hbs",
      [],
      ['response.css'],
      templateData
    );
  }
}

export { ResponseProvider, RequestStatus };
