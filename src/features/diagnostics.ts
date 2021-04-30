import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver"
import { TextDocument } from "vscode-languageserver-textdocument"
import * as jsonc from 'jsonc-parser';
import { getKeys } from "../helpers";

export function getSyntaxErrors(textDocument: TextDocument) : Diagnostic[] {
  let diagnostics: Diagnostic[] = []
  let text = textDocument.getText()

  jsonc.visit(text, {
    onError(error, offset, length) {
      const parseError = jsonc.printParseErrorCode(error)

      diagnostics.push({
        message: parseError,
        range: {
          start: textDocument.positionAt(offset),
          end: textDocument.positionAt(offset + length)
        },
        severity: DiagnosticSeverity.Error
      })
    }
  }, {
    allowEmptyContent: true,
    allowTrailingComma: true
  })

  return diagnostics
}

export function getWarnings(ast: jsonc.Node | undefined, textDocument: TextDocument): Diagnostic[] {
  let diagnostics: Diagnostic[] = []
  if (!ast) return []

  diagnostics = diagnostics.concat(checkProperties(ast, textDocument))

  return diagnostics
}

function checkProperties(node: jsonc.Node, textDocument: TextDocument) : Diagnostic[] {
  let diagnostics: Diagnostic[] = []

  // recusivly check properties of each object
  node.children?.forEach(node => {
    diagnostics = diagnostics.concat(checkProperties(node, textDocument))
  })

  if (node.type !== 'object') return diagnostics
  // we are sure we are in an 'object' now  

  let keys = getKeys(node)
  for (let propertyNode of node.children) {
    let keyNode = propertyNode.children[0]

    // find duplicate keys
    if (keys.filter(key => key === keyNode.value).length > 1) {
      diagnostics.push({
        message: `Duplicate key "${keyNode.value}"`,
        range: {
          start: textDocument.positionAt(keyNode.offset),
          end: textDocument.positionAt(keyNode.offset + keyNode.length)
        },
        severity: DiagnosticSeverity.Warning
      })
    }
  }

  return diagnostics
}
