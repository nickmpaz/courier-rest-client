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
}

function update(data) {
  Object.entries(data).forEach(([key, value]) => {
    document.getElementById(key)[value.type] = value.content;
  });
  initObjectEditor("params");
  initObjectEditor("headers");
}

function focusResponseTab() {
  document.getElementById("panels").setAttribute("activeid", "tab-1");
}

function initObjectEditor(name) {
  const keyFields = document.querySelectorAll(
    `[data-object-editor-name="${name}"][data-object-editor-field-type="key"]`
  );
  const valueFields = document.querySelectorAll(
    `[data-object-editor-name="${name}"][data-object-editor-field-type="value"]`
  );
  const editorFields = [...keyFields, ...valueFields];
  editorFields.forEach((editorField) =>
    editorField.addEventListener("input", function () {
      sendObjectEditorPayload(name);
    })
  );

  const deleteButtons = document.querySelectorAll(
    `[data-object-editor-name="${name}"][data-object-editor-field-type="delete"]`
  );
  deleteButtons.forEach((button) => {
    const uuid = button.getAttribute("data-object-editor-uuid");
    button.addEventListener("click", function () {
      document
        .querySelector(
          `[data-object-editor-field-type="container"][data-object-editor-uuid="${uuid}"]`
        )
        .remove();
    });
  });
  const addButton = document.querySelector(
    `[data-object-editor-field-type="add"][data-object-editor-name="${name}"]`
  );
  addButton.addEventListener("click", function () {
    vscode.postMessage({
      command: `object-editor-add`,
      value: name,
    });
  });
}

function sendObjectEditorPayload(name) {
  const keyFields = document.querySelectorAll(
    `[data-object-editor-name="${name}"][data-object-editor-field-type="key"]`
  );
  const payload = {};
  keyFields.forEach((keyField) => {
    const keyFieldUuid = keyField.getAttribute("data-object-editor-uuid");
    const valueField = document.querySelector(
      `[data-object-editor-field-type="value"][data-object-editor-uuid="${keyFieldUuid}"]`
    );
    const key = keyField.innerText;
    const value = valueField.innerText;
    payload[key] = value;
  });
  vscode.postMessage({
    command: `object-editor-update-${name}`,
    value: payload,
  });
}
