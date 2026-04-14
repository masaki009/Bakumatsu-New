import { ElementBalance } from './fourPillars';

interface LearningAdviceItem {
  title: string;
  description: string;
}

interface LuckyActivity {
  rating: number;
  comment: string;
}

interface LuckyActivities {
  reading: LuckyActivity;
  writing: LuckyActivity;
  listening: LuckyActivity;
  speaking: LuckyActivity;
  vocabulary: LuckyActivity;
  grammar: LuckyActivity;
  conversation: LuckyActivity;
}

interface AdviceResult {
  todayEnergy: string;
  learningAdvice: LearningAdviceItem[];
  cautions: string;
  luckyActivities: LuckyActivities;
}

const motivationalMessages = [
  '今日も素敵な一日になりますように',
  '一歩ずつ、着実に成長していきましょう',
  'あなたならきっと大丈夫です',
  '今日の学習があなたの未来を輝かせます',
  '楽しみながら学んでいきましょう',
  '毎日の積み重ねが大きな力になります',
  '自分のペースで、焦らず進んでいきましょう',
  'あなたの努力は必ず実を結びます',
];

function getRandomMotivationalMessage(): string {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
}

function getDominantElements(balance: ElementBalance): string[] {
  const elements = [
    { name: '木', value: balance.木 },
    { name: '火', value: balance.火 },
    { name: '土', value: balance.土 },
    { name: '金', value: balance.金 },
    { name: '水', value: balance.水 },
  ];

  const sorted = elements.sort((a, b) => b.value - a.value);
  return sorted.slice(0, 2).map(e => e.name);
}

function getWeakElements(balance: ElementBalance): string[] {
  const elements = [
    { name: '木', value: balance.木 },
    { name: '火', value: balance.火 },
    { name: '土', value: balance.土 },
    { name: '金', value: balance.金 },
    { name: '水', value: balance.水 },
  ];

  const sorted = elements.sort((a, b) => a.value - b.value);
  return sorted.slice(0, 2).map(e => e.name);
}

