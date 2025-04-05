import { RedditPost } from '@common/interfaces/reddit-post';

export interface RedditResponse {
  data: RedditResponseData;
}

interface RedditResponseData {
  children: RedditPost[];
}
