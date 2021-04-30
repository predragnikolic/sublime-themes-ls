import * as jsonc from 'jsonc-parser';
import { getKeys } from '../helpers';
import { CompletionItem, CompletionItemKind, InsertTextFormat, Position } from 'vscode-languageserver/node';

type NodeTypes = 
  | 'EMPTY_FILE'
  | 'ROOT_NODE'
  | 'RULES'
  | 'RULE'
  | 'CLASS_NAMES'
  | 'ATTRIBUTES'
  | 'PARENTS'
  | 'PLATFORMS'
  | 'SETTINGS'
  | 'SPACING'
  | 'COLOR'
  | 'DATA_TABLE_PROPERTIES'
  | 'SHADOW_PROPERTIES'
  | 'FONT_PROPERTIES'
  | 'FILTER_LABEL_PROPERTIES'
  | 'STYLED_LABEL_PROPERTIES'
  | 'TEXTURE_TINTING_PROPERTIES'
  | 'unhandled'

function getNodeType(ast: jsonc.Node | undefined, offset: number) : {type: NodeTypes, node?: jsonc.Node} {
  if (!ast) return {type: 'EMPTY_FILE'}
  const node = jsonc.findNodeAtOffset(ast, offset)
  if (!node.parent) return {type: 'ROOT_NODE', node}

  const suggestRulesObject = node.type === 'array' && node.parent.type === 'property'
  if (suggestRulesObject) return {type: 'RULES', node}

  const suggestRuleObject = (node.type === 'object' && node.parent.type === 'array') ||
                            (node.parent.parent.type === 'object' && node.parent.parent.parent.type === 'array')
  if (suggestRuleObject) return {type: 'RULE', node}


  return {type: 'unhandled'}
} 

function getEmptyFileCompletions(): CompletionItem[] {
  return [
    {
      label: '[]',
      insertText: '[$0]',
      kind: CompletionItemKind.Snippet,
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: '{}',
      insertText: '{$0}',
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Snippet,
    }
  ]
}

function getRootNodeCompletions(node: jsonc.Node): CompletionItem[] {
  if (node.type === 'array') {
    return [{
        label: '{}',
        insertText: '{$0}',
        insertTextFormat: InsertTextFormat.Snippet,
        kind: CompletionItemKind.Snippet,
    }]
  } else if(node.type === 'object') {
    const  keys = getKeys(node)
    return [
      {
          label: 'varables',
          insertText: '"variables": {$0}',
          insertTextFormat: InsertTextFormat.Snippet,
          kind: CompletionItemKind.Snippet,
      },
      {
          label: 'rules',
          insertText: '"rules": [$0]',
          insertTextFormat: InsertTextFormat.Snippet,
          kind: CompletionItemKind.Snippet,
      }
    ].filter(ci => !keys.includes(ci.label))
  }
}

function getRulesCompletions(): CompletionItem[] {
  return [
    {
      label: '{}',
      insertText: '{$0}',
      insertTextFormat: InsertTextFormat.Snippet,
      kind: CompletionItemKind.Snippet,
    }
  ]
}

function getRuleCompletions(): CompletionItem[] {
  return [
    {
      label: 'class',
      insertText: "\"class\"",
      kind: CompletionItemKind.Property,
    }
  ]
}



export function getCompletions(ast: jsonc.Node | undefined, offset: number): CompletionItem[] {
  const nodeType = getNodeType(ast, offset)
  switch(nodeType.type) {
  case 'EMPTY_FILE':
    return getEmptyFileCompletions()
  case 'ROOT_NODE':
    return getRootNodeCompletions(nodeType.node)
  case 'RULES':
    return getRulesCompletions()
  case 'RULE':
    return getRuleCompletions()
  }
}