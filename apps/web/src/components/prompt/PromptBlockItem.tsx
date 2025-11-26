import type { PromptBlock } from '@promptozaurus/shared';

interface PromptBlockItemProps {
  block: PromptBlock;
  isActive: boolean;
}

const PromptBlockItem = ({ block }: PromptBlockItemProps) => {
  return (
    <div className="h-full">
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-4">{block.title}</h2>
        <p className="text-sm text-gray-400">Prompt block item - to be implemented</p>
        <p className="text-xs text-gray-500 mt-2">Selected contexts: {block.selectedContexts?.length || 0}</p>
      </div>
    </div>
  );
};

export default PromptBlockItem;

