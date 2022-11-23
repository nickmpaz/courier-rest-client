import Handlebars = require("handlebars");
import * as vscode from "vscode";
import fs = require("fs");
import { Collection } from "./types";
import { v4 as uuidv4 } from "uuid";

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

const renderHTMLTemplate = (
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  templateName: string,
  scriptNames: string[],
  styleNames: string[],
  data: Record<string, unknown>
): string => {
  const extensionUri = vscode.Uri.file(context.extensionPath);
  const toolkitUri = getWebviewUri(webview, extensionUri, [
    "node_modules",
    "@vscode",
    "webview-ui-toolkit",
    "dist",
    "toolkit.js",
  ]);
  const codiconsUri = getWebviewUri(webview, extensionUri, [
    "node_modules",
    "@vscode/codicons",
    "dist",
    "codicon.css",
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

  Handlebars.registerHelper(
    "object-editor-each",
    function (context: any, name: string, options) {
      let entries: [string, unknown][];
      try {
        entries = Object.entries(context);
      } catch (err) {
        entries = [];
      }
      return entries.reduce((accum, [key, value]) => {
        const uuid = uuidv4();
        return accum + options.fn({ key, value, uuid, name });
      }, "");
    }
  );

  const template = Handlebars.compile(source);
  const renderData = {
    ...data,
    toolkitUri,
    globalStyleUri,
    scriptUris,
    styleUris,
    codiconsUri,
  };
  return template(renderData);
};

const getUrlWithoutSearchParams = (url?: string) => url?.split("?")[0] ?? "";

const getParams = (url: string | undefined): Record<string, string> => {
  if (url === undefined) {
    return {};
  }
  const search = new URL(url).search;
  const params = new URLSearchParams(search);
  return Object.fromEntries(params);
};

const buildUrl = (base: string, searchParams: Record<string, string>) => {
  const params = new URLSearchParams(searchParams);
  return `${base}?${params}`;
};

export {
  getCollectionFromFile,
  renderHTMLTemplate,
  getUrlWithoutSearchParams,
  getParams,
  buildUrl,
};
