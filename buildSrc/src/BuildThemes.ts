// @ts-ignore
import {DokiThemeDefinitions, EclipseDokiThemeDefinition, MasterDokiThemeDefinition, StringDictonary} from './types';
import GroupToNameMapping from "./GroupMappings";

const path = require('path');

const repoDirectory = path.resolve(__dirname, '..', '..');

const fs = require('fs');

const masterThemeDefinitionDirectoryPath =
  path.resolve(repoDirectory, 'masterThemes');

const eclipseTemplateDefinitionDirectoryPath = path.resolve(
  repoDirectory,
  "buildAssets",
  "templates"
);

const eclipseDefinitionDirectoryPath = path.resolve(
  repoDirectory,
  "buildSrc",
  "assets",
  "templates"
);


function walkDir(dir: string): Promise<string[]> {
  const values: Promise<string[]>[] = fs.readdirSync(dir)
    .map((file: string) => {
      const dirPath: string = path.join(dir, file);
      const isDirectory = fs.statSync(dirPath).isDirectory();
      if (isDirectory) {
        return walkDir(dirPath);
      } else {
        return Promise.resolve([path.join(dir, file)]);
      }
    });
  return Promise.all(values)
    .then((scannedDirectories) => scannedDirectories
      .reduce((accum, files) => accum.concat(files), []));
}

const LAF_TYPE = 'laf';
const SYNTAX_TYPE = 'syntax';
const NAMED_COLOR_TYPE = 'colorz';

function getTemplateType(templatePath: string) {
  if (templatePath.endsWith('laf.template.json')) {
    return LAF_TYPE;
  } else if (templatePath.endsWith('syntax.template.json')) {
    return SYNTAX_TYPE;
  } else if (templatePath.endsWith('colors.template.json')) {
    return NAMED_COLOR_TYPE;
  }
  return undefined;
}


function resolveTemplate<T, R>(
  childTemplate: T,
  templateNameToTemplate: StringDictonary<T>,
  attributeResolver: (t: T) => R,
  parentResolver: (t: T) => string,
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
      ...attributeResolver(childTemplate)
    };
  }
}


function resolveColor(
  color: string,
  namedColors: StringDictonary<string>
): string {
  const startingTemplateIndex = color.indexOf('&');
  if (startingTemplateIndex > -1) {
    const lastDelimiterIndex = color.lastIndexOf('&');
    const namedColor =
      color.substring(startingTemplateIndex + 1, lastDelimiterIndex);
    const namedColorValue = namedColors[namedColor];
    if (!namedColorValue) {
      throw new Error(`Named color: '${namedColor}' is not present!`);
    }

    // todo: check for cyclic references
    if (color === namedColorValue) {
      throw new Error(`Very Cheeky, you set ${namedColor} to resolve to itself 😒`);
    }

    const resolvedNamedColor = resolveColor(namedColorValue, namedColors);
    if (!resolvedNamedColor) {
      throw new Error(`Cannot find named color '${namedColor}'.`);
    }
    return resolvedNamedColor + color.substring(lastDelimiterIndex + 1) || '';
  }

  return color;
}

function applyNamedColors(
  objectWithNamedColors: StringDictonary<string>,
  namedColors: StringDictonary<string>,
): StringDictonary<string> {
  return Object.keys(objectWithNamedColors)
    .map(key => {
      const color = objectWithNamedColors[key];
      const resolvedColor = resolveColor(
        color,
        namedColors
      );
      return {
        key,
        value: resolvedColor
      };
    }).reduce((accum: StringDictonary<string>, kv) => {
      accum[kv.key] = kv.value;
      return accum;
    }, {});
}

