const vscode = acquireVsCodeApi();

window.addEventListener("load", main);
window.addEventListener("load", () => vscode.postMessage({ command: "load" }));

window.addEventListener("message", (event) => {
  const message = event.data;
  const data = event.data.data;

  switch (message.command) {
    case "update":
      update(data);
      break;
    case "focusResponseTab":
      focusResponseTab();
      break;
  }
});

function update(data) {
  Object.entries(data).forEach(([key, value]) => {
    document.getElementById(key)[value.type] = value.content;
  });
}

function main() {
  document.getElementById("send-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "send-request",
    });
  });

  document.getElementById("abort-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "abort-request",
    });
  });

  document.getElementById("reset-request").addEventListener("click", () => {
    vscode.postMessage({
      command: "reset-request",
    });
  });

  const bodyEditor = document.getElementById("request-body");
  bodyEditor.addEventListener("input", function () {
    vscode.postMessage({
      command: "update-body",
      value: bodyEditor.innerText,
    });
  });

  const objectEditors = document.querySelectorAll(".object-editor");

  objectEditors.forEach((objectEditor) => {
    objectEditor.addEventListener("click", function (evt) {
      if (evt.target.className.includes("delete")) {
        const objectEditorField = evt.target.closest(".object-editor-field");
        objectEditorField.remove();
        sendObjectEditorPayload(objectEditor);
      }
      if (evt.target.className.includes("add")) {
        const templateNode = objectEditor.querySelector(
          ".object-editor-field-template"
        );
        const clone = templateNode.cloneNode(true);
        clone.classList.remove("object-editor-field-template");
        clone.classList.add("object-editor-field");
        clone.style.removeProperty("display");
        const objectEditorFieldsContainer = objectEditor.querySelector(
          ".object-editor-fields"
        );
        objectEditorFieldsContainer.appendChild(clone);
      }
    });

    objectEditor.addEventListener("input", function () {
      sendObjectEditorPayload(objectEditor);
    });
  });
}

function sendObjectEditorPayload(objectEditor) {
  const objectEditorFieldsContainer = objectEditor.querySelector(
    ".object-editor-fields"
  );
  const objectEditorFields = objectEditorFieldsContainer.querySelectorAll(
    ".object-editor-field"
  );
  const object = {};
  objectEditorFields.forEach((objectEditorField) => {
    const keyEl = objectEditorField.querySelector(".object-editor-key");
    const valueEl = objectEditorField.querySelector(".object-editor-value");
    object[keyEl.innerText] = valueEl.innerText;
  });
  vscode.postMessage({
    command: `object-editor-update-${objectEditor.id}`,
    value: object,
  });
}

function focusResponseTab() {
  document.getElementById("panels").setAttribute("activeid", "tab-1");
}
