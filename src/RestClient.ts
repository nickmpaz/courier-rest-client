import * as vscode from "vscode";
import { LibraryProvider } from "./providers/LibraryProvider";
import { RequestProvider } from "./providers/RequestProvider";
import { EnvironmentProvider } from "./providers/EnvironmentProvider";

class RestClient {
  libraryProvider: LibraryProvider;
  requestProvider: RequestProvider;
  environmentProvider: EnvironmentProvider;

  constructor(public context: vscode.ExtensionContext) {
    this.libraryProvider = new LibraryProvider(this);
    this.requestProvider = new RequestProvider(this);
    this.environmentProvider = new EnvironmentProvider(this);

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        "rest-client-library",
        this.libraryProvider
      )
    );
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        "rest-client-request",
        this.requestProvider
      )
    );


    this.libraryProvider.loadLibrary();
  }
}

export { RestClient };