function constructNamedColorTemplate(
  dokiThemeTemplateJson: MasterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions
) {
  const lafTemplates = dokiTemplateDefinitions[NAMED_COLOR_TYPE];
  const lafTemplate =
    (dokiThemeTemplateJson.dark ?
      lafTemplates.dark : lafTemplates.light);

  const resolvedColorTemplate =
    resolveTemplate(
      lafTemplate, lafTemplates,
      template => template.colors,
      template => template.extends
    );

  const resolvedNameColors = resolveNamedColors(
    dokiTemplateDefinitions,
    dokiThemeTemplateJson
  );

  // do not really need to resolve, as there are no
  // &someName& colors, but what ever.
  const resolvedColors =
    applyNamedColors(resolvedColorTemplate, resolvedNameColors);
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
    template => template.colors,
    // @ts-ignore
    template => template.extends ||
      template.dark !== undefined && (dokiThemeTemplateJson.dark ?
        'dark' : 'light'));
}

export interface StringDictionary<T> {
  [key: string]: T;
}

function getColorFromTemplate(templateVariables: StringDictionary<string>, templateVariable: string) {
  const resolvedTemplateVariable = templateVariable.split('|')
    .map(namedColor => templateVariables[namedColor])
    .filter(Boolean)[0]
  if (!resolvedTemplateVariable) {
    throw Error(`Template does not have variable ${templateVariable}`)
  }

  return resolvedTemplateVariable;
}


function resolveTemplateVariable(
  templateVariable: string,
  templateVariables: StringDictionary<string>,
): string {
  const isToRGB = templateVariable.startsWith('^');
  const cleanTemplateVariable = templateVariable.substr(isToRGB ? 1 : 0);
  const hexColor = resolveColor(getColorFromTemplate(templateVariables, cleanTemplateVariable), templateVariables);
  return isToRGB ? hexToRGB(hexColor).join(',') : hexColor;
}


function fillInTemplateScript(
  templateToFillIn: string,
  templateVariables: StringDictionary<any>,
) {
  return templateToFillIn.split('\n')
    .map(line => {
      const reduce = line.split("").reduce((accum, next) => {
        if (accum.currentTemplate) {
          if (next === '}' && accum.currentTemplate.endsWith('}')) {
            // evaluate Template
            const templateVariable = accum.currentTemplate.substring(2, accum.currentTemplate.length - 1)
            accum.currentTemplate = ''
            const resolvedTemplateVariable = resolveTemplateVariable(
              templateVariable,
              templateVariables
            )
            accum.line += resolvedTemplateVariable
          } else {
            accum.currentTemplate += next
          }
        } else if (next === '{' && !accum.stagingTemplate) {
          accum.stagingTemplate = next
        } else if (accum.stagingTemplate && next === '{') {
          accum.stagingTemplate = '';
          accum.currentTemplate = '{{';
        } else if (accum.stagingTemplate) {
          accum.line += accum.stagingTemplate + next;
          accum.stagingTemplate = ''
        } else {
          accum.line += next;
        }

        return accum;
      }, {
        currentTemplate: '',
        stagingTemplate: '',
        line: '',
      });
      return reduce.line + reduce.stagingTemplate || reduce.currentTemplate;
    }).join('\n');
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl([r, g, b]: [number, number, number]) {
  r /= 255, g /= 255, b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s: number;
  let h = l;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ Math.round(h * 300), Math.round(s * 100), Math.round(l * 100) ];
}

function hexToRGB(s: string | [number, number, number]): [number, number, number] {
  if (typeof s === 'string') {
    const hex = parseInt(s.substr(1), 16)
    return [
      (hex & 0xFF0000) >> 16,
      (hex & 0xFF00) >> 8,
      (hex & 0xFF)
    ]
  }
  return s;

}

// todo: dis
type DokiThemeEclipse = {
  [k: string]: any
}

function buildNamedColors(
  dokiThemeDefinition: MasterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions,
  dokiThemeEclipseDefinition: EclipseDokiThemeDefinition,
): DokiThemeEclipse {
  const namedColors = constructNamedColorTemplate(
    dokiThemeDefinition, dokiTemplateDefinitions
  )
  const colorsOverride = dokiThemeEclipseDefinition.overrides.theme?.colors || {};
  return {
    ...namedColors,
    ...colorsOverride
  };
}