function getTodayEnergyDescription(todayPillar: string, dominantElements: string[], name?: string): string {
  const userName = name ? `${name}さん` : 'あなた';
  const messages = [
    `${userName}、今日の干支は「${todayPillar}」ですね。${dominantElements.join('と')}の気が強いあなたにとって、今日は特に良い流れが期待できる日です。自分の得意分野を活かしながら、新しいチャレンジにも積極的に取り組んでみてください。${getRandomMotivationalMessage()}！`,
    `今日の日柱「${todayPillar}」は、${dominantElements[0]}の気と調和しています。${userName}の持つ${dominantElements.join('・')}のエネルギーが、今日の学習をサポートしてくれるでしょう。リラックスして、楽しみながら進めていきましょう。${getRandomMotivationalMessage()}！`,
    `${userName}、「${todayPillar}」の今日は、あなたの${dominantElements.join('と')}の特性が輝く日です。自分らしさを大切にしながら、英語学習に取り組んでください。焦らず、一つ一つ丁寧に。${getRandomMotivationalMessage()}！`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

function generateLearningAdvice(balance: ElementBalance, dominantElements: string[], weakElements: string[]): LearningAdviceItem[] {
  const advice: LearningAdviceItem[] = [];

  if (dominantElements.includes('木')) {
    advice.push({
      title: '午前中：インプット重視の学習',
      description: '木の気が強いため、新しい知識を吸収する力が高まっています。リーディングや単語学習、文法の理解など、インプット系の学習に最適な時間帯です。集中して取り組みましょう。',
    });
  } else if (dominantElements.includes('火')) {
    advice.push({
      title: '午前中：表現力を磨く学習',
      description: '火の気が活発なため、自己表現の力が高まっています。スピーキング練習やライティング、会話の練習など、アウトプット系の学習が効果的です。積極的に英語を使ってみましょう。',
    });
  } else if (dominantElements.includes('金')) {
    advice.push({
      title: '午前中：精密な学習',
      description: '金の気が強いため、細部に注意を払う力が高まっています。文法の細かいルールや単語のニュアンスの違いなど、精密な学習に向いています。丁寧に取り組みましょう。',
    });
  } else {
    advice.push({
      title: '午前中：基礎固めの学習',
      description: '今日は基礎をしっかり固める学習が効果的です。復習や基本的な文法・単語の確認など、土台を固める時間にしましょう。',
    });
  }

  if (dominantElements.includes('水')) {
    advice.push({
      title: '午後：理解を深める実践',
      description: '水の気が強いため、思考力と吸収力が高まっています。リスニング練習やリーディングの内容理解など、深く考えながら学ぶ活動が効果的です。',
    });
  } else if (dominantElements.includes('土')) {
    advice.push({
      title: '午後：定着を図る練習',
      description: '土の気が強いため、学んだことを定着させる力が高まっています。反復練習や会話の実践など、知識を確実に身につける活動に取り組みましょう。',
    });
  } else {
    advice.push({
      title: '午後：バランス良く実践',
      description: '午後は様々な学習をバランスよく取り入れましょう。リスニングとスピーキング、リーディングとライティングなど、複合的な練習が効果的です。',
    });
  }

  if (weakElements.includes('火')) {
    advice.push({
      title: '夕方以降：表現力を補う練習',
      description: '火の気が弱めなので、意識的に表現する練習を取り入れましょう。声に出して音読したり、短い文章を書いてみたり、自己表現の機会を作ることが大切です。',
    });
  } else if (weakElements.includes('水')) {
    advice.push({
      title: '夕方以降：理解を補う復習',
      description: '水の気が弱めなので、じっくり考える時間を確保しましょう。今日学んだことを振り返り、理解を深める復習の時間にすると良いでしょう。',
    });
  } else {
    advice.push({
      title: '夕方以降：リラックスして楽しむ',
      description: '一日の締めくくりは、楽しみながら英語に触れましょう。好きな映画やドラマを英語で観たり、音楽を聴いたり、リラックスした学習がおすすめです。',
    });
  }

  return advice;
}

function generateCautions(weakElements: string[]): string {
  const cautionMap: Record<string, string> = {
    '木': 'インプット系の学習が少し苦手に感じるかもしれません',
    '火': '自己表現やアウトプットに少し抵抗を感じるかもしれません',
    '土': '基礎の定着に時間がかかるかもしれません',
    '金': '細かい部分への集中が難しく感じるかもしれません',
    '水': '深い理解に少し時間がかかるかもしれません',
  };

  const cautions = weakElements.map(e => cautionMap[e] || '');
  return `今日は${cautions.join('、')}。でも大丈夫です。無理をせず、自分のペースで進めていきましょう。得意なことから始めて、徐々に苦手なことにも挑戦していくと良いでしょう。${getRandomMotivationalMessage()}！`;
}

function calculateActivityRating(activity: string, balance: ElementBalance): { rating: number; comment: string } {
  const ratings: Record<string, { base: number; elements: Array<{ element: keyof ElementBalance; weight: number }> }> = {
    reading: {
      base: 3,
      elements: [
        { element: '木', weight: 0.3 },
        { element: '水', weight: 0.2 },
      ],
    },
    writing: {
      base: 3,
      elements: [
        { element: '火', weight: 0.3 },
        { element: '金', weight: 0.2 },
      ],
    },
    listening: {
      base: 3,
      elements: [
        { element: '水', weight: 0.3 },
        { element: '木', weight: 0.1 },
      ],
    },
    speaking: {
      base: 3,
      elements: [
        { element: '火', weight: 0.4 },
        { element: '土', weight: 0.1 },
      ],
    },
    vocabulary: {
      base: 3,
      elements: [
        { element: '木', weight: 0.2 },
        { element: '金', weight: 0.2 },
        { element: '土', weight: 0.1 },
      ],
    },
    grammar: {
      base: 3,
      elements: [
        { element: '金', weight: 0.3 },
        { element: '水', weight: 0.2 },
      ],
    },
    conversation: {
      base: 3,
      elements: [
        { element: '火', weight: 0.3 },
        { element: '土', weight: 0.2 },
      ],
    },
  };

  const config = ratings[activity];
  let score = config.base;

  config.elements.forEach(({ element, weight }) => {
    score += balance[element] * weight;
  });

  const rating = Math.min(5, Math.max(1, Math.round(score)));

  const comments: Record<number, string[]> = {
    5: ['今日は絶好調です', '最高のタイミングです', '思い切りやりましょう', '大きな成果が期待できます'],
    4: ['とても良い日です', '効果的に学べます', 'おすすめです', '順調に進むでしょう'],
    3: ['安定した学習ができます', '無理なく取り組めます', 'いつも通りで大丈夫', 'バランスよく進めましょう'],
    2: ['ゆっくり進めましょう', '焦らず丁寧に', '少しずつでOKです', '無理のない範囲で'],
    1: ['今日は軽めに', '他の学習を優先しても', '休憩も大切です', '明日に期待しましょう'],
  };

  const commentList = comments[rating];
  const comment = commentList[Math.floor(Math.random() * commentList.length)];

  return { rating, comment };
}

export function generateFourPillarsAdvice(
  elementBalance: ElementBalance,
  todayPillar: string,
  name?: string
): AdviceResult {
  const dominantElements = getDominantElements(elementBalance);
  const weakElements = getWeakElements(elementBalance);

  return {
    todayEnergy: getTodayEnergyDescription(todayPillar, dominantElements, name),
    learningAdvice: generateLearningAdvice(elementBalance, dominantElements, weakElements),
    cautions: generateCautions(weakElements),
    luckyActivities: {
      reading: calculateActivityRating('reading', elementBalance),
      writing: calculateActivityRating('writing', elementBalance),
      listening: calculateActivityRating('listening', elementBalance),
      speaking: calculateActivityRating('speaking', elementBalance),
      vocabulary: calculateActivityRating('vocabulary', elementBalance),
      grammar: calculateActivityRating('grammar', elementBalance),
      conversation: calculateActivityRating('conversation', elementBalance),
    },
  };
}
