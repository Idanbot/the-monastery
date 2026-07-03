export type RegisteredSectionProps = {
  openSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  motionDuration: number;
  motionEase: string | readonly [number, number, number, number];
};
