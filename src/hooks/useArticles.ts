import { useQuery } from "@tanstack/react-query";
import { get } from "@/api/http";

export interface Article {
  id: number;
  title: string;
  artist?: string;
  content?: string;
  image?: string[];
  video?: string[];
  audio?: string[];
  author_uid?: string;
}

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: () => get<Article[]>("/articles/articles"),
    staleTime: 1000 * 60 * 5,
  });
};

export const useArticleDetail = (id: number) => {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => get<Article>(`/articles/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};
