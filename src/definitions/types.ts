import * as vscode from "vscode";
import { RequestInit } from "node-fetch";

interface Request extends RequestInit {
  url: string;
}

type RequestFunction = (env: Record<string, unknown>) => Request;

interface CollectionItem {
  name: string;
  requestFunction: RequestFunction;
}

type Collection = CollectionItem[];

interface LibraryItem {
  name: string;
  collection: Collection;
}

type Library = LibraryItem[];

interface EnvironmentFile {
  name: string;
  uri: vscode.Uri;
}

enum RequestStatus {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export {
  Request,
  RequestFunction,
  CollectionItem,
  Collection,
  LibraryItem,
  Library,
  EnvironmentFile,
  RequestStatus,
};
