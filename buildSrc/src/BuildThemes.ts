// @ts-ignore
import {DokiThemeDefinitions, JupyterDokiThemeDefinition, MasterDokiThemeDefinition, StringDictonary,} from "./types";
import GroupToNameMapping from "./GroupMappings";

const path = require("path");

const repoDirectory = path.resolve(__dirname, "..", "..");

const fs = require("fs");

const masterThemeDefinitionDirectoryPath = path.resolve(
  repoDirectory,
  "masterThemes"
);

const jupyterDefinitionDirectoryPath = path.resolve(
  repoDirectory,
  "buildSrc",
  "assets",
  "themes",
);

const styleTemplateDirectoryPath = path.resolve(
  repoDirectory,
  "buildSrc",
  "assets",
  "templates",
);

function walkDir(dir: string): Promise<string[]> {
  const values: Promise<string[]>[] = fs
    .readdirSync(dir)
    .map((file: string) => {
      const dirPath: string = path.join(dir, file);
      const isDirectory = fs.statSync(dirPath).isDirectory();
      if (isDirectory) {
        return walkDir(dirPath);
      } else {
        return Promise.resolve([path.join(dir, file)]);
      }
    });
  return Promise.all(values).then((scannedDirectories) =>
    scannedDirectories.reduce((accum, files) => accum.concat(files), [])
  );
}

const LAF_TYPE = "laf";
const SYNTAX_TYPE = "syntax";
const NAMED_COLOR_TYPE = "colorz";

function getTemplateType(templatePath: string) {
  if (templatePath.endsWith("laf.template.json")) {
    return LAF_TYPE;
  } else if (templatePath.endsWith("syntax.template.json")) {
    return SYNTAX_TYPE;
  } else if (templatePath.endsWith("colors.template.json")) {
    return NAMED_COLOR_TYPE;
  }
  return undefined;
}

function resolveTemplate<T, R>(
  childTemplate: T,
  templateNameToTemplate: StringDictonary<T>,
  attributeResolver: (t: T) => R,
  parentResolver: (t: T) => string
): R {
  if (!parentResolver(childTemplate)) {
    return attributeResolver(childTemplate);
  } else {
    const parent = templateNameToTemplate[parentResolver(childTemplate)];
    const resolvedParent = resolveTemplate(
      parent,
      templateNameToTemplate,
      attributeResolver,
      parentResolver
    );
    return {
      ...resolvedParent,
      ...attributeResolver(childTemplate),
    };
  }
}

function resolveColor(
  color: string,
  namedColors: StringDictonary<string>
): string {
  const startingTemplateIndex = color.indexOf("&");
  if (startingTemplateIndex > -1) {
    const lastDelimiterIndex = color.lastIndexOf("&");
    const namedColor = color.substring(
      startingTemplateIndex + 1,
      lastDelimiterIndex
    );
    const namedColorValue = namedColors[namedColor];
    if (!namedColorValue) {
      throw new Error(`Named color: '${namedColor}' is not present!`);
    }

    // todo: check for cyclic references
    if (color === namedColorValue) {
      throw new Error(
        `Very Cheeky, you set ${namedColor} to resolve to itself 😒`
      );
    }

    const resolvedNamedColor = resolveColor(namedColorValue, namedColors);
    if (!resolvedNamedColor) {
      throw new Error(`Cannot find named color '${namedColor}'.`);
    }
    return resolvedNamedColor + color.substring(lastDelimiterIndex + 1) || "";
  }

  return color;
}

function applyNamedColors(
  objectWithNamedColors: StringDictonary<string>,
  namedColors: StringDictonary<string>
): StringDictonary<string> {
  return Object.keys(objectWithNamedColors)
    .map((key) => {
      const color = objectWithNamedColors[key];
      const resolvedColor = resolveColor(color, namedColors);
      return {
        key,
        value: resolvedColor,
      };
    })
    .reduce((accum: StringDictonary<string>, kv) => {
      accum[kv.key] = kv.value;
      return accum;
    }, {});
}

function constructNamedColorTemplate(
  dokiThemeTemplateJson: MasterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions
) {
  const lafTemplates = dokiTemplateDefinitions[NAMED_COLOR_TYPE];
  const lafTemplate = dokiThemeTemplateJson.dark
    ? lafTemplates.dark
    : lafTemplates.light;

  const resolvedColorTemplate = resolveTemplate(
    lafTemplate,
    lafTemplates,
    (template) => template.colors,
    (template) => template.extends
  );

  const resolvedNameColors = resolveNamedColors(
    dokiTemplateDefinitions,
    dokiThemeTemplateJson
  );

  // do not really need to resolve, as there are no
  // &someName& colors, but what ever.
  const resolvedColors = applyNamedColors(
    resolvedColorTemplate,
    resolvedNameColors
  );
  return {
    ...resolvedColors,
    ...resolvedColorTemplate,
    ...resolvedNameColors,
  };
}

