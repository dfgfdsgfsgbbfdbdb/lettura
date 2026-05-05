import React, { useEffect, useState } from "react";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/plugin-shell";
import { ArticleResItem } from "@/db";
import { YoutubeAdapter } from "./adapter/Youtube";
import { PodcastAdapter } from "./adapter/Podcast";
import { CommonAdapter } from "./adapter/Common";
import { pickArticleContent, processArticleHtml } from "@/helpers/articleContent";

function validateFeed(article: ArticleResItem, medias: any) {
  const { feed_url } = article;

  let isCommon = true;
  let isYoutube = false;
  let isPodcast = false;

  if (/youtube.com\/feeds\/videos.xml/.test(feed_url)) {
    isYoutube = true;
    isCommon = false;
  } else if (medias?.length > 0) {
    isPodcast = true;
    isCommon = false;
  }

  return {
    isCommon,
    isYoutube,
    isPodcast,
  };
}

export interface ArticleDetailProps {
  article: any;
}

export const ArticleDetail = (props: ArticleDetailProps) => {
  const { article } = props;
  const [pageContent, setPageContent] = useState("");
  const [medias, setMedias] = useState([]);

  function delegateContentClick(e: React.MouseEvent<HTMLElement>) {
    let elem = null;
    const i = e.nativeEvent.composedPath();

    for (let a = 0; a <= i.length - 1; a++) {
      const s = i[a] as HTMLElement;

      if ("A" === s.tagName) {
        elem = s;
        break;
      }
    }

    if (elem?.getAttribute("href")) {
      e.preventDefault();
      e.stopPropagation();

      const href = elem.getAttribute("href") || "";

      if (
        href &&
        (href.indexOf("http://") >= 0 ||
          href.indexOf("https://") >= 0 ||
          href.indexOf("www.") >= 0)
      ) {
        open(href);
      } else if (href.indexOf("#") === 0) {
        open(`${article.link}${href}`);
      }
    }
  }

  function renderMain() {
    const { isCommon, isYoutube, isPodcast } = validateFeed(
      article,
      medias || [],
    );

    if (isYoutube) {
      return (
        <YoutubeAdapter
          article={article}
          content={pageContent}
          medias={medias}
        />
      );
    } else if (isPodcast) {
      return (
        <PodcastAdapter
          article={article}
          content={pageContent}
          medias={medias}
        />
      );
    } else {
      return (
        <CommonAdapter
          article={article}
          content={pageContent}
          delegateContentClick={delegateContentClick}
        />
      );
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setPageContent("");

    article &&
      dataAgent
        .getArticleDetail(article.uuid, {
          signal: controller.signal,
        })
        .then((res) => {
          const { data } = res;
          const raw = pickArticleContent(data.content, data.description);
          const processed = processArticleHtml(raw, { baseUrl: article.link });

          setPageContent(processed);

          try {
            setMedias(JSON.parse(data.media_object));
          } catch (e) {
            setMedias([]);
          }
        });

    return () => {
      controller.abort();
    };
  }, [article]);

  return renderMain();
};