function createDokiTheme(
  dokiFileDefinitionPath: string,
  dokiThemeDefinition: MasterDokiThemeDefinition,
  dokiTemplateDefinitions: DokiThemeDefinitions,
  dokiThemeEclipseDefinition: EclipseDokiThemeDefinition,
) {
  try {
    return {
      path: dokiFileDefinitionPath,
      definition: dokiThemeDefinition,
      stickers: getStickers(
        dokiThemeDefinition,
        dokiFileDefinitionPath
      ),
      namedColors: buildNamedColors(
        dokiThemeDefinition,
        dokiTemplateDefinitions,
        dokiThemeEclipseDefinition,
      ),
      theme: {},
      eclipseDefinition: dokiThemeEclipseDefinition
    };
  } catch (e) {
    throw new Error(`Unable to build ${dokiThemeDefinition.name}'s theme for reasons ${e}`);
  }
}

const readJson = <T>(jsonPath: string): T =>
  JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

type TemplateTypes = StringDictonary<StringDictonary<string>>;

const isTemplate = (filePath: string): boolean =>
  !!getTemplateType(filePath);

const readTemplates = (templatePaths: string[]): TemplateTypes => {
  return templatePaths
    .filter(isTemplate)
    .map(templatePath => {
      return {
        type: getTemplateType(templatePath)!!,
        template: readJson<any>(templatePath)
      };
    })
    .reduce((accum: TemplateTypes, templateRepresentation) => {
      accum[templateRepresentation.type][templateRepresentation.template.name] =
        templateRepresentation.template;
      return accum;
    }, {
      [SYNTAX_TYPE]: {},
      [LAF_TYPE]: {},
      [NAMED_COLOR_TYPE]: {},
    });
};

function resolveStickerPath(
  themeDefinitionPath: string,
  sticker: string,
) {
  const stickerPath = path.resolve(
    path.resolve(themeDefinitionPath, '..'),
    sticker
  );
  return stickerPath.substr(masterThemeDefinitionDirectoryPath.length + '/definitions'.length);
}


