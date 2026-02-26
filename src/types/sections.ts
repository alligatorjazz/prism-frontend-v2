import * as API from "../inbox/payload-types";
import type { ArrayElement } from "../lib";

export type RichText = { content: string };

export type ColumnChild = RichText;
export type Column = {
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  // content: ColumnChild;
};

export type Section = {
  title: string;
  fullWidth?: boolean;
};

export type Block<BlockType> = Omit<
  Extract<ArrayElement<API.Page["sections"]>, { blockType: BlockType }>,
  "blockType"
>;
