import { IconButton, Tooltip } from "@radix-ui/themes";
import { Bookmark, Eye, EyeOff, Star } from "lucide-react";
import {
  ArticleReadLaterStatus,
  ArticleReadStatus,
  ArticleStarStatus,
} from "@/typing";
import React, { useEffect, useState } from "react";
import { ArticleResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useTranslation } from "react-i18next";

export interface StarAndReadProps {
  article: ArticleResItem;
}

export function StarAndRead(props: StarAndReadProps) {
  const { article } = props;
  const { t } = useTranslation();
  const [readStatus, setReadStatus] = useState<number>(article.read_status);
  const [starred, setStarred] = useState<number>(article.starred);
  const [readLater, setReadLater] = useState<number>(
    article.is_read_later ?? ArticleReadLaterStatus.UNSAVED,
  );

  function toggleReadStatus() {
    const newStatus =
      readStatus === ArticleReadStatus.UNREAD
        ? ArticleReadStatus.READ
        : ArticleReadStatus.UNREAD;
    dataAgent.updateArticleReadStatus(article.uuid, newStatus).then(() => {
      setReadStatus(newStatus);
    });
  }

  function toggleStarStatus() {
    const newStarrStatus =
      starred === ArticleStarStatus.UNSTAR
        ? ArticleStarStatus.STARRED
        : ArticleStarStatus.UNSTAR;
    dataAgent.updateArticleStarStatus(article.uuid, newStarrStatus).then(() => {
      setStarred(newStarrStatus);
    });
  }

  function toggleReadLaterStatus() {
    const nextStatus =
      readLater === ArticleReadLaterStatus.SAVED
        ? ArticleReadLaterStatus.UNSAVED
        : ArticleReadLaterStatus.SAVED;
    dataAgent.updateArticleReadLaterStatus(article.uuid, nextStatus).then(() => {
      setReadLater(nextStatus);
    });
  }

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  useEffect(() => {
    setStarred(article.starred);
  }, [article.starred]);

  useEffect(() => {
    setReadLater(article.is_read_later ?? ArticleReadLaterStatus.UNSAVED);
  }, [article.is_read_later]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip content={t(starred === ArticleStarStatus.STARRED ? "Unstar it" : "Star it")}>
        <IconButton
          variant="ghost"
          size="2"
          color="gray"
          className={
            starred === ArticleStarStatus.STARRED
              ? "!text-[#fe9e2b]"
              : "text-[var(--gray-12)]"
          }
          onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            toggleStarStatus();
          }}
        >
          <Star
            size={16}
            fill={starred === ArticleStarStatus.STARRED ? "currentColor" : "none"}
          />
        </IconButton>
      </Tooltip>
      <Tooltip
        content={
          readLater === ArticleReadLaterStatus.SAVED
            ? t("article.actions.remove_read_later")
            : t("article.actions.read_later")
        }
      >
        <IconButton
          variant="ghost"
          size="2"
          color="gray"
          className={
            readLater === ArticleReadLaterStatus.SAVED
              ? "!text-[var(--accent-9)]"
              : "text-[var(--gray-12)]"
          }
          onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            toggleReadLaterStatus();
          }}
        >
          <Bookmark
            size={16}
            fill={readLater === ArticleReadLaterStatus.SAVED ? "currentColor" : "none"}
          />
        </IconButton>
      </Tooltip>
      <Tooltip
        content={t(readStatus === ArticleReadStatus.READ ? "Mark as unread" : "Mark as read")}
      >
        <IconButton
          variant="ghost"
          size="2"
          color="gray"
          className="text-[var(--gray-12)]"
          onClick={(e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            toggleReadStatus();
          }}
        >
          {readStatus === ArticleReadStatus.READ ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </IconButton>
      </Tooltip>
    </div>
  );
}
