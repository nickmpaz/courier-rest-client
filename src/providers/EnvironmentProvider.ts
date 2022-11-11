import * as vscode from "vscode";
import * as dotenv from "dotenv";
import path = require("path");
import { TextDecoder } from "util";
import { EnvironmentFile } from "../definitions/types";
import {
  commands,
  envFilesExtension,
  envFilesPattern,
  environmentIndicatorId,
  environmentIndicatorNone,
  environmentIndicatorTextPrefix,
  environmentStateKey,
  pickEnvironmentTitle,
} from "../definitions/constants";
import { RestClient } from "../RestClient";

class EnvironmentProvider {
  restClient: RestClient;
  statusBarItem: vscode.StatusBarItem;
  selectedEnvironmentFile?: EnvironmentFile;

  constructor(restClient: RestClient) {
    this.restClient = restClient;
    this.statusBarItem = vscode.window.createStatusBarItem(
      environmentIndicatorId
    );
    this.statusBarItem.command = commands.pickEnvironment;
    this.statusBarItem.show();
    this.restClient.context.subscriptions.push(this.statusBarItem);
    this.setInitialEnvironment();

    this.restClient.context.subscriptions.push(
      vscode.commands.registerCommand(commands.pickEnvironment, () =>
        this.pickEnvironment()
      )
    );
  }

  updateStatusBarText() {
    this.statusBarItem.text = `${environmentIndicatorTextPrefix}${
      this.selectedEnvironmentFile?.name ?? environmentIndicatorNone
    }`;
  }

  async getEnvironmentFiles(): Promise<EnvironmentFile[]> {
    const files = await vscode.workspace.findFiles(envFilesPattern);
    const environmentFiles = files.map((file) => ({
      name: path.basename(file.toString(), envFilesExtension),
      uri: file,
    }));
    return environmentFiles;
  }

  async pickEnvironment() {
    const environmentFiles = await this.getEnvironmentFiles();

    if (environmentFiles.length === 0) {
      // tell user that they need to make an env file
    } else {
      const environmentNames = environmentFiles.map((file) => file.name);
      const selection = await vscode.window.showQuickPick(environmentNames, {
        title: pickEnvironmentTitle,
      });
      const selectedEnvironmentFile = environmentFiles.find(
        (file) => file.name === selection
      );
      if (!selection || !selectedEnvironmentFile) {
        return;
      }

      this.selectedEnvironmentFile = selectedEnvironmentFile;
      this.restClient.context.workspaceState.update(
        environmentStateKey,
        selectedEnvironmentFile
      );
    }
    this.updateStatusBarText();
  }

  async setInitialEnvironment() {
    const activeEnvironment = await this.restClient.context.workspaceState.get<
      Promise<EnvironmentFile>
    >(environmentStateKey);
    const environmentFiles = await this.getEnvironmentFiles();

    if (environmentFiles.length) {
      this.selectedEnvironmentFile = environmentFiles[0];
    }

    if (activeEnvironment) {
      this.selectedEnvironmentFile = activeEnvironment;
    }
    this.updateStatusBarText();
  }

  async loadEnvironment(): Promise<Record<string, unknown>> {
    if (!this.selectedEnvironmentFile) {
      return {};
    }
    const fileContents = await vscode.workspace.fs.readFile(
      this.selectedEnvironmentFile.uri
    );
    return dotenv.parse(new TextDecoder().decode(fileContents));
  }
}

export { EnvironmentProvider };
