import { CharacterId, DrawnCard, TopicId } from '../types';

// Bottom tab (PROJECT_BRIEF.md ข้อ 5.1)
export type RootTabParamList = {
  Home: undefined;
  Predict: undefined;
  Collection: undefined;
};

// Stack ครอบ tab ไว้ เพื่อให้ Loading/CardDetail/CharacterDetail เปิดเต็มจอทับ tab bar
export type RootStackParamList = {
  Tabs: undefined;
  Loading: { cardId: string };
  CardDetail: { cardId: string };
  CharacterDetail: { characterId: CharacterId };
};

// Stack ภายในแท็บ "คำทำนาย" — เดินตามลำดับ เลือกหัวข้อ → จั่วไพ่คว่ำ → เปิดไพ่+คำตีความ
export type PredictStackParamList = {
  PredictTopic: undefined;
  PredictDraw: { topicId: TopicId };
  PredictResult: { topicId: TopicId; drawnCards: DrawnCard[] };
};