function resolveNamedColors(
  dokiTemplateDefinitions: DokiThemeDefinitions,
  dokiThemeTemplateJson: MasterDokiThemeDefinition
) {
  const colorTemplates = dokiTemplateDefinitions[NAMED_COLOR_TYPE];
  return resolveTemplate(
    dokiThemeTemplateJson,
    colorTemplates,
    (template) => template.colors,
    (template) =>
      // @ts-ignore
      template.extends ||
      (template.dark !== undefined &&
        (dokiThemeTemplateJson.dark ? "dark" : "light"))
  );
}

export interface StringDictionary<T> {
  [key: string]: T;
}

function getColorFromTemplate(
  templateVariables: StringDictionary<string>,
  templateVariable: string
) {
  const resolvedTemplateVariable = templateVariable
    .split("|")
    .map((namedColor) => templateVariables[namedColor])
    .filter(Boolean)[0];
  if (!resolvedTemplateVariable) {
    throw Error(`Template does not have variable ${templateVariable}`);
  }

  return resolvedTemplateVariable;
}

function resolveTemplateVariable(
  templateVariable: string,
  templateVariables: StringDictionary<string>
): string {
  const isToRGB = templateVariable.startsWith("^");
  const cleanTemplateVariable = templateVariable.substr(isToRGB ? 1 : 0);
  const hexColor = resolveColor(
    getColorFromTemplate(templateVariables, cleanTemplateVariable),
    templateVariables
  );
  return hexColor;
}

function fillInTemplateScript(
  templateToFillIn: string,
  templateVariables: StringDictionary<any>
) {
  return templateToFillIn
    .split("\n")
    .map((line) => {
      const reduce = line.split("").reduce(
        (accum, next) => {
          if (accum.currentTemplate) {
            if (next === "}" && accum.currentTemplate.endsWith("}")) {
              // evaluate Template
              const templateVariable = accum.currentTemplate.substring(
                2,
                accum.currentTemplate.length - 1
              );
              accum.currentTemplate = "";
              const resolvedTemplateVariable = resolveTemplateVariable(
                templateVariable,
                templateVariables
              );
              accum.line += resolvedTemplateVariable;
            } else {
              accum.currentTemplate += next;
            }
          } else if (next === "{" && !accum.stagingTemplate) {
            accum.stagingTemplate = next;
          } else if (accum.stagingTemplate && next === "{") {
            accum.stagingTemplate = "";
            accum.currentTemplate = "{{";
          } else if (accum.stagingTemplate) {
            accum.line += accum.stagingTemplate + next;
            accum.stagingTemplate = "";
          } else {
            accum.line += next;
          }

          return accum;
        },
        {
          currentTemplate: "",
          stagingTemplate: "",
          line: "",
        }
      );
      return reduce.line + reduce.stagingTemplate || reduce.currentTemplate;
    })
    .join("\n");
}

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
  dokiThemeJupyterDefinition: JupyterDokiThemeDefinition
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
    stickerName: dokiThemeDefinition.stickers.default,
    anchor: dokiThemeJupyterDefinition.backgrounds?.default?.anchor || 'center',
    editorAccentColor: dokiThemeDefinition.overrides?.editorScheme?.colors?.accentColor || evaluatedColors.accentColor,
  };
}

