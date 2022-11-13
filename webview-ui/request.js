const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  document.getElementById("send-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "send-request",
    });
  });

  document.getElementById("reset-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "reset-request",
    });
  });

  const bodyEditor = document.getElementById("body-editor");
  bodyEditor.addEventListener("input", function () {
    vscode.postMessage({
      command: "update-body",
      value: bodyEditor.innerText,
    });
  });
}
