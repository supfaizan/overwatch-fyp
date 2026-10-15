import fs from 'node:fs';
import path from 'node:path';
import type * as TS from 'typescript';

// Reads docs straight from the source: JSDoc + resolved prop types from shared/components,
// example sources from ./examples, color tokens from globals.css. Runs at build time only.

export type PropDoc = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
};
export type ComponentDoc = {
  name: string;
  description: string;
  practices: string[];
  props: PropDoc[];
};
export type ExampleDoc = { name: string; title: string; source: string };
export type FileDoc = {
  file: string;
  importLine: string;
  components: ComponentDoc[];
  examples: ExampleDoc[];
};

const root = process.cwd();
const componentsDir = path.join(root, 'shared/components');
const examplesDir = path.join(root, 'features/ui-docs/examples');

// `LoadingState` -> `Loading state`
const humanize = (name: string) => {
  return name.replace(/(?<=[a-z])(?=[A-Z])/g, ' ').replace(/ \w/g, (c) => {
    return c.toLowerCase();
  });
};

const exportedFunctions = (sf: TS.SourceFile, ts: typeof TS) => {
  return sf.statements.filter(
    (node): node is TS.FunctionDeclaration => {
      return ts.isFunctionDeclaration(node) && !!node.name
        && !!ts.getModifiers(node)?.some((m) => {
          return m.kind === ts.SyntaxKind.ExportKeyword;
        });
    },
  );
};

export async function getUiDocs() {
  // loaded lazily so prod runtime never needs the (dev) typescript package
  const ts = await import('typescript');

  const files = fs.readdirSync(componentsDir).filter((f) => {
    return f.endsWith('.tsx');
  }).sort();
  const paths = files.flatMap((f) => {
    return [path.join(componentsDir, f), path.join(examplesDir, f)];
  })
    .filter((p) => {
      return fs.existsSync(p);
    });
  const config = ts.getParsedCommandLineOfConfigFile(path.join(root, 'tsconfig.json'), {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {},
  });
  const program = ts.createProgram(paths, config?.options ?? {});
  const checker = program.getTypeChecker();
  const jsdoc = (symbol: TS.Symbol) => {
    return ts.displayPartsToString(symbol.getDocumentationComment(checker));
  };

  const documentComponent = (node: TS.FunctionDeclaration, sf: TS.SourceFile): ComponentDoc => {
    const lines = jsdoc(checker.getSymbolAtLocation(node.name!)!).split('\n');
    const param = node.parameters[0];
    // only props declared in this file; the hundreds of native/Radix props are mentioned in the JSDoc instead
    const props = param
      ? checker
        .getTypeAtLocation(param)
        .getProperties()
        .filter((p) => {
          return p.declarations?.some((d) => {
            return d.getSourceFile() === sf;
          });
        })
        .map((p) => {
          return {
            name: p.name,
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(p, param)).replace(
              / \| (null|undefined)/g,
              '',
            ),
            required: !(p.flags & ts.SymbolFlags.Optional),
            defaultValue: p.getJsDocTags(checker).find((t) => {
              return t.name === 'default';
            })?.text?.map((t) => {
              return t.text;
            }).join(''),
            description: jsdoc(p),
          };
        })
      : [];
    return {
      name: node.name!.text,
      description: lines.filter((l) => {
        return !l.startsWith('- ');
      }).join(' ').trim(),
      practices: lines.filter((l) => {
        return l.startsWith('- ');
      }).map((l) => {
        return l.slice(2);
      }),
      props,
    };
  };

  return files.map((file): FileDoc => {
    const sf = program.getSourceFile(path.join(componentsDir, file))!;
    const fns = exportedFunctions(sf, ts);
    const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sf)!).map((s) => {
      return s.name;
    });
    const defaultName = fns.find((fn) => {
      return ts.getModifiers(fn)?.some((m) => {
        return m.kind === ts.SyntaxKind.DefaultKeyword;
      });
    })?.name?.text;
    const named = exports.filter((n) => {
      return n !== 'default';
    });
    const exampleSf = program.getSourceFile(path.join(examplesDir, file));

    return {
      file: file.replace('.tsx', ''),
      importLine: `import ${
        [defaultName, named.length && `{ ${named.join(', ')} }`].filter(Boolean).join(', ')
      } from '@/shared/components/${file.replace('.tsx', '')}';`,
      components: fns.map((fn) => {
        return documentComponent(fn, sf);
      }),
      examples: exampleSf
        ? exportedFunctions(exampleSf, ts).map((fn) => {
          return {
            name: fn.name!.text,
            title: humanize(fn.name!.text),
            source: fn.getText(exampleSf),
          };
        })
        : [],
    };
  });
}

// every --color-* token in globals.css, in declaration order
export function getColorTokens() {
  const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
  return [
    ...new Set([...css.matchAll(/--color-([\w-]+):/g)].map((m) => {
      return m[1];
    })),
  ];
}
