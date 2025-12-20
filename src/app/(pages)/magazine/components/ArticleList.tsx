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

const ArticleList = () => {
  const { data: articlesData, isLoading } = useArticles();
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

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

  return (
    <div className={styles["magazine-main-layout"]}>
      {isAdmin && (
        <Link
          href="/magazine/create"
          className={styles["magazine-create-button"]}
        >
          Create new article
        </Link>
      )}

      <div className={styles["magazine-featured-container"]}>
        <Link
          href={`/magazine/${articles[0]?.id}`}
          className={styles["magazine-featured-article"]}
        >
          <div className={styles["magazine-featured-content"]}>
            <span className={styles["magazine-featured-artist"]}>
              {articles[0]?.artist}
            </span>
            <h1 className={styles["magazine-featured-title"]}>
              {articles[0]?.title}
            </h1>
            <p className={styles["magazine-featured-content-text"]}>
              {articles[0]?.content}
            </p>
          </div>

          {articles[0]?.image?.[0] && (
            <Image
              className={styles["magazine-featured-image"]}
              src={articles[0].image[0]}
              alt={articles[0].title}
              width={800}
              height={600}
              priority
            />
          )}
        </Link>

        <div className={styles["magazine-side-column"]}>
          {articles.slice(1).map((article, idx) => (
            <div key={article.id}>
              <Link
                href={`/magazine/${article.id}`}
                className={styles["magazine-side-article-link"]}
              >
                <div className={styles["magazine-side-article"]}>
                  <div className={styles["magazine-side-texts"]}>
                    <span className={styles["magazine-side-artist"]}>
                      {article.artist}
                    </span>
                    <span className={styles["magazine-side-title"]}>
                      {article.title}
                    </span>
                    <span className={styles["magazine-side-content"]}>
                      {article.content}
                    </span>
                  </div>

                  {article.image?.[0] && (
                    <div
                      className={styles["magazine-side-image-container"]}
                    >
                      <Image
                        className={styles["magazine-side-image"]}
                        src={article.image[0]}
                        alt={article.title}
                        width={200}
                        height={150}
                      />
                    </div>
                  )}
                </div>
              </Link>

              {idx < articles.length - 2 && (
                <svg
                  className={styles["magazine-side-separator"]}
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
