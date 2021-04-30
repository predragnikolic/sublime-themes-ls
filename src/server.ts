import * as jsonc from 'jsonc-parser';
import {
  createConnection,
  TextDocuments,
  Diagnostic,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  InsertTextFormat
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getSyntaxErrors, getWarnings } from './features/diagnostics';
import { getCompletions } from './features/completions';


let connection = createConnection();
let ast: jsonc.Node | undefined = undefined 

// Create a simple text document manager.
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {}
    }
  };

  return result;
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  ast = jsonc.parseTree(change.document.getText())
  connection.console.log(String(ast))
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  let diagnostics: Diagnostic[] = [];
  diagnostics = diagnostics
    .concat(getSyntaxErrors(textDocument))
    .concat(getWarnings(ast, textDocument))

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const textDocument = documents.get(textDocumentPosition.textDocument.uri)
    const offset = textDocument.offsetAt(textDocumentPosition.position)
    return getCompletions(ast, offset)
  }
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

