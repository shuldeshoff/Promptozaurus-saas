import type { ContextBlock } from '@promptozaurus/shared';

interface ContextBlockItemProps {
  block: ContextBlock;
  isActive: boolean;
}

const ContextBlockItem = ({ block }: ContextBlockItemProps) => {
  return (
    <div className="h-full">
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-4">{block.title}</h2>
        <p className="text-sm text-gray-400">Context block item - to be implemented</p>
        <p className="text-xs text-gray-500 mt-2">Items: {block.items?.length || 0}</p>
      </div>
    </div>
  );
};

export default ContextBlockItem;

