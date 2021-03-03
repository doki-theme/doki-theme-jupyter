// @ts-ignore
import {Overrides} from "../../masterThemes/buildSrc/TypesTemplate";

export interface DokiThemeDefinitions {
  [key: string]: any;
}

export interface MasterDokiThemeDefinition {
  id: string;
  name: string;
  displayName: string;
  dark: boolean;
  author: string;
  group: string;
  overrides?: Overrides;
  product?: 'community' | 'ultimate';
  stickers: Stickers;
  colors: StringDictonary<string>;
  editorScheme?: EditorScheme;
}

export interface EditorScheme {
  colors: StringDictonary<string>
}

export interface StringDictonary<T> {
  [key: string]: T;
}

export interface Stickers {
  default: string;
  secondary?: string;
  normal?: string;
}

export interface EclipseDokiThemeDefinition {
  id: string;
  overrides: {
    editorScheme?: {
      [key: string]: StringDictonary<string>
    }
    theme?: {
      [key: string]: StringDictonary<string>
    }
  };
  laf: {
    extends: string;
    ui: StringDictonary<string>;
  };
  syntax: {};
  colors: {};
}
