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

  document.querySelectorAll(".request-property-input").forEach((el) => {
    el.addEventListener("input", function (evt) {
      const value = this.value;
      const key = el.getAttribute("data-request-property");
      console.log({ key, value });
      vscode.postMessage({
        command: "update-request-property",
        key,
        value,
      });
    });
  });
}
