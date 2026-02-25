"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/data/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/data/data-table";
import { Pagination, PaginationInfo } from "@/components/data/pagination";
import { EmptyState } from "@/components/data/empty-state";
import { usePagination } from "@/hooks/use-pagination";
import { copyToClipboard, exportToCsv } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Example data
const initialData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Pending" : "Completed",
  date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
  value: Math.floor(Math.random() * 1000),
}));

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [data, setData] = React.useState(initialData);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    setPage,
  } = usePagination({
    items: filteredData,
    pageSize: 10,
  });

  const handleExport = () => {
    exportToCsv(filteredData, "data-export");
    toast({
      title: "Export complete",
      description: `Exported ${filteredData.length} items to CSV`,
      variant: "success",
    });
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Tools"
        description="Utility tools and data management"
        breadcrumbs={[{ label: "Tools" }]}
        actions={
          <Button onClick={handleExport}>Export CSV</Button>
        }
      />

      <Tabs defaultValue="table" className="mt-8">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <SearchInput
            onSearch={setSearchQuery}
            placeholder="Search items..."
            className="max-w-sm"
          />
        </div>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {paginatedItems.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                item.status === "Active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : item.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>${item.value}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(JSON.stringify(item))}
                            >
                              Copy
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800">
                    <PaginationInfo
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalItems={filteredData.length}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No items found"
                  description={searchQuery ? "Try adjusting your search" : "Add some items to get started"}
                  action={
                    searchQuery ? (
                      <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear search
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          {paginatedItems.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>ID: {item.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Status</span>
                          <span>{item.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Date</span>
                          <span>{item.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Value</span>
                          <span>${item.value}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <PaginationInfo
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={filteredData.length}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title="No items found"
              description={searchQuery ? "Try adjusting your search" : "Add some items to get started"}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
