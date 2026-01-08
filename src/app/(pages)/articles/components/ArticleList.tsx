'use client';

import { useState, useEffect } from "react";
import { useArticles } from "@/hooks/useArticles";
import { useAuth } from "@/app/(providers)/auth-provider";
import { get } from "@/api/http";
import Link from "next/link";
import Image from "next/image";
import styles from "./ArticleList.module.css";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";

interface UserData {
  role: string;
}

interface ArticleListProps { filterUid?: string }

const ArticleList = ({ filterUid }: ArticleListProps) => {
  const { data: articlesData, isLoading } = useArticles();
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const [showMine, setShowMine] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.uid) {
        try {
          const userData = await get<UserData>(`/users/${user.uid}`);
          setIsAdmin(userData.role === "admin");
        } catch {
          setIsAdmin(false);
        }
      }
    };
    checkUserRole();
  }, [user]);

  if (isLoading) return <LoadingSketch />;
  if (!articlesData || articlesData.length === 0) return null;

  const articles = articlesData;
  const targetUid = filterUid ?? (showMine && user?.uid ? user.uid : undefined);
  const list = targetUid ? (articles || []).filter((a: any) => a?.author_uid === targetUid) : articles;

  return (
    <div className={styles["articles-main-layout"]}>
      <div className={styles["articles-actions-row"]}>
        {!filterUid && user?.uid && (
          <button
            type="button"
            className={styles["articles-filter-button"]}
            onClick={() => setShowMine((v) => !v)}
          >
            {showMine ? "All articles" : "My articles"}
          </button>
        )}
        {isAdmin && (
          <Link
            href="/articles/create"
            className={styles["articles-create-button"]}
          >
            Create new article
          </Link>
        )}
      </div>

      <div className={styles["articles-featured-container"]}>
        <Link
          href={`/articles/${list[0]?.id}`}
          className={styles["articles-featured-article"]}
        >
          <div className={styles["articles-featured-content"]}>
            <span className={styles["articles-featured-artist"]}>
              {list[0]?.artist}
            </span>
            <h1 className={styles["articles-featured-title"]}>
              {list[0]?.title}
            </h1>
            <p className={styles["articles-featured-content-text"]}>
              {list[0]?.content}
            </p>
          </div>

          {list[0]?.image?.[0] && (
            <Image
              className={styles["articles-featured-image"]}
              src={list[0].image[0]}
              alt={list[0].title}
              width={800}
              height={600}
              priority
            />
          )}
        </Link>

        <div className={styles["articles-side-column"]}>
          {list.slice(1).map((article, idx) => (
            <div key={article.id}>
              <Link
                href={`/articles/${article.id}`}
                className={styles["articles-side-article-link"]}
              >
                <div className={styles["articles-side-article"]}>
                  <div className={styles["articles-side-texts"]}>
                    <span className={styles["articles-side-artist"]}>
                      {article.artist}
                    </span>
                    <span className={styles["articles-side-title"]}>
                      {article.title}
                    </span>
                    <span className={styles["articles-side-content"]}>
                      {article.content}
                    </span>
                  </div>

                  {article.image?.[0] && (
                    <div
                      className={styles["articles-side-image-container"]}
                    >
                      <Image
                        className={styles["articles-side-image"]}
                        src={article.image[0]}
                        alt={article.title}
                        width={200}
                        height={150}
                      />
                    </div>
                  )}
                </div>
              </Link>

              {idx < list.length - 2 && (
                <svg
                  className={styles["articles-side-separator"]}
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="10"
                >
                  <line
                    x1="0"
                    y1="5"
                    x2="100%"
                    y2="5"
                    stroke="var(--text-color)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleList;
