import {
  StringDictionary,
  DokiThemeDefinitions,
  BaseAppDokiThemeDefinition,
  MasterDokiThemeDefinition,
  getDisplayName,
  resolvePaths,
  evaluateTemplates,
  constructNamedColorTemplate,
  fillInTemplateScript,
} from "doki-build-source";

type JupyterDokiThemeDefinition = BaseAppDokiThemeDefinition;

const fs = require("fs");

const path = require("path");

const {
  repoDirectory,
  masterThemeDefinitionDirectoryPath,
} = resolvePaths(__dirname);

const styleTemplateDirectoryPath = path.resolve(
  repoDirectory,
  "buildSrc",
  "assets",
  "templates",
);

// todo: dis
type DokiThemeJupyter = {
  [k: string]: any;
};

function hexToRGBA(hex) {
  const hexValue = parseInt(hex.substring(1), 16);
  return 'rgba(' + [
    (hexValue >> 24) & 255,
    (hexValue >> 16) & 255,
    (hexValue >> 8) & 255,
    hexValue & 255
  ].join(',') + ')';
}

function sanitizeColor(colorValue: string): string {
  if (colorValue.startsWith('#') && colorValue.length > 7) {
    return hexToRGBA(colorValue);
  }
  return colorValue;
}

function buildTemplateVariables(
  dokiThemeDefinition: MasterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions,
  dokiThemeJupyterDefinition: JupyterDokiThemeDefinition,
  dokiFileDefinitionPath: string,
): DokiThemeJupyter {
  const namedColors: StringDictionary<string> = constructNamedColorTemplate(
    dokiThemeDefinition,
    dokiTemplateDefinitions
  );
  const colorsOverride =
    dokiThemeJupyterDefinition.overrides.theme?.colors || {};
  const cleanedColors = Object.entries(namedColors)
    .reduce((accum, [colorName, colorValue]) => ({
      ...accum,
      [colorName]: sanitizeColor(colorValue),
    }), {});
  const evaluatedColors: StringDictionary<string> = {
    ...cleanedColors,
    ...colorsOverride,
  };
  return {
    ...evaluatedColors,
    stickerName: dokiThemeDefinition.stickers.default.name,
    anchor: dokiThemeDefinition.stickers.default.anchor || 'center',
    editorAccentColor: dokiThemeDefinition.overrides?.editorScheme?.colors?.accentColor || evaluatedColors.accentColor,
    stickerPath: getStickers(dokiThemeDefinition, dokiFileDefinitionPath).default.path,
  };
}

function createDokiTheme(
  dokiFileDefinitionPath: string,
  dokiThemeDefinition: MasterDokiThemeDefinition,
  _: DokiThemeDefinitions,
  dokiThemeJupyterDefinition: JupyterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions,
) {
  try {
    return {
      path: dokiFileDefinitionPath,
      definition: dokiThemeDefinition,
      stickers: getStickers(dokiThemeDefinition, dokiFileDefinitionPath),
      templateVariables: buildTemplateVariables(
        dokiThemeDefinition,
        dokiTemplateDefinitions,
        dokiThemeJupyterDefinition,
        dokiFileDefinitionPath,
      ),
      theme: {},
      jupyterDefinition: dokiThemeJupyterDefinition,
    };
  } catch (e) {
    throw new Error(
      `Unable to build ${dokiThemeDefinition.name}'s theme for reasons ${e}`
    );
  }
}

function resolveStickerPath(themeDefinitionPath: string, sticker: string) {
  const stickerPath = path.resolve(
    path.resolve(themeDefinitionPath, ".."),
    sticker
  );
  return stickerPath.substr(
    masterThemeDefinitionDirectoryPath.length + "/definitions".length
  );
}

const getStickers = (
  dokiDefinition: MasterDokiThemeDefinition,
  themePath: string
) => {
  const secondary =
    dokiDefinition.stickers.secondary;
  return {
    default: {
      path: resolveStickerPath(themePath, dokiDefinition.stickers.default.name),
      name: dokiDefinition.stickers.default.name,
    },
    ...(secondary
      ? {
        secondary: {
          path: resolveStickerPath(themePath, secondary.name),
          name: secondary.name,
        },
      }
      : {}),
  };
};

console.log("Preparing to generate themes.");
const themesDirectory = path.resolve(repoDirectory, "src", "dokithemejupyter");

evaluateTemplates(
  {
    appName: 'jupyter',
    currentWorkingDirectory: __dirname,
  },
  createDokiTheme
)
  .then((dokiThemes) => {
    // write less files from template
    const lessTemplate = fs.readFileSync(
      path.resolve(styleTemplateDirectoryPath, 'theme.less.template'), {
        encoding: "utf-8",
      });
    const themesLessDirectory = path.resolve(themesDirectory, "styles", "themes");
    if (!fs.existsSync(themesLessDirectory)) {
      fs.mkdirSync(themesLessDirectory);
    }
    dokiThemes.forEach(dokiTheme => {
      fs.writeFileSync(
        path.resolve(themesLessDirectory, `${
          dokiTheme.definition.id
        }.less`),
        fillInTemplateScript(lessTemplate, dokiTheme.templateVariables), {
          encoding: "utf-8",
        })
    });

    fs.writeFileSync(
      path.resolve(themesDirectory, "themes.py"),
      `themes = ${JSON.stringify(
        dokiThemes.reduce((accum, dokiTheme) => ({
          ...accum,
          [getDisplayName(dokiTheme)]: {
            id: dokiTheme.definition.id,
            colors: dokiTheme.templateVariables,
            name: dokiTheme.definition.displayName,
          }
        }), {}),
        null,
        2
      )}`,
      {
        encoding: "utf-8",
      }
    );
  })
  .then(() => {
    console.log("Theme Generation Complete!");
  });
