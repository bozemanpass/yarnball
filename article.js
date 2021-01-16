/* START COPY NOTICE
 * MIT License
 * Copyright (c) 2021 Bozeman Pass, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * END COPY NOTICE */

const { resolvePackageVersion, deepResolvePackageVersions, versionCompare } = window.pkgResolve;

// See: https://stackoverflow.com/questions/1197575/can-scripts-be-inserted-with-innerhtml
function nodeScriptIs(node) {
  return node.tagName === 'SCRIPT';
}

function nodeScriptClone(node) {
  let script = document.createElement("script");
  script.text = node.innerHTML;

  let i = -1, attrs = node.attributes, attr;
  while (++i < attrs.length) {
    script.setAttribute((attr = attrs[i]).name, attr.value);
  }
  return script;
}

function nodeScriptReplace(node) {
  if (nodeScriptIs(node) === true) {
    node.parentNode.replaceChild(nodeScriptClone(node), node);
  } else {
    let i = -1, children = node.childNodes;
    while (++i < children.length) {
      nodeScriptReplace(children[i]);
    }
  }
  return node;
}

const fixCliParams = (name, version) => {
  if (!version && name.slice(1).indexOf('@') > 0) {
    const namespaced = name.startsWith('@');
    // TEL 20200114: Had to remove the regex split(/(?<!^)@/, 2) because it was incompatible with Safari.
    [name, version] = name.slice(namespaced ? 1 : 0).split('@', 2);
    if (namespaced) {
      name = `@${name}`;
    }
  }
  return { name, version };
};

const cliCommands = {
  'yarnball': async (n, v) => {
    const { name, version } = fixCliParams(n, v);
    const result = await resolvePackageVersion(name, version);
    return {
      name: result.name,
      requested: result.version,
      resolved: result.match ? result.match.version : null,
      'semver-satisfies': result.satisfies.map((s) => s.version),
      tags: result.tags,
      tarball: result.match ? result.match.dist.tarball : undefined,
      unpackedSize: result.match ? result.match.dist.unpackedSize || 0 : 0
    };
  },
  'yarnball-deep': async (n, v) => {
    const { name, version } = fixCliParams(n, v);
    const match = await deepResolvePackageVersions(name, version);
    return match ? match.tree : {};
  },
  'yarnball-list': async (n, v) => {
    const { name, version } = fixCliParams(n, v);
    const match = await deepResolvePackageVersions(name, version);
    return match ? match.flat : {};
  },
  'yarnball-multiples': async (n, v) => {
    const { name, version } = fixCliParams(n, v);
    const match = await deepResolvePackageVersions(name, version);
    return match ? Object.values(match.flat).filter(v => Object.keys(v).length > 1) : {};
  }
}

const createConsole = (example,
                       lastCmd = '',
                       prompt = 'Usage: yarnball[-deep|-list|-multiples] name [version]\n> ',
                       autorun = false) => {
  const consoleState = {
    lastCmd,
    prompt,
    dirty: false
  };

  const el = document.getElementById(`example-${example}`);
  el.innerHTML = `<div class="console"><textarea id="console-${example}"></textarea></div>`;
  const consoleEl = document.getElementById(`console-${example}`);
  consoleEl.value = `${consoleState.prompt}${consoleState.lastCmd}`;

  const handler = async (event) => {
    const curValue = consoleEl.value.replace(consoleState.prompt, '');
    if (event.key === 'Enter') {
      if (consoleState.dirty) {
        consoleEl.value = consoleState.prompt;
        consoleState.dirty = false;
      } else {
        consoleState.lastCmd = curValue;
        consoleState.dirty = true;
        const [cmd, name, version] = curValue.replace(/yarn (add|why|install)/, 'yarnball').split(/\s+/);
        consoleEl.value += '\n';
        if (cmd && name && cliCommands[cmd]) {
          const result = await cliCommands[cmd](name, version);
          consoleEl.value = `${consoleState.prompt}${consoleState.lastCmd}\n${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}\n> `;
        } else {
          consoleEl.value = consoleState.prompt;
        }
      }
    } else if (event.key === 'ArrowUp') {
      consoleEl.value = `${consoleState.prompt}${consoleState.lastCmd}`;
      consoleState.dirty = false;
    } else if (consoleState.dirty) {
      consoleEl.value = consoleState.prompt;
      consoleState.dirty = false;
    }

    if (consoleState.dirty || event.key === 'ArrowUp') {
      event.preventDefault();
    }

    consoleEl.scrollTop = consoleEl.scrollHeight;
  };
  consoleEl.addEventListener('keydown', handler);

  if (autorun) {
    handler({
      key: 'Enter', preventDefault: () => {
      }
    }).then(() => {
    });
  }
};

const createWidget = (example, name, version, showTags = true) => {
  const el = document.getElementById(`example-${example}`);
  el.innerHTML = `
<div class="widget" xmlns="http://www.w3.org/1999/html">
  <table class="query">
    <tr>
      <td width="60%"><label>Package Name</label><input id="name${example}" type="text" value="${name}" /></td>
      <td width="20%"><label>Range</label><input id="version${example}" type="text" value="${version}" /></td>
      <td width="20%"><button id="submit${example}">Try It</button></td>
    </tr>
  </table>
  <div id="results${example}" class="results" />
</div>`;

  const submit = document.getElementById(`submit${example}`);
  submit.addEventListener('click', async () => {
    const resultsEl = document.getElementById(`results${example}`);
    resultsEl.innerHTML = '';
    const name = document.getElementById(`name${example}`).value || undefined;
    const requestedVersion = document.getElementById(`version${example}`).value || undefined;
    const result = await resolvePackageVersion(name, requestedVersion);
    const sortedKeys = Object.keys(result.versions).sort(versionCompare);
    for (const version of sortedKeys) {
      const span = document.createElement("span");
      let className = 'nomatch';
      if (version === result.match?.version) {
        className = 'match'
      } else if (result.satisfies.find(s => s.version === version)) {
        className = 'satisfies';
      }
      span.className = className;
      span.innerText = version;
      if (showTags) {
        for (const [tag, tagVer] of Object.entries(result.tags)) {
          if (version === tagVer) {
            span.innerText += `@${tag}`;
          }
        }
      }
      resultsEl.appendChild(span);
    }
  });
};

const addExamples = () => {
  createWidget('IDV-A', '@bozemanpass/hairball', '^0.1.0', false);
  createWidget('PR-A', '@bozemanpass/hairball', '^1.3.9-alpha.1', false);
  createWidget('tag-A', '@bozemanpass/example', '^1.0.0');
  createWidget('tag-B', '@bozemanpass/example', '^1.0.1');
  createWidget('tag-C', '@bozemanpass/example', 'alpha');
  createWidget('tag-D', '@bozemanpass/example-after', '^1.0.1');
  createConsole('con-A', 'yarnball log4js ^6.0.0');
}
