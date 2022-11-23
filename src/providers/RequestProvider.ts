import * as vscode from "vscode";
import fetch from "node-fetch";
import { AbortController } from "node-abort-controller";
import { Request, RequestFunction, RequestStatus } from "../definitions/types";
import { renderHTMLTemplate } from "../definitions/helpers";
import { RestClient } from "../RestClient";
import { commands } from "../definitions/constants";
import { Timer } from "../Timer";

class RequestProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private requestFunction?: RequestFunction;
  private requestPayload?: Request;
  private restClient: RestClient;
  private response?: string;
  private responseTime?: number;
  private requestStatus: RequestStatus = RequestStatus.Idle;
  private abortController?: AbortController;
  private timer = new Timer();

  constructor(restClient: RestClient) {
    this.restClient = restClient;
    this.restClient.context.subscriptions.push(
      vscode.commands.registerCommand(
        commands.selectRequest,
        (requestFunction: RequestFunction) =>
          this.selectRequestFunction(requestFunction)
      )
    );
  }

  async selectRequestFunction(requestFunction: RequestFunction) {
    this.requestFunction = requestFunction;
    this.abortRequest();
    this.clearResponse();
    this.requestStatus = RequestStatus.Idle;
    await this.calculateRequestPayload();
    this.update();
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
    this.view.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "load":
          this.update();
          break;
        case "send-request":
          this.sendRequest();
          break;
        case "abort-request":
          this.abortRequest();
          this.update();
          break;
        case "reset-request":
          this.abortRequest();
          this.clearResponse();
          this.requestStatus = RequestStatus.Idle;
          await this.calculateRequestPayload();
          this.update();
          break;
        case "update-body":
          if (this.requestPayload) {
            this.requestPayload.body = message.value;
          }
          break;
        case "object-editor-update-params":
          const params = message.value;
          break;
        case "object-editor-update-headers":
          const headers = message.value;
          if (this.requestPayload) {
            this.requestPayload.headers = headers;
          }
          break;
        case "object-editor-add":
          const name = message.value;
          if (name === "headers" && this.requestPayload) {
            this.requestPayload.headers = { ...this.requestPayload.headers, '': '' }
          }
          if (name === 'params' && this.requestPayload) {
            this.requestPayload.url += '&='
          }
          this.update();
          break;
      }
    });

    this.view.webview.html = this.renderTemplate("request.hbs");
  }

  abortRequest() {
    this.abortController?.abort();
  }

  clearResponse() {
    this.response = undefined;
    this.responseTime = undefined;
  }

  async sendRequest() {
    try {
      if (this.requestPayload === undefined) {
        return;
      }
      this.clearResponse();
      this.requestStatus = RequestStatus.Loading;
      this.update();
      this.timer.start();
      this.abortController = new AbortController();
      console.info("Sending request: ", this.requestPayload);
      const response = await fetch(this.requestPayload.url, {
        ...this.requestPayload,
        signal: this.abortController.signal,
      });
      this.responseTime = this.timer.end();
      this.response = await response.text();
      this.requestStatus = response.ok
        ? RequestStatus.Success
        : RequestStatus.Error;

      this.update();
      this.view?.webview.postMessage({
        command: "focusResponseTab",
      });
    } catch (err: any) {
      this.responseTime = this.timer.end();
      this.response = err.message;
      this.requestStatus = RequestStatus.Error;
      this.update();
    }
  }

  async calculateRequestPayload() {
    if (this.requestFunction) {
      const env = await this.restClient.environmentProvider.loadEnvironment();
      this.requestPayload = this.requestFunction(env);
    }
  }

  update() {
    if (!this.view) {
      return;
    }
    const data = {
      "request-response": {
        type: "innerText",
        content: this.response ?? "",
      },
      "request-method": {
        type: "innerHTML",
        content: this.renderTemplate("request-method.hbs", {
          requestMethod: this.requestPayload?.method?.toLowerCase() ?? "get",
        }),
      },
      "request-url": {
        type: "innerText",
        content: this.requestPayload?.url.split('?')[0] ?? "",
      },
      "request-body": {
        type: "innerText",
        content: JSON.stringify(
          JSON.parse(this.requestPayload?.body?.toString() ?? "{}"),
          null,
          2
        ),
      },
      "request-status": {
        type: "innerHTML",
        content: this.renderTemplate("request-status.hbs", {
          requestStatus: this.requestStatus,
          responseTime: this.responseTime,
        }),
      },
      "request-params": {
        type: "innerHTML",
        content: this.renderTemplate("object-editor.hbs", {
          name: "params",
          obj: getParams(this.requestPayload?.url),
        }),
      },
      "request-headers": {
        type: "innerHTML",
        content: this.renderTemplate("object-editor.hbs", {
          name: "headers",
          obj: this.requestPayload?.headers,
        }),
      },
    };
    this.view.webview.postMessage({
      command: "update",
      data,
    });
  }

  renderTemplate(templateName: string, data?: Record<string, unknown>) {
    if (!this.view) {
      return "";
    }
    return renderHTMLTemplate(
      this.restClient.context,
      this.view.webview,
      templateName,
      ["request.js"],
      ["request.css"],
      data ?? {}
    );
  }
}

const getParams = (url: string | undefined): Record<string, string> => {
  if (url === undefined) {
    return {};
  }
  const search = new URL(url).search;
  const params = new URLSearchParams(search);
  return Object.fromEntries(params);
};

export { RequestProvider };