function createDokiTheme(
  dokiFileDefinitionPath: string,
  dokiThemeDefinition: MasterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions,
  dokiThemeJupyterDefinition: JupyterDokiThemeDefinition
) {
  try {
    return {
      path: dokiFileDefinitionPath,
      definition: dokiThemeDefinition,
      stickers: getStickers(dokiThemeDefinition, dokiFileDefinitionPath),
      templateVariables: buildTemplateVariables(
        dokiThemeDefinition,
        dokiTemplateDefinitions,
        dokiThemeJupyterDefinition
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

const readJson = <T>(jsonPath: string): T =>
  JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

type TemplateTypes = StringDictonary<StringDictonary<string>>;

const isTemplate = (filePath: string): boolean => !!getTemplateType(filePath);

const readTemplates = (templatePaths: string[]): TemplateTypes => {
  return templatePaths
    .filter(isTemplate)
    .map((templatePath) => {
      return {
        type: getTemplateType(templatePath)!!,
        template: readJson<any>(templatePath),
      };
    })
    .reduce(
      (accum: TemplateTypes, templateRepresentation) => {
        accum[templateRepresentation.type][
          templateRepresentation.template.name
          ] = templateRepresentation.template;
        return accum;
      },
      {
        [SYNTAX_TYPE]: {},
        [LAF_TYPE]: {},
        [NAMED_COLOR_TYPE]: {},
      }
    );
};

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
    dokiDefinition.stickers.secondary || dokiDefinition.stickers.normal;
  return {
    default: {
      path: resolveStickerPath(themePath, dokiDefinition.stickers.default),
      name: dokiDefinition.stickers.default,
    },
    ...(secondary
      ? {
        secondary: {
          path: resolveStickerPath(themePath, secondary),
          name: secondary,
        },
      }
      : {}),
  };
};

console.log("Preparing to generate themes.");

type DokiTheme = {
  path: string;
  templateVariables: DokiThemeJupyter;
  definition: MasterDokiThemeDefinition;
  stickers: { default: { path: string; name: string } };
  theme: {};
};

function getGroupName(dokiTheme: DokiTheme) {
  return GroupToNameMapping[dokiTheme.definition.group];
}

function getDisplayName(dokiTheme: DokiTheme) {
  return `${getGroupName(dokiTheme)}${dokiTheme.definition.name}`;
}

const themesDirectory = path.resolve(repoDirectory, "dokitheme");

walkDir(jupyterDefinitionDirectoryPath)
  .then((files) =>
    files.filter((file) => file.endsWith("jupyter.definition.json"))
  )
  .then((dokiThemeJupyterDefinitionPaths) => {
    return {
      dokiThemeJupyterDefinitions: dokiThemeJupyterDefinitionPaths
        .map((dokiThemeJupyterDefinitionPath) =>
          readJson<JupyterDokiThemeDefinition>(dokiThemeJupyterDefinitionPath)
        )
        .reduce((accum: StringDictonary<JupyterDokiThemeDefinition>, def) => {
          accum[def.id] = def;
          return accum;
        }, {}),
    };
  })
  .then(({dokiThemeJupyterDefinitions}) =>
    walkDir(path.resolve(masterThemeDefinitionDirectoryPath, "templates"))
      .then(readTemplates)
      .then((dokiTemplateDefinitions) => {
        return walkDir(
          path.resolve(masterThemeDefinitionDirectoryPath, "definitions")
        )
          .then((files) =>
            files.filter((file) => file.endsWith("master.definition.json"))
          )
          .then((dokiFileDefinitionPaths) => {
            return {
              dokiThemeJupyterDefinitions,
              dokiTemplateDefinitions,
              dokiFileDefinitionPaths,
            };
          });
      })
  )
  .then((templatesAndDefinitions) => {
    const {
      dokiTemplateDefinitions,
      dokiThemeJupyterDefinitions,
      dokiFileDefinitionPaths,
    } = templatesAndDefinitions;

    return dokiFileDefinitionPaths
      .map((dokiFileDefinitionPath) => {
        const dokiThemeDefinition = readJson<MasterDokiThemeDefinition>(
          dokiFileDefinitionPath
        );
        const dokiThemeJupyterDefinition =
          dokiThemeJupyterDefinitions[dokiThemeDefinition.id];
        if (!dokiThemeJupyterDefinition) {
          throw new Error(
            `${dokiThemeDefinition.displayName}'s theme does not have a Jupyter Definition!!`
          );
        }
        return {
          dokiFileDefinitionPath,
          dokiThemeDefinition,
          dokiThemeJupyterDefinition,
        };
      })
      .filter(
        (pathAndDefinition) =>
          (pathAndDefinition.dokiThemeDefinition.product === "ultimate" &&
            process.env.PRODUCT === "ultimate") ||
          pathAndDefinition.dokiThemeDefinition.product !== "ultimate"
      )
      .map(
        ({
           dokiFileDefinitionPath,
           dokiThemeDefinition,
           dokiThemeJupyterDefinition,
         }) =>
          createDokiTheme(
            dokiFileDefinitionPath,
            dokiThemeDefinition,
            dokiTemplateDefinitions,
            dokiThemeJupyterDefinition
          )
      );
  })
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
      fs.writeFileSync(path.resolve(themesLessDirectory, `${
        dokiTheme.definition.id
      }.less`), fillInTemplateScript(lessTemplate, dokiTheme.templateVariables), {
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
