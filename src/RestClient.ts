import * as vscode from "vscode";
import { LibraryProvider } from "./providers/LibraryProvider";
import { RequestProvider } from "./providers/RequestProvider";
import { ResponseProvider } from "./providers/ResponseProvider";
import { EnvironmentProvider } from "./providers/EnvironmentProvider";

class RestClient {
  libraryProvider: LibraryProvider;
  requestProvider: RequestProvider;
  responseProvider: ResponseProvider;
  environmentProvider: EnvironmentProvider;

  constructor(public context: vscode.ExtensionContext) {
    this.libraryProvider = new LibraryProvider(this);
    this.requestProvider = new RequestProvider(this);
    this.responseProvider = new ResponseProvider(this);
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
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        "rest-client-response",
        this.responseProvider
      )
    );

    this.libraryProvider.loadLibrary();
  }
}

export { RestClient };
