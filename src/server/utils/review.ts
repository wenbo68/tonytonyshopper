import type { CommentTree } from "~/type";

/**
 * Recursively traverses the tree to find a node by ID and apply an update.
 */
export const updateNodeInTree = (
  nodes: CommentTree[],
  targetId: string,
  updater: (node: CommentTree) => CommentTree,
): CommentTree[] => {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return updater(node);
    }
    if (node.replies?.length) {
      return {
        ...node,
        replies: updateNodeInTree(node.replies, targetId, updater),
      };
    }
    return node;
  });
};

/**
 * Recursively traverses the tree to find a node by ID and remove it.
 */
export const deleteNodeFromTree = (
  nodes: CommentTree[],
  targetId: string,
): CommentTree[] => {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      replies: node.replies ? deleteNodeFromTree(node.replies, targetId) : [],
    }));
};

/**
 * Recursively finds a parent node and appends a new reply to it.
 */
export const addReplyToNode = (
  nodes: CommentTree[],
  parentId: string,
  newReply: CommentTree,
): CommentTree[] => {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        replies: [...(node.replies || []), newReply],
      };
    }
    if (node.replies?.length) {
      return {
        ...node,
        replies: addReplyToNode(node.replies, parentId, newReply),
      };
    }
    return node;
  });
};
