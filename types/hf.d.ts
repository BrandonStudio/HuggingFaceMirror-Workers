export type XetTokenResponse = {
  casUrl: string;
  exp: string;
  accessToken: string;
};

export type CasXetReconstructionResponse = {
  offset_into_first_range: number;
  terms: {
    hash: string;
    unpacked_length: number;
    range: {
      start: number;
      end: number;
    };
  }[];
  fetch_info: {
    [hash: string]: {
      range: {
        start: number;
        end: number;
      };
      url: string;
      url_range: {
        start: number;
        end: number;
      };
    }[];
  };
};
