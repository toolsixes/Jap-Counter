export type BeadMaterial = 'rudraksha' | 'tulsi' | 'sandalwood' | 'sphatik' | 'gold';

export interface MalaTrack {
  id: string;
  title: string;
  mantraText: string;
  meaning?: string;
  deity?: string;
  beadMaterial: BeadMaterial;
  targetMalas: number; // Daily goal for this mala
  currentBead: number; // 0 to 108
  completedMalasToday: number;
  totalChantsToday: number;
  totalChantsLifetime: number;
  colorTheme: string; // Accent color hex
  order?: number;
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
  lastChantedAt: number;
}

export const DEFAULT_MALA_TRACKS: MalaTrack[] = [
  {
    id: 'mala_hare_krishna',
    title: 'Hare Krishna Mahamantra',
    mantraText: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥',
    meaning: 'Awakening pure transcendental divine love and consciousness through the holy names.',
    deity: 'Sri Sri Radha Krishna',
    beadMaterial: 'tulsi',
    targetMalas: 16,
    currentBead: 0,
    completedMalasToday: 0,
    totalChantsToday: 0,
    totalChantsLifetime: 0,
    colorTheme: '#F59E0B',
    order: 1,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    lastChantedAt: 1700000000000,
  },
  {
    id: 'mala_om_namah_shivaya',
    title: 'Om Namah Shivaya',
    mantraText: 'ॐ नमः शिवाय',
    meaning: 'I surrender to Lord Shiva, the auspicious inner truth and tranquil pure self.',
    deity: 'Lord Shiva (Mahadev)',
    beadMaterial: 'rudraksha',
    targetMalas: 1,
    currentBead: 0,
    completedMalasToday: 0,
    totalChantsToday: 0,
    totalChantsLifetime: 0,
    colorTheme: '#EA580C',
    order: 2,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    lastChantedAt: 1700000000000,
  },
  {
    id: 'mala_gayatri',
    title: 'Gayatri Mahamantra',
    mantraText: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    meaning: 'May the radiant divine light illuminate our intellect and dispel darkness.',
    deity: 'Savitr / Gayatri Devi',
    beadMaterial: 'sandalwood',
    targetMalas: 3,
    currentBead: 0,
    completedMalasToday: 0,
    totalChantsToday: 0,
    totalChantsLifetime: 0,
    colorTheme: '#EAB308',
    order: 3,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    lastChantedAt: 1700000000000,
  },
  {
    id: 'mala_radhe_radhe',
    title: 'Radhe Radhe Devotional',
    mantraText: 'राधे राधे',
    meaning: 'Continual sweet remembrance of the Divine Mother Srimati Radharani.',
    deity: 'Radha Rani',
    beadMaterial: 'sphatik',
    targetMalas: 4,
    currentBead: 0,
    completedMalasToday: 0,
    totalChantsToday: 0,
    totalChantsLifetime: 0,
    colorTheme: '#EC4899',
    order: 4,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    lastChantedAt: 1700000000000,
  },
];

export interface Mantra {
  id: string;
  name: string;
  originalText: string;
  meaning: string;
  deity?: string;
}

export const DEFAULT_MANTRAS: Mantra[] = [
  {
    id: 'gayatri',
    name: 'Gayatri Mantra',
    originalText: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    meaning: 'May the Supreme Divine illuminate our intellect and lead us along the righteous path.',
    deity: 'Savitr / Divine Light',
  },
  {
    id: 'om_namah_shivaya',
    name: 'Om Namah Shivaya',
    originalText: 'ॐ नमः शिवाय',
    meaning: 'I bow to Shiva, the auspicious, peaceful, and transcendent reality within.',
    deity: 'Lord Shiva',
  },
  {
    id: 'hare_krishna',
    name: 'Hare Krishna Maha Mantra',
    originalText: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥',
    meaning: 'Chanting the divine names to awaken pure transcendental love and consciousness.',
    deity: 'Radha Krishna / Rama',
  },
  {
    id: 'maha_mrityunjaya',
    name: 'Maha Mrityunjaya Mantra',
    originalText: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्यprimaryोर्मुक्षीय मामृतात् ॥',
    meaning: 'We worship the Three-Eyed Lord who nourishes all beings. May we be liberated from mortal bondage.',
    deity: 'Lord Shiva (Mrityunjaya)',
  },
  {
    id: 'om_mani_padme_hum',
    name: 'Om Mani Padme Hum',
    originalText: 'ॐ मणि पद्मे हूँ',
    meaning: 'Behold the Jewel in the Lotus: the indivisible union of wisdom and compassion.',
    deity: 'Avalokiteshvara / Buddha',
  },
  {
    id: 'om_gan_ganapataye',
    name: 'Ganesh Mantra',
    originalText: 'ॐ गं गणपतये नमः',
    meaning: 'Salutations to Ganesha, the remover of obstacles and lord of beginnings.',
    deity: 'Lord Ganesha',
  },
  {
    id: 'custom',
    name: 'Personal / Custom Chants',
    originalText: 'ॐ',
    meaning: 'Personal divine remembrance and meditation.',
  },
];

export interface JaapEntry {
  id: string;
  userId?: string;
  malaId: string;
  mantraId?: string;
  mantraName?: string;
  count: number;
  malas: number; // completed or fractional malas
  timestamp: number; // Unix timestamp ms
  type: 'live' | 'manual';
  note?: string;
  deviceId: string;
  updatedAt: number;
  deleted?: boolean;
}

export interface UserSettings {
  dailyTargetMalas: number;
  selectedMantraId: string;
  soundEnabled: boolean;
  soundType: 'bowl' | 'bell' | 'wood' | 'chime' | 'silent';
  hapticEnabled: boolean;
  themeAccent: 'saffron' | 'gold' | 'rudraksha';
  viewMode: '3d' | 'classic';
  deviceFrame: 'pixel' | 'iphone' | 'fullscreen';
  autoDriveSync: boolean;
  autoFirestoreSync: boolean;
  customMantraName?: string;
  customMantraText?: string;
  customMantraMeaning?: string;
}

export interface JaapLogData {
  version: number;
  app: string;
  lastModified: number;
  deviceId: string;
  activeMalaId: string;
  malas: MalaTrack[];
  entries: JaapEntry[];
  settings: Partial<UserSettings>;
}

export type SyncState = 'idle' | 'checking' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncMetadata {
  state: SyncState;
  lastSyncedAt: number | null;
  remoteModifiedAt: number | null;
  cloudFileId: string | null;
  statusMessage: string;
  errorMessage?: string;
}
