import * as vscode from "vscode";
import fetch from "node-fetch";
import { Request, RequestFunction } from "../definitions/types";
import { getWebviewHtml } from "../definitions/helpers";
import { RestClient } from "../RestClient";
import { RequestStatus } from "./ResponseProvider";
import { commands } from "../definitions/constants";

class RequestProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private requestFunction?: RequestFunction;
  private requestPayload?: Request;
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
          break;
        case "reset-request":
          this.update(this.requestFunction);
          break;
        case "update-request-property":
          if (this.requestPayload) {
            this.requestPayload = {
              ...this.requestPayload,
              [message.key]: message.value,
            };
          }
          break;
      }
    });
    this.update();
  }
  async sendRequest() {
    if (this.requestPayload === undefined) {
      return;
    }
    this.restClient.responseProvider.update(undefined, RequestStatus.Loading);
    const response = await fetch(this.requestPayload.url, this.requestPayload);
    this.restClient.responseProvider.update(
      await response.text(),
      RequestStatus.Success
    );
  }

  async update(requestFunction?: RequestFunction) {
    this.requestFunction = requestFunction;
    if (!this.requestFunction || !this.view) {
      return;
    }
    const env = await this.restClient.environmentProvider.loadEnvironment();
    this.requestPayload = this.requestFunction(env);
    this.view.webview.html = "";
    this.view.webview.html = this.getHtml(
      this.view.webview,
      this.requestPayload ?? { url: "none" },
      !!this.requestPayload
    );
  }

  getHtml(webview: vscode.Webview, request: Request, isCode: boolean) {
    return getWebviewHtml(
      this.restClient.context,
      webview,
      "Request",
      ["request.js"],
      ["request.css"],
      /* html */ `
      <div class="content-container full-height">
        <div class="actions">
          <vscode-button id="reset-request" appearance="secondary">Reset</vscode-button>
          <vscode-button id="send-request" appearance="primary">Send</vscode-button>
        </div>
        ${Object.entries(request)
          .map(
            ([key, value]) => /* html */ `
              <vscode-text-field value="${value}" class="request-property-input" data-request-property="${key}">
                ${key}
              </vscode-text-field>`
          )
          .join(" ")}

      </div>`
    );
  }
}

export { RequestProvider };
  