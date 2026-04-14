import { ArrowRight } from 'lucide-react';

type SubMenuItem = {
  id: string;
  label: string;
  icon: any;
  url?: string;
  notionBadge?: 'arrow' | 'plain';
};

type Category = {
  title: string;
  ids: string[];
};

const COLUMNS: Category[][] = [
  [
    { title: '句読法　リーディング', ids: ['slash-reading'] },
    { title: '素句読法　リーディング', ids: ['ex-reading'] },
  ],
  [
    { title: '句読法　ライティング', ids: ['word-order-quiz', 'japanese-english-process'] },
    { title: 'ボキャブラリー', ids: ['baseball-vocabulary', 'vocabulary'] },
  ],
  [
    { title: '空耳法　リスニング', ids: ['listening-practice', 'audio-memory', 'sound-change-chunk', 'sound-change-dictation', 'chunk'] },
  ],
];

function NotionBadge({ type }: { type: 'arrow' | 'plain' }) {
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs leading-none">N</span>
      </div>
      {type === 'arrow' && (
        <ArrowRight size={14} className="text-gray-700" />
      )}
    </div>
  );
}

function ChallengeItem({ item, onClick }: { item: SubMenuItem; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-teal-400 hover:shadow-sm transition-all group text-left"
    >
      <div className="p-1.5 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors flex-shrink-0">
        <Icon size={16} className="text-teal-600" />
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
      {item.notionBadge && <NotionBadge type={item.notionBadge} />}
    </button>
  );
}

function CategoryBlock({ title, items, onItemClick }: {
  title: string;
  items: SubMenuItem[];
  onItemClick: (id: string, url?: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="inline-block border border-gray-400 rounded px-3 py-1 mb-3">
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ChallengeItem
            key={item.id}
            item={item}
            onClick={() => onItemClick(item.id, item.url)}
          />
        ))}
      </div>
    </div>
  );
}

type Props = {
  subItems: SubMenuItem[];
  onItemClick: (id: string, url?: string) => void;
};

export default function ChallengeMenu({ subItems, onItemClick }: Props) {
  const itemMap = Object.fromEntries(subItems.map((item) => [item.id, item]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((column, colIndex) => (
        <div key={colIndex}>
          {column.map((category) => {
            const items = category.ids
              .map((id) => itemMap[id])
              .filter(Boolean);
            return (
              <CategoryBlock
                key={category.title}
                title={category.title}
                items={items}
                onItemClick={onItemClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
