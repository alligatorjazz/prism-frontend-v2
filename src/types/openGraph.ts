type OpenGraphBasic = {
  title: string;
  image: string | [];
  "image:alt": string;
  url: string;
  description?: string;
  determiner?: string;
  locale?: string;
  "locale:alternate"?: string[];
  site_name?: string;
};

type OpenGraphProfileMetadata = {
  "profile:first_name"?: string;
  "profile:last_name"?: string;
  "profile:username"?: string;
  "profile:gender"?: string;
};

type OpenGraphVideoCredits = {
  "video:actor"?: string[];
  "video:actor:role"?: string[];
  "video:director"?: string[];
  "video:writer"?: string[];
  "video:duration"?: number;
  "video:release_date"?: string;
  "video:tag"?: string[];
};

// GRAPH TYPES
type OpenGraphWebsite = OpenGraphBasic & {
  type: "website";
};

// Music
type OpenGraphSong = OpenGraphBasic & {
  type: "music.song";
  "music:duration"?: number;
  "music:album"?: string | string[]; // url of album(s)
  "music:album:disc"?: number;
  "music:album:track"?: number;
  "music:musician"?: string[];
};

type OpenGraphAlbum = OpenGraphBasic & {
  type: "music.album";
  "music:duration"?: number;
  "music:song"?: string; // url of song
  "music:song:disc"?: number;
  "music:song:track"?: number;
  "music:musician"?: string[];
  "music:release_date"?: string;
};

type OpenGraphPlaylist = OpenGraphBasic & {
  type: "music.playlist";
  "music:song"?: string; // url of song
  "music:song:disc"?: number;
  "music:song:track"?: number;
  "music:creator"?: string[];
};

type OpenGraphRadioStation = OpenGraphBasic & {
  type: "music.radio_station";
  "music:creator"?: string[];
};

type OpenGraphAudio =
  | OpenGraphSong
  | OpenGraphAlbum
  | OpenGraphPlaylist
  | OpenGraphRadioStation;

// Video
type OpenGraphMovie = OpenGraphBasic & {
  type: "video.movie";
} & OpenGraphVideoCredits;

type OpenGraphTVShow = OpenGraphBasic & {
  type: "video.tv_show";
} & OpenGraphVideoCredits;

type OpenGraphVideoOther = OpenGraphBasic & {
  type: "video.other";
} & OpenGraphVideoCredits;

type OpenGraphEpisode = OpenGraphBasic & {
  type: "video.episode";
  "video:series"?: string;
};

type OpenGraphVideo =
  | OpenGraphMovie
  | OpenGraphTVShow
  | OpenGraphEpisode
  | OpenGraphVideoOther;

// Other
type OpenGraphArticle = OpenGraphBasic & {
  type: "article";
  "article:published_time"?: string;
  "article:modified_time"?: string;
  "article:expiration_time"?: string;
  "article:author"?: string;
  "article:section"?: string;
  "article:tag"?: string[];
};

type OpenGraphBook = OpenGraphBasic & {
  type: "book";
  "book:author"?: string[];
  "book:isbn"?: string;
  "book:release_date"?: string;
  "book:tag"?: string[];
};

type OpenGraphPayment = OpenGraphBasic & {
  type: "payment.link";
  "payment:description"?: string;
  "payment:currency"?: string;
  "payment:amount"?: number;
  "payment:expires_at"?: string;
  "payment:status"?: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  "payment:id"?: string;
  "payment:success_url"?: string;
};
type OpenGraphProfile = OpenGraphBasic & {
  type: "profile";
} & OpenGraphProfileMetadata;
export type OpenGraphNode =
  | OpenGraphWebsite
  | OpenGraphArticle
  | OpenGraphBook
  | OpenGraphPayment
  | OpenGraphProfile
  | OpenGraphAudio
  | OpenGraphVideo;
