import * as vscode from "vscode";
import fetch from "node-fetch";
import { RequestFunction } from "../definitions/types";
import { getWebviewHtml } from "../definitions/helpers";
import { RestClient } from "../RestClient";
import { RequestStatus } from "./ResponseProvider";
import { commands } from "../definitions/constants";

class RequestProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private requestFunction?: RequestFunction;
  private restClient: RestClient;

  constructor(restClient: RestClient) {
    this.restClient = restClient;
    this.restClient.context.subscriptions.push(
      vscode.commands.registerCommand(
        commands.selectRequest,
        (requestFunction: RequestFunction) => this.update(requestFunction)
      )
    );
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.view = webviewView;
    const extensionUri = vscode.Uri.file(this.restClient.context.extensionPath);
    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: [extensionUri],
    };
    this.view.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "send-request":
          this.sendRequest();
      }
    });
  }
  async sendRequest() {
    if (this.requestFunction === undefined) {
      return;
    }

    this.restClient.responseProvider.update(undefined, RequestStatus.Loading);
    const env = await this.restClient.environmentProvider.loadEnvironment();
    const request = this.requestFunction(env);
    const response = await fetch(request.url, request);
    this.restClient.responseProvider.update(
      await response.text(),
      RequestStatus.Success
    );
  }

  update(requestFunction: RequestFunction) {
    this.requestFunction = requestFunction;
    if (!this.view) {
      return;
    }
    this.view.webview.html = getWebviewHtml(
      this.restClient.context,
      this.view.webview,
      "Request",
      ["request.js"],
      ["request.css"],
      /*html*/ `
<div class="actions">
  <vscode-button id="send-request" appearance="primary">Send request</vscode-button>
</div>
<pre>${this.requestFunction?.toString()}</pre>
`
    );
  }
}

export { RequestProvider };
