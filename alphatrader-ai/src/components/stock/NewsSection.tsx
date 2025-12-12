'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsItem } from "@/types/stock";
import { formatDistanceToNow } from "date-fns";

interface NewsSectionProps {
  news: NewsItem[];
  symbol: string;
}

const ITEMS_PER_PAGE = 5;

export function NewsSection({ news, symbol }: NewsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!news || news.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Latest News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">
              No recent news available for {symbol}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              News will appear here when available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentNews = news.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of news section
    document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  return (
    <Card id="news-section" className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-500" />
            Latest News
            <Badge variant="outline" className="ml-2 text-gray-400 border-gray-700">
              {news.length} articles
            </Badge>
          </CardTitle>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {currentNews.map((item, index) => (
          <a
            key={item.id}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex gap-4 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-200 border border-gray-800 hover:border-gray-700 hover:shadow-lg">
              {/* Number Badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-semibold text-gray-400 group-hover:bg-blue-900/30 group-hover:border-blue-700 group-hover:text-blue-400 transition-colors">
                {startIndex + index + 1}
              </div>

              {/* Image */}
              {item.imageUrl && (
                <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-800 group-hover:border-gray-700 transition-colors">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.parentElement!.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all" />
                </div>

                {item.summary && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                    {item.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {item.source && (
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750">
                      {item.source}
                    </Badge>
                  )}

                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-gray-600">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 p-0 ${
                      currentPage === page
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "hover:bg-gray-800"
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-3 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, news.length)} of {news.length} news articles from the last 7 days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
