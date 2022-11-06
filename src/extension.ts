import * as vscode from "vscode";
import { RestClient } from "./RestClient";

export async function activate(context: vscode.ExtensionContext) {
  new RestClient(context);
}

export function deactivate() {}
