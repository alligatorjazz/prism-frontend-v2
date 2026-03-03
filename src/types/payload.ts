import * as API from "../inbox/payload-types";
import type { ArrayElement, Exists } from "../lib";

export type Block<BlockType> = Omit<
  Extract<ArrayElement<API.Page["sections"]>, { blockType: BlockType }>,
  "blockType"
>;

export type LinkCardData = ArrayElement<
  Exists<Block<"CardsWithHeader">["cards"]>
>;

export type SiteEvent = API.Event;
