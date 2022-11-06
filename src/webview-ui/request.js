const vscode = acquireVsCodeApi();

console.log("loading request.js");
window.addEventListener("load", main);

function main() {
  document.getElementById("send-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "send-request",
    });
  });
}
