"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useArticles } from "@/hooks/useArticles";
import styles from "./ProfilePage.module.css";
import Sidebar from "@/components/layout/Sidebar";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const { user } = useAuth();
  const { data: articles, isLoading } = useArticles();
  const userArticles =
    articles?.filter((article) => article.author_uid === user?.uid) || [];


  // Filter articles by author_uid matching the profile username (uid)

  return (
    <div className={styles["profile-layout"]}>
      <div className={styles["sidebar-column"]}>
        <Sidebar />
      </div>
      <div className={styles["content-column"]}>
        <div className={styles["page-container"]}>
      <div className={styles["card"]}>
        <div className={styles["card-content"]}>
          <div className={styles["section"]}>
            <div className={styles["profile-header"]}>
              <div className={styles["profile-avatar"]}>{user?.displayName?.[0] || "B"}</div>
              <h2 className={styles["section-title"]}>Tus artículos</h2>
              <button className={styles["profile-share-button"]}>Compartir perfil</button>
            </div>
            <div className={styles["filters-row"]}>
              <button className={styles["filter-pill"]}>Artículos</button>
              <button className={styles["filter-pill"]}>Colecciones</button>
            </div>
            {isLoading ? (
              <div className={styles["loading"]}>Loading articles...</div>
            ) : userArticles.length > 0 ? (
              <div className={styles["articles-grid"]}>
                {userArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className={styles["article-item"]}
                  >
                    <div className={styles["article-card"]}>
                      <div className={styles["article-item-texts"]}>
                        <span className={styles["article-artist"]}>{article.artist}</span>
                        <span className={styles["article-title"]}>{article.title}</span>
                        {article.content && (
                          <span className={styles["article-content"]}>{article.content}</span>
                        )}
                      </div>
                      {article.image?.[0] && (
                        <div className={styles["article-image-container"]}>
                          <Image
                            className={styles["article-image"]}
                            src={article.image[0]}
                            alt={article.title}
                            width={200}
                            height={150}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles["empty-state"]}>No articles for this user.</div>
            )}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
