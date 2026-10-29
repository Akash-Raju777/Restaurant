package com.theember.dto;

import org.springframework.data.domain.Page;
import java.util.List;

/**
 * Generic paged response DTO that replaces Spring Data's Page<T> in API responses,
 * so the admin frontend receives a predictable JSON structure.
 */
public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public PagedResponse() {}

    public static <T> PagedResponse<T> from(Page<T> springPage) {
        PagedResponse<T> response = new PagedResponse<>();
        response.setContent(springPage.getContent());
        response.setPage(springPage.getNumber());
        response.setSize(springPage.getSize());
        response.setTotalElements(springPage.getTotalElements());
        response.setTotalPages(springPage.getTotalPages());
        response.setLast(springPage.isLast());
        return response;
    }

    public List<T> getContent() { return content; }
    public void setContent(List<T> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean isLast() { return last; }
    public void setLast(boolean last) { this.last = last; }
}
