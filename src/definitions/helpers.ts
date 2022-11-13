import Handlebars = require("handlebars");
import * as vscode from "vscode";
import fs = require("fs");
import { Collection } from "./types";

const importWithoutCache = (path: string) => {
  delete require.cache[require.resolve(path)];
  return import(path);
};

const getCollectionFromFile = async (path: string): Promise<Collection> => {
  const imports = await importWithoutCache(path);
  const { requests = {} } = imports;
  const collection = Object.entries(requests).map(
    ([name, requestFunction]) => ({
      name,
      requestFunction,
    })
  );
  return collection as Collection;
};

const getWebviewUri = (
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
) => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));

const renderTemplate = (
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  templateName: string,
  scriptNames: string[],
  styleNames: string[],
  data: Record<string, unknown>
) => {
  const extensionUri = vscode.Uri.file(context.extensionPath);
  const toolkitUri = getWebviewUri(webview, extensionUri, [
    "node_modules",
    "@vscode",
    "webview-ui-toolkit",
    "dist",
    "toolkit.js",
  ]);
  const globalStyleUri = getWebviewUri(webview, extensionUri, [
    "webview-ui",
    "global.css",
  ]);
  const scriptUris = scriptNames.map((script) =>
    getWebviewUri(webview, extensionUri, ["webview-ui", script])
  );
  const styleUris = styleNames.map((style) =>
    getWebviewUri(webview, extensionUri, ["webview-ui", style])
  );

  const templateUri = vscode.Uri.joinPath(
    extensionUri,
    "webview-ui",
    "templates",
    templateName
  );
  const source = fs.readFileSync(templateUri.fsPath).toString();
  const template = Handlebars.compile(source);
  const renderData = {
    ...data,
    toolkitUri,
    globalStyleUri,
    scriptUris,
    styleUris,
  };
  return template(renderData);
};

export { getCollectionFromFile, renderTemplate };
