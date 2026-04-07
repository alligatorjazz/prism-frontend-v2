export type RichText = { content: string };

export type ColumnChild = RichText;
export type Column = {
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  // content: ColumnChild;
};

export type SectionProps = {
  title: string;
  fullWidth?: boolean;
};
