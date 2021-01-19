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

const addExamples = () => {
  createWidget('example-IDV-A', '@bozemanpass/hairball', '^0.1.0', { showTags: false });
  createWidget('example-PR-A', '@bozemanpass/hairball', '^1.3.9-alpha.1', { showTags: false });
  createWidget('example-tag-A', '@bozemanpass/example', '^1.0.0');
  createWidget('example-tag-B', '@bozemanpass/example', '^1.0.1');
  createWidget('example-tag-C', '@bozemanpass/example', 'alpha');
  createWidget('example-tag-D', '@bozemanpass/example-after', '^1.0.1');
  createConsole('example-con-A', 'yarnball log4js ^6.0.0');
}
