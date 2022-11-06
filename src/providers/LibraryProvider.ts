import * as vscode from "vscode";
import path = require("path");
import { getCollectionFromFile } from "../definitions/helpers";
import { Collection, Library, RequestFunction } from "../definitions/types";
import {
  commands,
  requestFilesExtension,
  requestFilesPattern,
} from "../definitions/constants";
import { RestClient } from "../RestClient";

class LibraryProvider
  implements vscode.TreeDataProvider<CollectionTreeItem | RequestTreeItem>
{
  private library: Library = [];
  private restClient: RestClient;

  constructor(restClient: RestClient) {
    this.restClient = restClient;

    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.fileName.endsWith(requestFilesExtension)) {
        this.loadLibrary();
      }
    });
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    CollectionTreeItem | RequestTreeItem | undefined | null | void
  > = new vscode.EventEmitter<
    CollectionTreeItem | RequestTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    CollectionTreeItem | RequestTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;
  items: CollectionTreeItem[] = [];

  update(library: Library) {
    this.library = library;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: CollectionTreeItem | RequestTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: CollectionTreeItem | RequestTreeItem | undefined
  ): vscode.ProviderResult<(CollectionTreeItem | RequestTreeItem)[]> {
    return (
      element?.items ??
      this.library
        .map(
          (libraryItem) =>
            new CollectionTreeItem(libraryItem.name, libraryItem.collection)
        )
        .filter((collectionTreeItem) => collectionTreeItem.items.length > 0)
    );
  }

  async loadLibrary() {
    const requestFiles = await vscode.workspace.findFiles(requestFilesPattern);
    const library = await Promise.all(
      requestFiles.map(async (file) => {
        const collection = await getCollectionFromFile(file.fsPath);
        const name = path.basename(file.fsPath, requestFilesExtension);
        return { name, collection };
      })
    );
    this.update(library);
  }
}

class CollectionTreeItem extends vscode.TreeItem {
  items: RequestTreeItem[];
  constructor(name: string, collection: Collection) {
    super(name, vscode.TreeItemCollapsibleState.Expanded);
    this.items = collection.map(
      (item) => new RequestTreeItem(item.name, item.requestFunction)
    );
  }
}

class RequestTreeItem extends vscode.TreeItem {
  items: never[] = [];
  constructor(name: string, requestFunction: RequestFunction) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.command = {
      title: "Select Request",
      command: commands.selectRequest,
      arguments: [requestFunction],
    };
  }
}

export { LibraryProvider };