const getStickers = (
  dokiDefinition: MasterDokiThemeDefinition,
  themePath: string,
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

console.log('Preparing to generate themes.');

type DokiTheme = { path: string; namedColors: DokiThemeEclipse; definition: MasterDokiThemeDefinition; stickers: { default: { path: string; name: string } }; theme: {} };

function getGroupName(dokiTheme: DokiTheme) {
  return GroupToNameMapping[dokiTheme.definition.group];
}

function getDisplayName(dokiTheme: DokiTheme) {
  return `${(getGroupName(dokiTheme))}${dokiTheme.definition.name}`;
}

function buildThemeId(dokiTheme: { path: string; definition: MasterDokiThemeDefinition; stickers: { default: { path: string; name: string } }; theme: {}; namedColors: DokiThemeEclipse }) {
  return `${dokiTheme.definition.dark ? 'dark_' : ''}${dokiTheme.definition.id}`;
}

const themesDirectory = path.resolve(repoDirectory, 'plugin-source', 'themes');

function writeCssFile(pathSegments: string, templateToFillIn: string, dokiTheme: { path: string; definition: MasterDokiThemeDefinition; stickers: { default: { path: string; name: string } }; theme: {}; namedColors: DokiThemeEclipse }) {
  fs.writeFileSync(
    path.resolve(themesDirectory, 'css', pathSegments),
    fillInTemplateScript(
      templateToFillIn,
      dokiTheme.namedColors
    ),
    {
      encoding: 'utf-8',
    },
  );
}

const devstyleAssetsDirectory = path.resolve(repoDirectory, 'devStyleThemes')
function writeSyntaxFile(pathSegments: string,
                         templateToFillIn: string, dokiTheme: { path: string; definition: MasterDokiThemeDefinition; stickers: { default: { path: string; name: string } }; theme: {}; namedColors: DokiThemeEclipse, eclipseDefinition: EclipseDokiThemeDefinition },
                         themeId: number) {
  const themeDirectory = path.resolve(devstyleAssetsDirectory, getDisplayName(dokiTheme))
  const devstyleSyntaxXml = path.resolve(themeDirectory, pathSegments);
  fs.mkdirSync(path.dirname(devstyleSyntaxXml), {recursive: true})
  const hsl = rgbToHsl(hexToRGB(dokiTheme.namedColors.baseBackground)).join(', ')
  const themeToCustomize = dokiTheme.definition.dark ? `Dark` : `Light`
  fs.writeFileSync(
    path.resolve(themeDirectory, `${themeToCustomize} Custom HSL: ${hsl}`),
    hsl
  )
  fs.writeFileSync(
    devstyleSyntaxXml,
    fillInTemplateScript(
      templateToFillIn,
      {
        ...dokiTheme.namedColors,
        ...(dokiTheme.definition.overrides?.editorScheme?.colors || {}),
        ...(dokiTheme.eclipseDefinition.overrides.editorScheme?.colors || {}),
        ...dokiTheme.definition,
        themeId: themeId.toString(),
        modifiedDate: new Date().toISOString()
      }
    ),
    {
      encoding: 'utf-8',
    },
  );
}

walkDir(eclipseDefinitionDirectoryPath)
  .then((files) =>
    files.filter((file) => file.endsWith("eclipse.definition.json"))
  )
  .then((dokiThemeEclipseDefinitionPaths) => {
    return {
      dokiThemeEclipseDefinitions: dokiThemeEclipseDefinitionPaths
        .map((dokiThemeEclipseDefinitionPath) =>
          readJson<EclipseDokiThemeDefinition>(dokiThemeEclipseDefinitionPath)
        )
        .reduce(
          (accum: StringDictonary<EclipseDokiThemeDefinition>, def) => {
            accum[def.id] = def;
            return accum;
          },
          {}
        ),
    };
  }).then(({dokiThemeEclipseDefinitions}) =>
  walkDir(path.resolve(masterThemeDefinitionDirectoryPath, 'templates'))
    .then(readTemplates)
    .then(dokiTemplateDefinitions => {
      return walkDir(path.resolve(masterThemeDefinitionDirectoryPath, 'definitions'))
        .then(files => files.filter(file => file.endsWith('master.definition.json')))
        .then(dokiFileDefinitionPaths => {
          return {
            dokiThemeEclipseDefinitions,
            dokiTemplateDefinitions,
            dokiFileDefinitionPaths
          };
        });
    }))
  .then(templatesAndDefinitions => {
    const {
      dokiTemplateDefinitions,
      dokiThemeEclipseDefinitions,
      dokiFileDefinitionPaths
    } = templatesAndDefinitions;

    return dokiFileDefinitionPaths
      .map(dokiFileDefinitionPath => {
        const dokiThemeDefinition = readJson<MasterDokiThemeDefinition>(dokiFileDefinitionPath);
        const dokiThemeEclipseDefinition =
          dokiThemeEclipseDefinitions[dokiThemeDefinition.id];
        if (!dokiThemeEclipseDefinition) {
          throw new Error(
            `${dokiThemeDefinition.displayName}'s theme does not have a Eclipse Definition!!`
          );
        }
        return ({
          dokiFileDefinitionPath,
          dokiThemeDefinition,
          dokiThemeEclipseDefinition,
        });
      })
      .filter(pathAndDefinition =>
        (pathAndDefinition.dokiThemeDefinition.product === 'ultimate' &&
          process.env.PRODUCT === 'ultimate') ||
        pathAndDefinition.dokiThemeDefinition.product !== 'ultimate'
      )
      .map(({
              dokiFileDefinitionPath,
              dokiThemeDefinition,
              dokiThemeEclipseDefinition,
            }) =>
        createDokiTheme(
          dokiFileDefinitionPath,
          dokiThemeDefinition,
          dokiTemplateDefinitions,
          dokiThemeEclipseDefinition,
        )
      );
  })
  .then(dokiThemes => {
    const devStyleSyntaxXml = fs.readFileSync(
      path.resolve(eclipseTemplateDefinitionDirectoryPath, 'syntax.xml'), {encoding: 'utf-8'}
    );
    const themeIdsToDumbEclipseIds = dokiThemes.map(dokiTheme => dokiTheme.definition.id)
      .sort((a,b) => a.localeCompare(b))
      .reduce((accum, themeId, index)=> ({
        ...accum,
        [themeId] : index
      }) , {} as StringDictonary<number>);

    fs.rmdirSync(devstyleAssetsDirectory, {recursive: true})
    dokiThemes.forEach(dokiTheme => {
      writeSyntaxFile(
        `${dokiTheme.definition.name}.xml`,
        devStyleSyntaxXml,
        dokiTheme,
        (themeIdsToDumbEclipseIds[dokiTheme.definition.id] || 0) + 6969
      )
    });
    // const pluginXmlPath = path.resolve(repoDirectory, 'plugin.xml');
    // return toXml(fs.readFileSync(pluginXmlPath, {
    //   encoding: 'utf8'
    // }))
      // .then(pluginXml => {
      //   const cssXMLExtension = pluginXml.plugin.extension.find(
      //     (extension: any) => extension.$.point === 'org.eclipse.e4.ui.css.swt.theme'
      //   );
      //
      //   const createLafCssFileName = (dokiTheme: DokiTheme) => `${dokiTheme.definition.name}.css`;
      //   const createSyntaxCssFileName = (dokiTheme: DokiTheme) => `${dokiTheme.definition.name}.syntax.css`;
      //
      //   cssXMLExtension.theme =
      //     dokiThemes.map(dokiTheme => ({
      //       '$': {
      //         'basestylesheeturi': `themes/css/${createLafCssFileName(dokiTheme)}`,
      //         'id': buildThemeId(dokiTheme),
      //         'label': getDisplayName(dokiTheme),
      //       }
      //     }));
      //
      //   cssXMLExtension.stylesheet =
      //     dokiThemes.map(dokiTheme => ({
      //       '$': {
      //         'uri': `themes/css/${createSyntaxCssFileName(dokiTheme)}`,
      //       },
      //       themeId: {
      //         '$': {
      //           refid: buildThemeId(dokiTheme)
      //         },
      //       }
      //     }));
      //   const xml = xmlBuilder.buildObject(pluginXml);
      //
      //   fs.writeFileSync(path.resolve(pluginXmlPath), xml, 'utf8');
      //
      //   const lafCSSTemplate = fs.readFileSync(
      //     path.resolve(eclipseTemplateDefinitionDirectoryPath, 'theme.template.css'),
      //     {
      //       encoding: 'utf-8',
      //     });
      //
      //   const syntaxCSSTemplate = fs.readFileSync(
      //     path.resolve(eclipseTemplateDefinitionDirectoryPath,
      //       'syntax.coloring.template.css'),
      //     {
      //       encoding: 'utf-8',
      //     });
      //
      //   dokiThemes.forEach(dokiTheme => {
      //     writeCssFile(createLafCssFileName(dokiTheme), lafCSSTemplate, dokiTheme);
      //     writeCssFile(createSyntaxCssFileName(dokiTheme), syntaxCSSTemplate, dokiTheme);
      //   });
      // })
      // .then(() => {
        fs.writeFileSync(path.resolve(themesDirectory, 'themes.json'),
          JSON.stringify(dokiThemes.reduce((accum, dokiTheme) => ({
            ...accum,
            [dokiTheme.definition.id]: {
              id: dokiTheme.definition.id,
              displayName: getDisplayName(dokiTheme),
              stickers: dokiTheme.stickers,
              isDark: dokiTheme.definition.dark,
            }
          }), {}), null, 2), {
            encoding: 'utf-8',
          })
      // });
  })
  .then(() => {
    console.log('Theme Generation Complete!');
  });
