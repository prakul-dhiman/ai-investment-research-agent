import Parser from "rss-parser";

export interface RSSFeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  source?: string;
}

const parser = new Parser();

export class RSSNewsService {
  static async fetchTickerNews(ticker: string): Promise<RSSFeedItem[]> {
    const cleanTicker = ticker.toUpperCase().trim();
    const query = encodeURIComponent(`${cleanTicker} stock market business`);
    const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    try {
      const feed = await parser.parseURL(feedUrl);
      if (!feed.items || feed.items.length === 0) return [];

      return feed.items.slice(0, 10).map((item) => {
        let title = item.title || "";
        let sourceName = "Google News";
        const parts = title.split(" - ");
        if (parts.length > 1) {
          sourceName = parts[parts.length - 1];
          title = parts.slice(0, -1).join(" - ");
        }

        return {
          title,
          link: item.link || "",
          pubDate: item.pubDate || new Date().toISOString(),
          contentSnippet: item.contentSnippet || "",
          source: sourceName
        };
      });
    } catch (err) {
      return [];
    }
  }
}
