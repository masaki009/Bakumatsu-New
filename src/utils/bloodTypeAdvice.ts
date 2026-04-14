interface BloodTypeAdviceResult {
  weekOfMonth: number;
  weekName: string;
  advice: string;
  encouragement: string;
  learningTips: string[];
  luckyActivity: string;
}

const bloodTypeAdviceData: Record<string, Record<number, BloodTypeAdviceResult>> = {
  A: {
    1: {
      weekOfMonth: 1,
      weekName: '第1週',
      advice: '几帳面なA型のあなた、今週は計画的に学習を進めましょう。単語帳を作成し、毎日コツコツと覚えるのがおすすめです。',
      encouragement: '着実に進めるあなたの姿勢が、確実な成果につながりますよ！',
      learningTips: [
        '文法の基礎をしっかり復習する',
        '単語を分類してノートにまとめる',
        '毎日同じ時間に学習する習慣をつける'
      ],
      luckyActivity: 'ライティング練習'
    },
    2: {
      weekOfMonth: 2,
      weekName: '第2週',
      advice: '細部にこだわるA型の特性を活かして、発音やイントネーションに注目しましょう。正確さを追求することで、より美しい英語が身につきます。',
      encouragement: '完璧を目指すあなたの努力は、必ず実を結びます！',
      learningTips: [
        'リスニングで音の変化を意識する',
        'シャドーイングで発音を磨く',
        '英文を丁寧に音読する'
      ],
      luckyActivity: 'リスニング練習'
    },
    3: {
      weekOfMonth: 3,
      weekName: '第3週',
      advice: '真面目なA型のあなた、今週は文法の理解を深めましょう。ルールを体系的に学ぶことで、自信を持って英語を使えるようになります。',
      encouragement: 'あなたの努力は周りの人にも良い影響を与えています！',
      learningTips: [
        '文法書を1章ずつ丁寧に読む',
        '例文を書き出して理解を深める',
        '間違えた問題を記録して復習する'
      ],
      luckyActivity: '文法学習'
    },
    4: {
      weekOfMonth: 4,
      weekName: '第4週',
      advice: '責任感の強いA型のあなた、今週は復習週間にしましょう。これまでの学習内容を整理し、知識を定着させる時間です。',
      encouragement: 'コツコツ積み重ねてきたあなたの努力が形になってきていますね！',
      learningTips: [
        'ノートを見返して重要ポイントをマーカーする',
        '単語テストで定着度を確認する',
        '音読で全体的な流暢さを高める'
      ],
      luckyActivity: '総復習'
    },
    5: {
      weekOfMonth: 5,
      weekName: '第5週',
      advice: '計画性のあるA型のあなた、今週は新しい教材に挑戦しましょう。慎重に選んだ教材で、次のステップへ進む準備をしましょう。',
      encouragement: '新しいことに挑戦するあなたの勇気、素晴らしいです！',
      learningTips: [
        '興味のある分野の英文記事を読む',
        'TED Talksなど本格的な教材に触れる',
        '学習計画を見直して調整する'
      ],
      luckyActivity: '多読・多聴'
    }
  },
  B: {
    1: {
      weekOfMonth: 1,
      weekName: '第1週',
      advice: '自由な発想のB型のあなた、今週は好奇心のままに学習しましょう。興味のあるトピックから英語に触れることで、楽しく続けられます。',
      encouragement: 'あなたの自由な発想が、学習に新しい風を吹き込んでいますよ！',
      learningTips: [
        '好きな洋楽の歌詞を覚える',
        '興味のある海外YouTubeを見る',
        '気になったフレーズをメモする'
      ],
      luckyActivity: '音楽・動画視聴'
    },
    2: {
      weekOfMonth: 2,
      weekName: '第2週',
      advice: '独創的なB型のあなた、今週は会話練習に力を入れましょう。自分らしい表現を見つけることで、英語がもっと楽しくなります。',
      encouragement: 'あなたのユニークな視点が、会話を面白くしていますね！',
      learningTips: [
        '独り言を英語で言ってみる',
        '日常の出来事を英語で説明する',
        'オンライン英会話に挑戦する'
      ],
      luckyActivity: 'スピーキング練習'
    },
    3: {
      weekOfMonth: 3,
      weekName: '第3週',
      advice: 'マイペースなB型のあなた、今週は気分転換に多様な教材を試しましょう。いろいろな角度から英語に触れることで、飽きずに続けられます。',
      encouragement: 'あなたの柔軟性が、学習の幅を広げていますね！',
      learningTips: [
        '英語のゲームやアプリを試す',
        '英字新聞やブログを読む',
        'ポッドキャストを聴く'
      ],
      luckyActivity: '多様な教材探索'
    },
    4: {
      weekOfMonth: 4,
      weekName: '第4週',
      advice: '楽観的なB型のあなた、今週はアウトプット重視で学習しましょう。思い切って英語を使うことで、実践力がつきます。',
      encouragement: 'あなたの前向きな姿勢が、どんどん上達させていますよ！',
      learningTips: [
        '英語で日記を書く',
        'SNSで英語投稿してみる',
        '外国人に話しかけてみる'
      ],
      luckyActivity: 'ライティング・実践'
    },
    5: {
      weekOfMonth: 5,
      weekName: '第5週',
      advice: '好奇心旺盛なB型のあなた、今週は新しい分野の英語に挑戦しましょう。未知の領域に踏み込むことで、視野が広がります。',
      encouragement: 'あなたの冒険心が、新しい世界を開いていますね！',
      learningTips: [
        '専門分野の英語に触れる',
        '海外のニュースサイトを読む',
        'ビジネス英語を学んでみる'
      ],
      luckyActivity: '専門英語学習'
    }
  },
  O: {
    1: {
      weekOfMonth: 1,
      weekName: '第1週',
      advice: 'リーダーシップのあるO型のあなた、今週は目標を明確にして学習しましょう。大きな目標を掲げることで、モチベーションが高まります。',
      encouragement: 'あなたの力強い意志が、周りにも良い刺激を与えていますよ！',
      learningTips: [
        '月間・週間の学習目標を立てる',
        'TOEICやTOEFLの目標スコアを設定する',
        '達成したら自分にご褒美を用意する'
      ],
      luckyActivity: '目標設定・計画立案'
    },
    2: {
      weekOfMonth: 2,
      weekName: '第2週',
      advice: '社交的なO型のあなた、今週は会話力を磨きましょう。人とのコミュニケーションを通じて、実践的な英語力が身につきます。',
      encouragement: 'あなたの社交性が、英語学習を楽しいものにしていますね！',
      learningTips: [
        '英会話カフェに参加する',
        '言語交換パートナーを見つける',
        'グループレッスンに挑戦する'
      ],
      luckyActivity: '英会話実践'
    },
    3: {
      weekOfMonth: 3,
      weekName: '第3週',
      advice: 'おおらかなO型のあなた、今週は楽しみながら学習しましょう。興味のあるコンテンツを使うことで、長く続けられます。',
      encouragement: 'あなたの楽しむ姿勢が、学習の質を高めていますよ！',
      learningTips: [
        '好きな映画やドラマを英語字幕で見る',
        '興味のある分野の洋書を読む',
        '英語のゲームで遊ぶ'
      ],
      luckyActivity: 'エンタメ英語学習'
    },
    4: {
      weekOfMonth: 4,
      weekName: '第4週',
      advice: '行動力のあるO型のあなた、今週は実践に力を入れましょう。積極的に英語を使う機会を作ることで、スキルアップします。',
      encouragement: 'あなたの行動力が、確実に結果につながっていますね！',
      learningTips: [
        '英語で電話やメールをしてみる',
        '海外のイベントに参加する',
        '英語でプレゼンテーションをする'
      ],
      luckyActivity: '実践的アウトプット'
    },
    5: {
      weekOfMonth: 5,
      weekName: '第5週',
      advice: 'ポジティブなO型のあなた、今週は挑戦の週にしましょう。難しい課題に取り組むことで、大きく成長できます。',
      encouragement: 'あなたの前向きなエネルギーが、困難を乗り越える力になっていますよ！',
      learningTips: [
        '難易度の高い教材に挑戦する',
        '英語の資格試験を受ける',
        'ネイティブレベルの教材に触れる'
      ],
      luckyActivity: 'チャレンジ学習'
    }
  },
  AB: {
    1: {
      weekOfMonth: 1,
      weekName: '第1週',
      advice: '合理的なAB型のあなた、今週は効率的な学習法を見つけましょう。自分に合った方法で、最短距離で上達を目指しましょう。',
      encouragement: 'あなたの論理的なアプローチが、効果的な学習を実現していますね！',
      learningTips: [
        '学習アプリを活用する',
        'スキマ時間を有効活用する',
        '最新の学習法をリサーチする'
      ],
      luckyActivity: '効率的学習法の実践'
    },
    2: {
      weekOfMonth: 2,
      weekName: '第2週',
      advice: '知的なAB型のあなた、今週は分析的に学習しましょう。英語の構造や規則を理解することで、深い知識が身につきます。',
      encouragement: 'あなたの洞察力が、英語の本質を捉えていますよ！',
      learningTips: [
        '英文法の仕組みを深く理解する',
        '語源から単語を覚える',
        '言語学的な視点で学ぶ'
      ],
      luckyActivity: '分析的文法学習'
    },
    3: {
      weekOfMonth: 3,
      weekName: '第3週',
      advice: 'クリエイティブなAB型のあなた、今週は創造的な学習を楽しみましょう。英語で表現することで、新しい自分を発見できます。',
      encouragement: 'あなたの創造性が、英語学習に新しい価値を生み出していますね！',
      learningTips: [
        '英語で詩や物語を書く',
        '英語でブログやSNSを発信する',
        '英語で芸術作品を鑑賞する'
      ],
      luckyActivity: 'クリエイティブライティング'
    },
    4: {
      weekOfMonth: 4,
      weekName: '第4週',
      advice: 'バランス感覚のあるAB型のあなた、今週は総合的に学習しましょう。4技能をバランスよく鍛えることで、全体的なレベルアップが図れます。',
      encouragement: 'あなたのバランス感覚が、調和のとれた成長を促していますよ！',
      learningTips: [
        'リーディング・ライティング・リスニング・スピーキングを均等に練習する',
        '弱点を見つけて補強する',
        '全体的な進捗を確認する'
      ],
      luckyActivity: '4技能統合学習'
    },
    5: {
      weekOfMonth: 5,
      weekName: '第5週',
      advice: '独自の視点を持つAB型のあなた、今週はオリジナルの学習スタイルを確立しましょう。自分だけの方法で、効果的に学べます。',
      encouragement: 'あなたのユニークなアプローチが、新しい可能性を開いていますね！',
      learningTips: [
        '複数の学習法を組み合わせる',
        '自分専用の学習システムを作る',
        '常識にとらわれない方法を試す'
      ],
      luckyActivity: 'オリジナル学習法開発'
    }
  }
};

export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay();

  const weekNumber = Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  return Math.min(weekNumber, 5);
}

export function generateBloodTypeAdvice(bloodType: string, date: Date): BloodTypeAdviceResult {
  const weekOfMonth = getWeekOfMonth(date);
  const advice = bloodTypeAdviceData[bloodType]?.[weekOfMonth];

  if (!advice) {
    return {
      weekOfMonth,
      weekName: `第${weekOfMonth}週`,
      advice: '今週も自分らしく、楽しく英語学習を続けましょう！',
      encouragement: 'あなたの努力は必ず実を結びます！',
      learningTips: [
        '毎日少しずつでも続ける',
        '楽しみながら学ぶ',
        '自分のペースを大切にする'
      ],
      luckyActivity: '自由な学習'
    };
  }

  return advice;
}
