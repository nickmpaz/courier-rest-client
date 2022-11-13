import * as vscode from "vscode";
import fetch from "node-fetch";
import { Request, RequestFunction } from "../definitions/types";
import { renderTemplate } from "../definitions/helpers";
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
        case "update-body":
          if (this.requestPayload) {
            this.requestPayload.body = message.value
          }
          break;
      }
    });
    this.update();
  }
  async sendRequest() {
    try {
      if (this.requestPayload === undefined) {
        return;
      }
      this.restClient.responseProvider.update(undefined, RequestStatus.Loading);
      const response = await fetch(this.requestPayload.url, this.requestPayload);
      this.restClient.responseProvider.update(
        await response.text(),
        response.ok ? RequestStatus.Success : RequestStatus.Error,
      );
    } catch (err: any) {
      this.restClient.responseProvider.update(err.message, RequestStatus.Error)
    }
  }

  async update(requestFunction?: RequestFunction) {
    this.requestFunction = requestFunction;
    if (!this.requestFunction || !this.view) {
      return;
    }
    const env = await this.restClient.environmentProvider.loadEnvironment();
    this.requestPayload = this.requestFunction(env);
    const requestBody = this.requestPayload?.body?.toString() ?? '{}';
    this.view.webview.html = "";
    this.view.webview.html = renderTemplate(
      this.restClient.context,
      this.view.webview,
      "request.hbs",
      ['request.js'],
      ['request.css'],
      {
        requestMethod: this.requestPayload.method?.toLowerCase() ?? 'get',
        requestUrl: this.requestPayload.url,
        requestBody: JSON.stringify(JSON.parse(requestBody), null, 2)
      }
    );
  }
}

export { RequestProvider };
