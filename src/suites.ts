import React from 'react';
import {
  Sparkles,
  FileText,
  Video,
  Film,
} from 'lucide-react';

export interface SuiteDefinition {
  id: string;
  nameNo: string;
  nameEn: string;
  taglineNo: string;
  taglineEn: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  appIds: string[];
  appNames: string[];
  folders: { folderName: string; name: string; description: string }[];
}

export const SUITE_DEFINITIONS: SuiteDefinition[] = [
  {
    id: 'creative',
    nameNo: 'Kreative apper',
    nameEn: 'Creative Suite',
    taglineNo: 'Komplett studio for bilde, vektor, 3D, digital maling, videoeffekter og lyd',
    taglineEn: 'Complete studio for photo, vector, 3D, digital painting, VFX and audio',
    icon: Sparkles,
    color: '#ec4899',
    badge: '12 apper (Komplett)',
    appIds: [
      'photocraft',
      'vectorcraft',
      'filmcraft',
      'lightcraft',
      'effectcraft',
      'designcraft',
      'figcraft',
      'soundcraft',
      'cadcraft',
      'blender',
      'krita',
      'audacity',
    ],
    appNames: [
      'PhotoCraft',
      'VectorCraft',
      'FilmCraft',
      'LightCraft',
      'EffectCraft',
      'DesignCraft',
      'FigCraft',
      'SoundCraft',
      'CADCraft',
      'Blender',
      'Krita',
      'Audacity',
    ],
    folders: [
      {
        folderName: 'Photos',
        name: 'Photos & RAW',
        description: 'Original photos, RAW captures and Lightroom/LightCraft libraries',
      },
      {
        folderName: 'Brushes',
        name: 'Brushes & References',
        description: 'Krita resource bundles and concept art sketches',
      },
      {
        folderName: 'Vectors',
        name: 'Vectors & Graphics',
        description: 'Vector illustrations, SVG graphics, logos and typography',
      },
      {
        folderName: '3D_Models',
        name: '3D & Blender',
        description: '3D scenes, sculpts, CAD parts and textures',
      },
      {
        folderName: 'Video_Footage',
        name: 'Video & Footage',
        description: 'Video clips, timelines, motion assets and exports',
      },
      {
        folderName: 'Audio_and_SFX',
        name: 'Audio & Music',
        description: 'Sound effects, instruments, stems and Audacity recordings',
      },
    ],
  },
  {
    id: 'office',
    nameNo: 'Office-pakke',
    nameEn: 'Office Suite',
    taglineNo: 'Dokumentbehandling, regneark, presentasjoner og profesjonell PDF',
    taglineEn: 'Word processing, spreadsheets, slide decks and professional PDF',
    icon: FileText,
    color: '#3b82f6',
    badge: '4 apper',
    appIds: ['wordcraft', 'gridcraft', 'deckcraft', 'pdfcraft'],
    appNames: ['WordCraft', 'GridCraft', 'DeckCraft', 'PdfCraft'],
    folders: [
      {
        folderName: 'Documents',
        name: 'Documents & Notes',
        description: 'WordCraft files, text documents, reports and articles',
      },
      {
        folderName: 'Spreadsheets',
        name: 'Spreadsheets & Data',
        description: 'GridCraft spreadsheets and data sheets',
      },
      {
        folderName: 'Presentations',
        name: 'Presentations & Slides',
        description: 'DeckCraft presentation slide decks',
      },
      {
        folderName: 'PDFs',
        name: 'PDF Documents',
        description: 'PDF files, forms and exported publications',
      },
    ],
  },
  {
    id: 'vtuber',
    nameNo: 'VTuber & Streaming',
    nameEn: 'VTuber & Streaming Suite',
    taglineNo: '3D motion capture, ansiktssporing, reaktiv 2D PNGtuber, AI-dialog og OBS Studio',
    taglineEn: '3D motion capture, face tracking, reactive 2D PNGtuber, AI avatar & OBS Studio',
    icon: Video,
    color: '#8b5cf6',
    badge: '5 apper',
    appIds: ['sysmocap', 'openvtuber', 'pyngtuber', 'open-llm-vtuber', 'obs'],
    appNames: ['SysMocap', 'OpenVTuber', 'PyNGTuber', 'Open-LLM-VTuber', 'OBS Studio'],
    folders: [
      {
        folderName: 'Avatars_VRM',
        name: 'Avatars & Models',
        description: 'VRM 3D-avatarer, Live2D-modeller og teksturer',
      },
      {
        folderName: 'PNGtuber_Sprites',
        name: 'PNGtuber Sprites',
        description: 'Reaktive avatar-bilder for PyNGTuber',
      },
      {
        folderName: 'Streams_Recordings',
        name: 'Streaming & Opptak',
        description: 'OBS opptaksfiler, scener og profiler',
      },
    ],
  },
  {
    id: 'video',
    nameNo: 'Videoredigering',
    nameEn: 'Video Production Suite',
    taglineNo: 'Fokusert videoproduksjon med FilmCraft, EffectCraft, OBS Studio, SoundCraft og Audacity',
    taglineEn: 'Focused video editing, VFX, screen recording and audio with FilmCraft, EffectCraft & OBS',
    icon: Film,
    color: '#f97316',
    badge: '5 apper',
    appIds: ['filmcraft', 'effectcraft', 'obs', 'soundcraft', 'audacity'],
    appNames: ['FilmCraft', 'EffectCraft', 'OBS Studio', 'SoundCraft', 'Audacity'],
    folders: [
      {
        folderName: 'Video_Footage',
        name: 'Video & Footage',
        description: 'Video clips, timelines, motion assets and exports',
      },
      {
        folderName: 'Recordings',
        name: 'OBS Recordings',
        description: 'OBS Studio screen recordings and stream footage',
      },
      {
        folderName: 'Audio_and_SFX',
        name: 'Audio & SFX',
        description: 'Sound effects, voiceovers, stems and Audacity tracks',
      },
    ],
  },
];

export const ALL_SUITE_IDS = SUITE_DEFINITIONS.map((s) => s.id);

export const getSelectedSuiteAppIds = (selectedSuiteIds: string[]): Set<string> => {
  const ids = new Set<string>();
  if (!selectedSuiteIds || selectedSuiteIds.length === 0) {
    // If empty or all, all app IDs are included
    SUITE_DEFINITIONS.forEach((s) => s.appIds.forEach((id) => ids.add(id)));
    return ids;
  }
  selectedSuiteIds.forEach((sId) => {
    const s = SUITE_DEFINITIONS.find((def) => def.id === sId);
    if (s) {
      s.appIds.forEach((id) => ids.add(id));
    }
  });
  return ids;
};
