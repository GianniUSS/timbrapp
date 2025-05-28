/*
Script Node.js per generare la struttura del progetto (cartelle, file) e estrarre simboli:
- funzioni (declaration e arrow)
- classi
- metodi di classe
- rotte Express (app.get, router.post, ecc.)

Dipendenze (installare con npm o yarn):
  npm install @babel/parser @babel/traverse glob
*/

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function extractSymbols(content) {
  const symbols = [];
  let ast;
  try {
    ast = parser.parse(content, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript', 'classProperties']
    });
  } catch (err) {
    return symbols;
  }

  traverse(ast, {
    FunctionDeclaration(p) {
      if (p.node.id) symbols.push({ kind: 'function', name: p.node.id.name });
    },
    VariableDeclarator(p) {
      const init = p.node.init;
      if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
        symbols.push({ kind: 'function', name: p.node.id.name });
      }
    },
    ClassDeclaration(p) {
      if (p.node.id) symbols.push({ kind: 'class', name: p.node.id.name });
    },
    ClassMethod(p) {
      const cls = p.parentPath.node.id ? p.parentPath.node.id.name : '';
      const m = p.node.key.name;
      symbols.push({ kind: 'method', name: cls ? `${cls}.${m}` : m });
    },
    CallExpression(p) {
      const c = p.node.callee;
      if (c.type === 'MemberExpression' && c.property && c.property.name) {
        const obj = c.object.name;
        const prop = c.property.name;
        if (['get','post','put','delete','patch'].includes(prop) && (obj === 'app' || obj === 'router')) {
          const route = p.node.arguments[0] && p.node.arguments[0].value;
          symbols.push({ kind: 'route', name: `${prop.toUpperCase()} ${route}` });
        }
      }
    }
  });
  return symbols;
}

function buildTree(dir) {
  const name = path.basename(dir);
  const node = { name, type: 'directory', children: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'build') return;
      node.children.push(buildTree(p));
    } else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) {
      const content = fs.readFileSync(p, 'utf8');
      const syms = extractSymbols(content);
      node.children.push({ name: e.name, type: 'file', symbols: syms });
    }
  });

  return node;
}

// MAIN
const root = process.argv[2] || '.';
const outFile = process.argv[3] || 'project-structure.json';
const tree = buildTree(path.resolve(root));
fs.writeFileSync(outFile, JSON.stringify(tree, null, 2), 'utf8');
console.log(`Struttura generata in ${outFile}`);
