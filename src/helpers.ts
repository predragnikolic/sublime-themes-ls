import * as jsonc from 'jsonc-parser';


export function getKeys(node: jsonc.Node): string[] {
  if (node.type !== 'object') return [] 

  return node.children.map(propertyNode => propertyNode.children[0].value)
}