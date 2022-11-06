const extensionNamespace = "courier-rest-client";
const requestFilesExtension = ".http.js";
const requestFilesPattern = `**/*${requestFilesExtension}`;
const envFilesExtension = ".http.env";
const envFilesPattern = `**/*${envFilesExtension}`;
const environmentIndicatorTextPrefix = "Courier Environment: ";
const environmentIndicatorNone = "None";
const pickEnvironmentTitle = "Pick Environment:";
const commands = {
  pickEnvironment: `${extensionNamespace}.pickEnvironment`,
  selectRequest: `${extensionNamespace}.selectRequest`,
};
const environmentIndicatorId = `${extensionNamespace}.environmentIndicator`;
const environmentStateKey = `activeEnvironment`;

export {
  extensionNamespace,
  requestFilesExtension,
  requestFilesPattern,
  envFilesExtension,
  envFilesPattern,
  environmentIndicatorTextPrefix,
  environmentIndicatorNone,
  pickEnvironmentTitle,
  commands,
  environmentIndicatorId,
  environmentStateKey,
};
