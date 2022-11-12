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
    this.update()
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

  update(requestFunction?: RequestFunction) {
    this.requestFunction = requestFunction;
    if (!this.view) {
      return;
    }
    this.view.webview.html = this.getHtml(
      this.view.webview,
      this.requestFunction?.toString() ?? "Select a request",
      !!this.requestFunction
    );
  }

  getHtml(webview: vscode.Webview, content: string, isCode: boolean) {
    const contentTag = isCode ? "pre" : "div";
    return getWebviewHtml(
      this.restClient.context,
      webview,
      "Request",
      ["request.js"],
      ["request.css"],
      /* html */ `
      <div class="content-container full-height">
      <div class="actions">
        <vscode-button id="send-request" appearance="primary">Send</vscode-button>
      </div>
      <div class="code-display-container full-height flex-grow">
        <${contentTag} class="code-display full-height">${content}
        </${contentTag}>
      </div>
      </div>`
    );
  }
}

export { RequestProvider };
