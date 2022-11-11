const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  document.getElementById("send-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "send-request",
    });
  });
}
