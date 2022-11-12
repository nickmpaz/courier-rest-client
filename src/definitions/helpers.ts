import * as vscode from "vscode";
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

const getWebviewHtml = (
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  title: string,
  scripts: string[],
  styles: string[],
  content: string
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

  const scriptUris = scripts.map((script) =>
    getWebviewUri(webview, extensionUri, ["webview-ui", script])
  );

  const styleUris = styles.map((style) =>
    getWebviewUri(webview, extensionUri, ["webview-ui", style])
  );

  return /*html*/ `
<!DOCTYPE html>
	<html lang="en" class="full-height">
	<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script type="module" src="${toolkitUri}"></script>
    <link rel="stylesheet" href="${globalStyleUri}">
    ${scriptUris.map(
      (uri) => /*html*/ `<script type="module" src="${uri}"></script>`
    )}
    ${styleUris.map((uri) => /*html*/ `<link rel="stylesheet" href="${uri}">`)}
	</head>
	<body class="full-height">${content}</body>
</html>
`;
};

export { getCollectionFromFile, getWebviewHtml };
